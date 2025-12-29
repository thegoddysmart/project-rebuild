import db from "@/lib/db";

const FAIL_THRESHOLD = 3;

export async function getActiveOnlineGateway(): Promise<
  "APPSN" | "PAYSTACK" | "HUBTEL"
> {
  // 1. Try to find enabled gateway with highest priority
  try {
    const config = await db.paymentGatewayConfig.findFirst({
      where: { isEnabled: true },
      orderBy: { priority: "desc" },
    });

    if (config?.provider === "PAYSTACK") return "PAYSTACK";
    if (config?.provider === "APPSN") return "APPSN";
    // Default fallback
    return "APPSN";
  } catch (error) {
    console.error("Error fetching active gateway:", error);
    return "APPSN"; // Fallback safe
  }
}

export async function recordSuccess(provider: string) {
  try {
    // Reset failure count on success
    await db.paymentGatewayConfig.upsert({
      where: { provider },
      update: { failureCount: 0, lastFailure: null },
      create: { provider, failureCount: 0, priority: 0 },
    });
  } catch (error) {
    // Non-blocking error
    console.warn(`Failed to record success for ${provider}`, error);
  }
}

export async function recordFailure(provider: string) {
  try {
    const config = await db.paymentGatewayConfig.upsert({
      where: { provider },
      update: {
        failureCount: { increment: 1 },
        lastFailure: new Date(),
      },
      create: {
        provider,
        failureCount: 1,
        lastFailure: new Date(),
        priority: 0,
      },
    });

    if (config.failureCount > FAIL_THRESHOLD) {
      alertSuperAdmin(provider, config.failureCount);
    }
  } catch (error) {
    console.error(`Failed to record failure for ${provider}`, error);
  }
}

function alertSuperAdmin(provider: string, count: number) {
  // Placeholder for Email/SMS alert
  console.error(
    `[CRITICAL ALERT] Payment Gateway ${provider} has failed ${count} consecutive times! Check Dashboard.`
  );
  // In real app: sendEmail("admin@easevote.com", "Gateway Failure Alert", ...)
}
