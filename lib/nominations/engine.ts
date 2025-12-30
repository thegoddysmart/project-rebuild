import prisma from "@/lib/db";
import { NominationStatus } from "@prisma/client";
import { sendNominationStatusEmail } from "@/lib/email";

/**
 * Approves a nomination and atomically creates a candidate.
 * This guarantees that every APPROVED nomination has a corresponding candidate.
 */
export async function approveNomination(
  nominationId: string,
  reviewerId: string
) {
  // 1. Perform DB updates
  const result = await prisma.$transaction(async (tx) => {
    // Fetch Nomination with User/Event details for email
    const nomination = await tx.nomination.findUniqueOrThrow({
      where: { id: nominationId },
      include: { event: true }, // Need event title
    });

    if (nomination.status === "APPROVED") {
      throw new Error("Nomination is already approved.");
    }

    if (nomination.status === "REJECTED" || nomination.status === "WITHDRAWN") {
      throw new Error(`Cannot approve a ${nomination.status} nomination.`);
    }

    const finalBio =
      nomination.bio || `Candidate for ${nomination.nominationType} nomination`;

    const candidateCode = `C${Math.floor(1000 + Math.random() * 9000)}`; // Simple random code

    const candidate = await tx.candidate.create({
      data: {
        categoryId: nomination.categoryId,
        code: candidateCode,
        name: nomination.nomineeName,
        image: nomination.nomineePhotoUrl,
        bio: finalBio,
        nominationId: nomination.id,
        isActive: true,
      },
    });

    await tx.nomination.update({
      where: { id: nominationId },
      data: {
        status: "APPROVED",
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
    });

    return { candidate, nomination };
  });

  // 2. Send Email (Side Effect - Outside Transaction)
  if (result.nomination.nomineeEmail) {
    // Fire and forget (don't await to block response)
    sendNominationStatusEmail(
      result.nomination.nomineeEmail,
      result.nomination.nomineeName,
      "APPROVED",
      result.nomination.event.title
    ).catch(console.error);
  }

  return result.candidate;
}

/**
 * Rejects a nomination.
 */
export async function rejectNomination(
  nominationId: string,
  reviewerId: string,
  reason: string
) {
  const nomination = await prisma.nomination.update({
    where: { id: nominationId },
    data: {
      status: "REJECTED",
      rejectionReason: reason,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    },
    include: { event: true },
  });

  // Send Email
  if (nomination.nomineeEmail) {
    sendNominationStatusEmail(
      nomination.nomineeEmail,
      nomination.nomineeName,
      "REJECTED",
      nomination.event.title,
      reason
    ).catch(console.error);
  }

  return nomination;
}

/**
 * Submits a new nomination.
 * This is a lower-level function. Higher level actions should handle file uploads/validation.
 */
export async function createNomination(data: {
  eventId: string;
  categoryId: string;
  nominationType: "SELF" | "THIRD_PARTY";
  nomineeName: string;
  nomineeEmail?: string;
  nomineePhone?: string;
  nomineePhotoUrl: string;
  bio?: string;
  nominatorName?: string;
  nominatorEmail?: string;
  nominatorPhone?: string;
  customFields?: any;
}) {
  // Optional: Add specific business logic validation here (e.g. check duplicate email per event)

  return await prisma.nomination.create({
    data: {
      eventId: data.eventId,
      categoryId: data.categoryId,
      nominationType: data.nominationType,
      nomineeName: data.nomineeName,
      nomineeEmail: data.nomineeEmail,
      nomineePhone: data.nomineePhone,
      nomineePhotoUrl: data.nomineePhotoUrl,
      bio: data.bio,
      nominatorName: data.nominatorName,
      nominatorEmail: data.nominatorEmail,
      nominatorPhone: data.nominatorPhone,
      customFields: data.customFields || {},
      status: "PENDING",
    },
  });
}
