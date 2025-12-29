"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export type GatewayConfig = {
  provider: string;
  isEnabled: boolean;
  priority: number;
  failureCount: number;
  lastFailure: Date | null;
};

export async function getGatewayConfigs(): Promise<GatewayConfig[]> {
  const configs = await db.paymentGatewayConfig.findMany({
    orderBy: { priority: "desc" },
  });

  // Ensure default rows exist if table is empty
  if (configs.length === 0) {
    await db.paymentGatewayConfig.createMany({
      data: [
        { provider: "APPSN", isEnabled: true, priority: 100 },
        { provider: "PAYSTACK", isEnabled: false, priority: 0 },
        { provider: "HUBTEL", isEnabled: false, priority: 0 },
      ],
      skipDuplicates: true,
    });
    return getGatewayConfigs(); // Retry
  }

  return configs.map((c) => ({
    provider: c.provider,
    isEnabled: c.isEnabled,
    priority: c.priority,
    failureCount: c.failureCount,
    lastFailure: c.lastFailure,
  }));
}

export async function setPrimaryGateway(provider: string) {
  try {
    // 1. Disable/Lower priority of others
    await db.paymentGatewayConfig.updateMany({
      data: { priority: 0, isEnabled: false }, // Enforce mutual exclusivity? Or just priority?
      // Requirement: "One gateway active at a time". So disable others.
    });

    // 2. Enable Target
    await db.paymentGatewayConfig.upsert({
      where: { provider },
      update: { isEnabled: true, priority: 100 },
      create: { provider, isEnabled: true, priority: 100 },
    });

    revalidatePath("/super-admin/finance");
    return { success: true };
  } catch (error) {
    console.error("Failed to set primary gateway", error);
    return { success: false, error: "Database update failed" };
  }
}

export async function resetFailureCount(provider: string) {
  try {
    await db.paymentGatewayConfig.update({
      where: { provider },
      data: { failureCount: 0, lastFailure: null },
    });
    revalidatePath("/super-admin/finance");
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}
