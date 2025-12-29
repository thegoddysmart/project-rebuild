"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function submitEventForReview(eventId: string) {
  try {
    // 1. Check if event meets criteria (optional but good practice)
    // e.g. has title, start date, etc.
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: {
        categories: true,
        ticketTypes: true,
      },
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    if (event.status !== "DRAFT") {
      return { success: false, error: "Event is typically not in Draft" };
    }

    // 2. Update status
    await db.event.update({
      where: { id: eventId },
      data: { status: "PENDING_REVIEW" },
    });

    revalidatePath(`/organizer/events/${eventId}`);
    revalidatePath("/organizer/events");

    return { success: true };
  } catch (error) {
    console.error("Error submitting event:", error);
    return { success: false, error: "Failed to submit event" };
  }
}

export async function publishEvent(eventId: string) {
  try {
    const event = await db.event.findUnique({
      where: { id: eventId },
    });

    if (!event) return { success: false, error: "Event not found" };

    if (event.status !== "APPROVED" && event.status !== "PAUSED") {
      return {
        success: false,
        error: "Event must be Approved or Paused to publish",
      };
    }

    await db.event.update({
      where: { id: eventId },
      data: {
        status: "LIVE",
        publishedAt: event.publishedAt || new Date(), // Set publishedAt if first time
      },
    });

    revalidatePath(`/organizer/events/${eventId}`);
    revalidatePath("/organizer/events");

    return { success: true };
  } catch (error) {
    console.error("Error publishing event:", error);
    return { success: false, error: "Failed to publish event" };
  }
}
