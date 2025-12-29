import prisma from "@/lib/db";
import EventsBrowseClient from "./EventsBrowseClient";
import { getEventPhase } from "@/lib/event-phase";

export const dynamic = "force-dynamic"; // Ensure fresh data on every request

export default async function VotingEventsPage() {
  // Fetch Voting events from database
  // You might want to filter only LIVE/ENDED or check permissions, but for public browsing, typically we show LIVE/Upcoming/Ended.
  // We exclude DRAFT/PENDING_REVIEW unless we want to show them? Usually public page only shows approved.
  // For simplicity matching previous behavior (which showed all mocks), let's show all that are not strictly private drafts if possible,
  // OR just filter by status in the UI.
  // However, "Preview Mode" logic usually hides drafts. Let's filter to public visible statuses for safety.

  const events = await prisma.event.findMany({
    where: {
      type: { in: ["VOTING", "HYBRID"] },
      status: {
        in: ["PUBLISHED", "LIVE", "ENDED", "APPROVED", "PAUSED"], // Include PUBLISHED and HYBRID events
      },
    },
    orderBy: {
      startDate: "desc",
    },
  });

  // Map Prisma events to Client events
  const clientEvents = events.map((event) => {
    // Extract category from metadata or fallback
    const metadata = event.metadata as Record<string, any> | null;
    const category = metadata?.category || "General";

    // Determine Phase Logic
    const { phase } = getEventPhase(event);

    // Format date string (Dynamic Timeline)
    let dateStr = new Date(event.startDate).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    if (phase === "NOMINATION" && event.nominationEndsAt) {
      const daysLeft = Math.ceil(
        (new Date(event.nominationEndsAt).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      );
      dateStr =
        daysLeft > 0 ? `Noms close in ${daysLeft} days` : "Nominations Closing";
    } else if (phase === "VOTING" && event.votingEndsAt) {
      const daysLeft = Math.ceil(
        (new Date(event.votingEndsAt).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      );
      dateStr =
        daysLeft > 0 ? `Voting ends in ${daysLeft} days` : "Voting Ending";
    } else if (phase === "UPCOMING") {
      dateStr = "Upcoming";
    } else if (phase === "ENDED") {
      dateStr = "Ended";
    }

    return {
      id: event.id,
      title: event.title,
      eventCode: event.eventCode,
      category: category,
      image: event.coverImage || "/placeholder-event.jpg", // ensuring fallback
      date: dateStr, // Dynamic timeline string
      status: event.status,
      location: event.venue || event.location || "Online",
      votePrice: event.votePrice ? Number(event.votePrice) : 0,
    };
  });

  return <EventsBrowseClient initialEvents={clientEvents} />;
}
