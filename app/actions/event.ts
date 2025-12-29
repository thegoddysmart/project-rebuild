"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Toggles the Nomination Phase for an event.
 * Enforces Mutually Exclusive Logic: Cannot open Nomination if Voting is Open.
 */
export async function toggleNominationPhase(eventId: string, open: boolean) {
  try {
    const event = await db.event.findUnique({
      where: { id: eventId },
      select: { isVotingOpen: true, status: true, eventCode: true },
    });

    if (!event) return { success: false, error: "Event not found" };

    if (open && event.isVotingOpen) {
      return {
        success: false,
        error: "Cannot open Nomination Phase while Voting Phase is active.",
      };
    }

    // Update state and timestamps
    await db.event.update({
      where: { id: eventId },
      data: {
        isNominationOpen: open,
        // If opening, set start time if not set? Or just track status.
        // If closing, set end time? For now, we just toggle the boolean gate.
        nominationStartsAt: open ? new Date() : undefined, // Optional: capture start
      },
    });

    revalidatePath(`/organizer/events/${eventId}`);
    revalidatePath(`/organizer/events/${eventId}`);
    revalidatePath(`/events/${event.eventCode}`);
    return { success: true };
  } catch (error) {
    console.error("Error toggling nomination:", error);
    return { success: false, error: "Failed to update nomination status" };
  }
}

/**
 * Toggles the Voting Phase for an event.
 * Enforces Mutually Exclusive Logic: Cannot open Voting if Nomination is Open.
 */
export async function toggleVotingPhase(eventId: string, open: boolean) {
  try {
    const event = await db.event.findUnique({
      where: { id: eventId },
      select: { isNominationOpen: true, status: true, eventCode: true },
    });

    if (!event) return { success: false, error: "Event not found" };

    // Strict Rule: Nominations must be closed before Voting starts
    if (open && event.isNominationOpen) {
      return {
        success: false,
        error: "Cannot open Voting Phase while Nomination Phase is active.",
      };
    }

    // Strict Rule: Event must be PUBLISHED (Organizers can only open voting after admins approve & they publish)
    // Actually, "Publish" might be the step that makes the EVENT page visible.
    // Voting toggle effectively makes the "Candidates" visible and "Vote Buttons" active.
    if (open && event.status !== "PUBLISHED" && event.status !== "LIVE") {
      // Allow LIVE for backward compat
      return {
        success: false,
        error: "Event must be PUBLISHED before Voting can go live.",
      };
    }

    await db.event.update({
      where: { id: eventId },
      data: {
        isVotingOpen: open,
        votingStartsAt: open ? new Date() : undefined,
      },
    });

    revalidatePath(`/organizer/events/${eventId}`);
    revalidatePath(`/organizer/events/${eventId}`);
    revalidatePath(`/events/${event.eventCode}`); // Public page
    return { success: true };
  } catch (error) {
    console.error("Error toggling voting:", error);
    return { success: false, error: "Failed to update voting status" };
  }
}

/**
 * Final Publish Action by Organizer.
 * Only allowed if Admin has APPROVED the event.
 */
export async function publishEvent(eventId: string) {
  try {
    const event = await db.event.findUnique({
      where: { id: eventId },
      select: { status: true },
    });

    if (!event) return { success: false, error: "Event not found" };

    if (event.status !== "APPROVED") {
      return {
        success: false,
        error: "Event must be APPROVED by an Admin before publishing.",
      };
    }

    await db.event.update({
      where: { id: eventId },
      data: {
        status: "LIVE",
        publishedAt: new Date(),
      },
    });

    revalidatePath(`/organizer/events`);
    return { success: true };
  } catch (error) {
    console.error("Error publishing event:", error);
    return { success: false, error: "Failed to publish event" };
  }
}

/**
 * Update Event Phase Timelines
 * Used for deterministic phase control.
 */
export async function updateEventTimelines(
  eventId: string,
  timelines: {
    nominationStartsAt?: Date | null;
    nominationEndsAt?: Date | null;
    votingStartsAt?: Date | null;
    votingEndsAt?: Date | null;
  }
) {
  try {
    const event = await db.event.findUnique({
      where: { id: eventId },
      select: { eventCode: true },
    });

    if (!event) return { success: false, error: "Event not found" };

    // Basic Validation
    if (
      timelines.nominationStartsAt &&
      timelines.nominationEndsAt &&
      timelines.nominationEndsAt <= timelines.nominationStartsAt
    ) {
      return { success: false, error: "Nomination End must be after Start." };
    }

    if (
      timelines.votingStartsAt &&
      timelines.votingEndsAt &&
      timelines.votingEndsAt <= timelines.votingStartsAt
    ) {
      return { success: false, error: "Voting End must be after Start." };
    }

    // Overlap Validation (Strict as requested)
    // If both phases are defined, Voting Start should be >= Nomination End
    // Only check if we have all 4 dates for simplicity, or check relative if partials provided
    // For now, let's implement loose check: If we have Nom End and Vote Start...
    if (
      timelines.nominationEndsAt &&
      timelines.votingStartsAt &&
      timelines.votingStartsAt < timelines.nominationEndsAt
    ) {
      return {
        success: false,
        error: "Voting cannot start before Nomination ends.",
      };
    }

    await db.event.update({
      where: { id: eventId },
      data: {
        nominationStartsAt: timelines.nominationStartsAt,
        nominationEndsAt: timelines.nominationEndsAt,
        votingStartsAt: timelines.votingStartsAt,
        votingEndsAt: timelines.votingEndsAt,
        // We do NOT toggle the boolean flags here anymore, but we could sync them?
        // Let's rely on the getter helper logic.
        // OR, for backward compatibility, we set them to TRUE if "NOW" falls in range?
        // No, let's treat the boolean flags as "Legacy Override" or keep them decoupled.
        // Better: Set them to false to force Date-logic to take over if we want to deprecate them?
        // Risky. Let's leave them as-is.
      },
    });

    revalidatePath(`/organizer/events/${eventId}`);
    revalidatePath(`/events/${event.eventCode}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating timelines:", error);
    return { success: false, error: "Failed to update timelines" };
  }
}

/**
 * Update Event Visibility Settings
 * Controls whether Public Results and Vote Counts are visible.
 */
export async function updateEventVisibility(
  eventId: string,
  settings: {
    showLiveResults?: boolean;
    showVoteCount?: boolean;
  }
) {
  try {
    const event = await db.event.findUnique({
      where: { id: eventId },
      select: { eventCode: true },
    });

    if (!event) return { success: false, error: "Event not found" };

    await db.event.update({
      where: { id: eventId },
      data: {
        ...settings,
      },
    });

    revalidatePath(`/organizer/events/${eventId}`);
    revalidatePath(`/events/${event.eventCode}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating visibility:", error);
    return { success: false, error: "Failed to update visibility settings" };
  }
}
