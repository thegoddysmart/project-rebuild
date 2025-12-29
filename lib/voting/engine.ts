import db from "@/lib/db";
import { PaymentGateway, InitPaymentInput } from "@/lib/payments/types";
import { getPaymentGateway } from "@/lib/payments/factory";
import { getActiveOnlineGateway } from "@/lib/payments/monitor";
import { EventStatus, Transaction, TransactionStatus } from "@prisma/client";

/**
 * Creates a pending Transaction which acts as the "Vote Intent".
 */
export async function createVoteIntent(data: {
  eventId: string;
  candidateId: string;
  quantity: number;
  voterName?: string;
  voterPhone?: string;
  voterEmail?: string;
}) {
  const { eventId, candidateId, quantity, voterName, voterPhone, voterEmail } =
    data;

  // 1. Validation
  const event = await db.event.findUnique({
    where: { id: eventId },
    include: { categories: { include: { candidates: true } } },
  });

  if (!event || event.status !== EventStatus.LIVE) {
    throw new Error("Voting is not open for this event");
  }

  // 2. Pricing Logic
  // Fetch actual price from event settings. Fallback to 1.0 if not set.
  const pricePerVote = event.votePrice ? Number(event.votePrice) : 1.0;
  const amount = quantity * pricePerVote;

  // 2. Select Active Gateway
  const provider = await getActiveOnlineGateway();

  // 3. Create Transaction (Pending) - This IS the Intent
  const reference = `VOTE-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  const transaction = await db.transaction.create({
    data: {
      eventId,
      reference,
      amount,
      netAmount: amount, // Logic for commission should apply on success confirm
      currency: "GHS",
      status: TransactionStatus.PENDING,
      paymentMethod: "MOBILE_MONEY", // Default, will update
      paymentProvider: provider,
      type: "VOTE",
      isSimulated: provider === "APPSN" || provider === "PAYSTACK", // For now based on provider name
      simulationProvider: provider,
      customerName: voterName,
      customerEmail: voterEmail,
      customerPhone: voterPhone,
      metadata: {
        candidateId,
        quantity,
        isVoteIntent: true,
      },
    },
  });

  return { transaction, provider };
}

/**
 * Confirms a vote after successful payment.
 * MUST be idempotent.
 */
export async function confirmVote(transactionId: string) {
  // Execute logic inside a transaction
  const result = await db.$transaction(async (prismaTx) => {
    // 1. Fetch Transaction
    const tx = await prismaTx.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!tx || tx.type !== "VOTE") return null;

    // 2. Idempotency Check
    if (tx.status === TransactionStatus.SUCCESS) {
      // Check if votes created?
      const existingVotes = await prismaTx.vote.count({
        where: { transactionId },
      });
      if (existingVotes > 0)
        return { success: true, message: "Already confirmed" };
    }

    // 3. Mark Transaction Success
    await prismaTx.transaction.update({
      where: { id: transactionId },
      data: { status: TransactionStatus.SUCCESS, paidAt: new Date() },
    });

    // 4. Create Votes (Atomic)
    const meta = tx.metadata as any;
    const candidateId = meta?.candidateId;
    const quantity = Number(meta?.quantity || 1);

    if (!candidateId) throw new Error("Missing candidateId in metadata");

    await prismaTx.vote.create({
      data: {
        candidateId,
        transactionId: tx.id,
        quantity,
        voterName: tx.customerName,
        voterPhone: tx.customerPhone,
        voterEmail: tx.customerEmail,
        metadata: meta,
      },
    });

    // 4a. Update Candidates & Categories (Atomic Increment)
    await prismaTx.candidate.update({
      where: { id: candidateId },
      data: { voteCount: { increment: quantity } },
    });

    // Fetch categoryId since we don't have it directly in meta usually
    const candidate = await prismaTx.candidate.findUnique({
      where: { id: candidateId },
      select: { categoryId: true },
    });
    if (candidate) {
      await prismaTx.eventCategory.update({
        where: { id: candidate.categoryId },
        data: { totalVotes: { increment: quantity } },
      });
    }

    // 4b. Update Event Aggregates
    const amount = Number(tx.amount);
    await prismaTx.event.update({
      where: { id: tx.eventId },
      data: {
        totalVotes: { increment: quantity },
        totalRevenue: { increment: amount },
      },
    });

    // 4c. Update Organizer Aggregates (Profile)
    const eventForOrg = await prismaTx.event.findUnique({
      where: { id: tx.eventId },
      select: { organizerId: true },
    });
    if (eventForOrg) {
      // Just increment revenue, balance/commission logic handled elsewhere or later
      await prismaTx.organizerProfile.update({
        where: { id: eventForOrg.organizerId },
        data: {
          totalRevenue: { increment: amount },
        },
      });
    }

    return { success: true, eventId: tx.eventId };
  });

  if (!result) return;
  if ("message" in result && result.message) return result;

  // 5. Revalidate Paths (After Commit)
  const { revalidatePath } = require("next/cache");
  revalidatePath(`/events/[eventCode]`);
  // We have tx.eventId. Let's fetch eventCode or just revalidate generic paths if possible?
  // We can't easily get eventCode without query.
  // But we can revalidate the specific results page if we knew the code.
  // Actually, let's just revalidate the "layout" or specific admin paths.
  revalidatePath("/admin/events");
  // For the public page, we need eventCode.
  // Let's fetch event to get code?
  const eventFull = await db.event.findUnique({
    where: { id: result.eventId },
  });
  if (eventFull) {
    revalidatePath(`/events/${eventFull.eventCode}`);
    revalidatePath(`/events/${eventFull.eventCode}/results`);
  }

  return { success: true };
}

import { unstable_cache } from "next/cache";

/**
 * Aggregates live results for an event.
 * Cached for 15 seconds to prevent DB flooding.
 */
export const getLiveResults = unstable_cache(
  async (eventId: string) => {
    // 1. Fetch Candidates (to ensure we show 0 votes for those with none)
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: { categories: { include: { candidates: true } } },
    });

    if (!event) return null;

    // 2. Fetch Vote Counts (Group By Candidate)
    const voteCounts = await db.vote.groupBy({
      by: ["candidateId"],
      where: { candidate: { category: { eventId } } },
      _sum: { quantity: true },
    });

    // Map to easy lookup
    const countMap = new Map<string, number>();
    voteCounts.forEach((g) => {
      if (g.candidateId && g._sum.quantity !== null) {
        countMap.set(g.candidateId, g._sum.quantity);
      }
    });

    // 3. Structure Output
    const results = event.categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      candidates: cat.candidates
        .map((c) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          image: c.image || "",
          votes: countMap.get(c.id) || 0,
        }))
        .sort((a, b) => b.votes - a.votes), // Lead first
    }));

    return {
      eventId: event.id,
      title: event.title,
      status: event.status, // Ensure status is returned for UI checks
      showVoteCount: event.showVoteCount,
      results,
    };
  },
  ["event-results"], // Cache Key
  { revalidate: 15, tags: ["votes"] }
);
