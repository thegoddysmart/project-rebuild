import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import EarningsDashboardClient from "./EarningsDashboardClient";

export default async function EarningsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.organizerId) {
    redirect("/auth/signin");
  }

  // Fetch Organizer Profile for Balance & Revenue
  const profile = await prisma.organizerProfile.findUnique({
    where: { id: session.user.organizerId },
    select: {
      balance: true,
      totalRevenue: true,
    },
  });

  if (!profile) {
    // Should not happen if user has organizerId, but safety check
    redirect("/organizer/onboarding");
  }

  // Fetch Recent Transactions
  // We want transactions related to events owned by this organizer
  const transactions = await prisma.transaction.findMany({
    where: {
      event: {
        organizerId: session.user.organizerId,
      },
    },
    include: {
      event: {
        select: {
          title: true,
        },
      },
      votes: {
        select: {
          metadata: true, // To get voter name if possible, though transaction usually has customer details
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50, // Limit to last 50 for performance
  });

  // Serialize Decimal to Number for Client Component
  const stats = {
    balance: Number(profile.balance),
    totalRevenue: Number(profile.totalRevenue),
  };

  const formattedTransactions = transactions.map((tx) => ({
    id: tx.id,
    reference: tx.reference,
    type: tx.type,
    amount: Number(tx.amount),
    status: tx.status,
    createdAt: tx.createdAt.toISOString(),
    eventName: tx.event.title,
    customerName:
      tx.customerName ||
      (tx.metadata as any)?.voterName ||
      (tx.metadata as any)?.holderName ||
      "Guest",
    paymentMethod: tx.paymentMethod,
  }));

  return (
    <EarningsDashboardClient
      stats={stats}
      transactions={formattedTransactions}
    />
  );
}
