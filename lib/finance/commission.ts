import db from "@/lib/db";

export type CommissionSplit = {
  amount: number;
  platformFee: number;
  organizerNet: number;
  rate: number;
};

/**
 * Calculates the commission split for a given amount and organizer rate.
 */
export function calculateSplit(
  amount: number,
  ratePercent: number
): CommissionSplit {
  const rate = ratePercent / 100;
  const platformFee = Number((amount * rate).toFixed(2));
  const organizerNet = Number((amount - platformFee).toFixed(2));

  return {
    amount,
    platformFee,
    organizerNet,
    rate: ratePercent,
  };
}

/**
 * Retrieves the live calculated balance for an organizer.
 * Considers ONLY 'SUCCESS' transactions and 'COMPLETED' or 'PROCESSING' payouts.
 */
export async function getOrganizerBalance(organizerId: string) {
  // 1. Get total revenue (Sum of SUCCESS transactions netAmount)
  const revenueAgg = await db.transaction.aggregate({
    where: {
      event: { organizerId },
      status: "SUCCESS",
    },
    _sum: {
      netAmount: true,
      amount: true,
      commission: true,
    },
  });

  const totalRevenue = Number(revenueAgg._sum.netAmount || 0);
  const grossSale = Number(revenueAgg._sum.amount || 0);
  const totalCommission = Number(revenueAgg._sum.commission || 0);

  // 2. Get total payouts (Sum of Payouts that are not FAILED/CANCELLED)
  // We consider PENDING payouts as "Deducted" from Available Balance to prevent double-spend.
  const payoutAgg = await db.payout.aggregate({
    where: {
      organizerId,
      status: { in: ["PENDING", "PROCESSING", "COMPLETED"] },
    },
    _sum: {
      amount: true,
    },
  });

  const totalPayouts = Number(payoutAgg._sum.amount || 0);

  // 3. Available Balance
  const availableBalance = totalRevenue - totalPayouts;

  // 4. Get Pending (Waitlist) - e.g. potentially successful but held?
  // Or in this context, maybe "Pending Transactions"?
  // Payment Gateways usually settle instantly or fail.
  // But specific "Pending" transactions don't count towards balance yet.

  return {
    grossSale,
    totalCommission,
    lifetimeRevenue: totalRevenue, // Net after commission
    totalPayouts,
    availableBalance: Number(availableBalance.toFixed(2)),
  };
}
