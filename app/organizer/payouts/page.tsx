import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PayoutHistoryClient from "./PayoutHistoryClient";

export default async function PayoutsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.organizerId) {
    redirect("/auth/signin");
  }

  // Fetch Payouts
  const payouts = await prisma.payout.findMany({
    where: {
      organizerId: session.user.organizerId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculate Stats
  const stats = {
    totalWithdrawn: payouts
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + Number(p.amount), 0),
    pendingAmount: payouts
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + Number(p.amount), 0),
    pendingCount: payouts.filter((p) => p.status === "PENDING").length,
  };

  // Serialize for Client
  const formattedPayouts = payouts.map((p) => ({
    id: p.id,
    amount: Number(p.amount),
    currency: p.currency,
    status: p.status,
    provider: p.bankName, // Map bankName to provider
    accountNumber: p.bankAccountNumber, // Map bankAccountNumber to accountNumber
    accountName: p.bankAccountName, // Map bankAccountName to accountName
    reference: p.reference || "N/A",
    createdAt: p.createdAt.toISOString(),
    processedAt: p.processedAt?.toISOString() || null,
  }));

  return <PayoutHistoryClient stats={stats} payouts={formattedPayouts} />;
}
