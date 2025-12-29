"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createNomination as engineCreateNomination,
  approveNomination as engineApproveNomination,
  rejectNomination as engineRejectNomination,
} from "@/lib/nominations/engine";

// --- Public Submission ---

export async function submitNomination(formData: any) {
  // Validate required fields (Basic validation, detailed validation should be client-side + schema check)
  if (!formData.eventId || !formData.nomineeName || !formData.nomineePhotoUrl) {
    return { success: false, message: "Missing required fields." };
  }

  try {
    const nomination = await engineCreateNomination({
      eventId: formData.eventId,
      categoryId: formData.categoryId,
      nominationType: formData.nominationType,
      nomineeName: formData.nomineeName,
      nomineeEmail: formData.nomineeEmail,
      nomineePhone: formData.nomineePhone,
      nomineePhotoUrl: formData.nomineePhotoUrl,
      bio: formData.bio,
      nominatorName: formData.nominatorName,
      nominatorEmail: formData.nominatorEmail,
      nominatorPhone: formData.nominatorPhone,
      customFields: formData.customFields,
    });

    return { success: true, data: nomination };
  } catch (error: any) {
    console.error("Submission Error:", error);
    return {
      success: false,
      message: error.message || "Failed to submit nomination.",
    };
  }
}

// --- Organizer / Admin Management ---

export async function getNominations(eventId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");

  // TODO: Add strict permission check (is organizer of event or super admin)

  const nominations = await prisma.nomination.findMany({
    where: { eventId },
    include: {
      category: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return nominations;
}

export async function getNominationById(id: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");

  return await prisma.nomination.findUnique({
    where: { id },
    include: {
      category: { select: { name: true } },
      event: { select: { title: true } },
    },
  });
}

export async function reviewNomination(
  id: string,
  action: "APPROVE" | "REJECT",
  reason?: string
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");

  try {
    if (action === "APPROVE") {
      await engineApproveNomination(id, session.user.id);
    } else {
      await engineRejectNomination(
        id,
        session.user.id,
        reason || "No reason provided"
      );
    }

    revalidatePath(`/organizer/events`);
    // Ideally revalidate specific event page, but we might not have eventId handy without fetching.
    return { success: true };
  } catch (error: any) {
    console.error("Review Error:", error);
    return { success: false, message: error.message };
  }
}
