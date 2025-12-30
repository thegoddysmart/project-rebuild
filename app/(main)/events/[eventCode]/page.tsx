import { notFound } from "next/navigation";
import EventDetailClient from "./EventDetailClient";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PreviewBanner } from "@/components/preview/PreviewBanner";
import EventStatusNotification from "./EventStatusNotification";
import { getEventPhase } from "@/lib/event-phase";

interface PageProps {
  params: Promise<{
    eventCode: string;
  }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const { eventCode } = await params;

  // Fetch event from database
  const event = await prisma.event.findFirst({
    where: { eventCode: eventCode },
    include: {
      categories: {
        include: {
          candidates: true,
        },
        orderBy: { sortOrder: "asc" },
      },
      ticketTypes: true,
    },
  });

  if (!event) {
    return notFound();
  }

  // Permissions Check for Visibility
  const session = await getServerSession(authOptions);
  let isAuthorized = false;

  if (session) {
    const userRole = session.user?.role;
    const organizerId = session.user?.organizerId;
    const isOwner = organizerId === event.organizerId;
    const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
    isAuthorized = isOwner || isAdmin;
  }

  // Preview Mode Logic
  let showPreviewBanner = false;

  // Support both PUBLISHED and legacy LIVE
  const isPublished = event.status === "PUBLISHED" || event.status === "LIVE";

  if (!isPublished) {
    if (!isAuthorized) {
      // Not authorized to view draft/private event
      return notFound();
    }
    showPreviewBanner = true;
  }

  // Determine Phase Logic
  const { isVotingOpen, isNominationOpen, phase } = getEventPhase(event);

  // Timeline Display Logic
  let timelineLabel = new Date(event.startDate).toDateString(); // Default fallback
  let timelineEnd: Date | null = null;

  if (phase === "NOMINATION") {
    if (event.nominationEndsAt) {
      timelineLabel = `Nominations close ${new Date(
        event.nominationEndsAt
      ).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      timelineEnd = new Date(event.nominationEndsAt);
    } else {
      timelineLabel = "Nominations Open";
    }
  } else if (phase === "VOTING") {
    if (event.votingEndsAt) {
      timelineLabel = `Voting ends ${new Date(
        event.votingEndsAt
      ).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      timelineEnd = new Date(event.votingEndsAt);
    } else {
      timelineLabel = "Voting Live";
    }
  } else if (phase === "UPCOMING") {
    if (event.nominationStartsAt) {
      timelineLabel = `Nominations start ${new Date(
        event.nominationStartsAt
      ).toLocaleDateString()}`;
    } else if (event.votingStartsAt) {
      timelineLabel = `Voting starts ${new Date(
        event.votingStartsAt
      ).toLocaleDateString()}`;
    }
  } else if (phase === "ENDED") {
    timelineLabel = "Event Ended";
  }

  // Filter Logic: Hide Candidates based on Phase and Visibility Settings
  // 1. If Organizer/Admin, always show.
  // 2. If 'showLiveResults' is TRUE, always show (Public Results).
  // 3. Otherwise, only show if Voting is OPEN (Active Phase).
  // 4. Ideally, we shouldn't show candidates during "Upcoming" unless specifically desired, but usually they are revealed at Voting Start.
  //    Actually, "Nominees" are usually announced BEFORE voting starts.
  //    But current logic was "strip if !isVotingOpen".
  //    Let's relax it: Show if isVotingOpen OR showLiveResults OR phase is ENDED?
  //    Actually, if showLiveResults is checked, we show them.
  //    If not checked, we respect the isVotingOpen (maybe? or just rely on phase).

  // Revised Logic:
  // Hide candidates ONLY IF:
  // - User is not authorized
  // - AND Voting is NOT Open
  // - AND Live Results are NOT enabled
  // - AND Phase is not ENDED (If ended and no live results, usually we show results? Or maybe we hide them if organizer wants?)

  // SAFEST LOGIC based on user request "I'm not seeing it" (implying they expect to see it because they turned the toggle ON):
  // If `event.showLiveResults` is true, SHOW EVERYTHING.

  let visibleCategories = event.categories;

  if (!isAuthorized && !isVotingOpen && !event.showLiveResults) {
    // Check one more case: Is phase ENDED?
    // If Ended and showLiveResults is False, do we show? probably not.
    // If phase is NOMINATION, we definitely hide.
    visibleCategories = event.categories.map((cat: any) => ({
      ...cat,
      candidates: [],
    }));
  }

  // Safe transformation for client
  const clientEvent: any = {
    ...event,
    // Override flags with calculated logic
    isVotingOpen,
    isNominationOpen,
    phase, // Pass phase string if needed by client
    date: timelineLabel, // Override the 'date' field
    timelineEnd: timelineEnd?.toISOString() || null, // Pass end date for countdown if needed
    categories: visibleCategories,
    votePrice: event.votePrice ? Number(event.votePrice) : 0,
    totalRevenue: Number(event.totalRevenue),
    showLiveResults: event.showLiveResults,
    showVoteCount: event.showVoteCount,

    ticketTypes: event.ticketTypes.map((ticket: any) => ({
      ...ticket,
      price: Number(ticket.price),
    })),
  };

  return (
    <>
      <EventStatusNotification event={clientEvent} />
      {showPreviewBanner && <PreviewBanner status={event.status} />}
      <EventDetailClient event={clientEvent} />
    </>
  );
}
