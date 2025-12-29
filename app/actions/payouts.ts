"use server";

import db from "@/lib/db";
import { getOrganizerBalance } from "@/lib/finance/commission";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export async function requestPayout(data: {
  amount: number;
  method: string;
  bankName: string;
  number: string;
  name: string;
}) {
  try {
    // 1. Auth Check
    // Mocking auth for now as standard pattern
    const session = await getServerSession(authOptions); // Replace with actual auth call
    if (!session?.user?.email) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { organizerProfile: true },
    });

    if (!user?.organizerProfile) throw new Error("Organizer profile not found");
    const organizerId = user.organizerProfile.id;

    // 2. Balance Check
    const { availableBalance } = await getOrganizerBalance(organizerId);

    if (data.amount <= 0) throw new Error("Invalid amount");
    if (data.amount > availableBalance) {
      throw new Error(`Insufficient funds. Available: ${availableBalance}`);
    }

    // 3. Create Payout Request
    // @ts-ignore: 'method' is present in DB but TS types might be stale
    await db.payout.create({
      data: {
        organizerId,
        amount: data.amount,
        netAmount: data.amount, // No fee on payout for now?
        currency: "GHS",
        status: "PENDING",
        method: data.method,
        bankName: data.bankName,
        bankAccountNumber: data.number,
        bankAccountName: data.name,
        notes: "User requested payout",
      },
    });

    revalidatePath("/admin/payouts");
    return { success: true };
  } catch (error: any) {
    console.error("Payout Request Failed:", error);
    return { success: false, error: error.message };
  }
}

export async function getFinancialSummary() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    include: { organizerProfile: true },
  });

  if (!user?.organizerProfile) return null;

  return await getOrganizerBalance(user.organizerProfile.id);
}

export async function getPayoutHistory() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    include: { organizerProfile: true },
  });

  if (!user?.organizerProfile) return [];

  const payouts = await db.payout.findMany({
    where: { organizerId: user.organizerProfile.id },
    orderBy: { createdAt: "desc" },
  });

  return payouts;
}
