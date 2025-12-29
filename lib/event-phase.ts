import { Event } from "@prisma/client";

export type EventPhase =
  | "DRAFT"
  | "UPCOMING"
  | "NOMINATION"
  | "REVIEW"
  | "VOTING"
  | "ENDED"
  | "UNKNOWN";

export type PhaseStatus = {
  phase: EventPhase;
  isNominationOpen: boolean;
  isVotingOpen: boolean;
  nextKickoff?: Date;
};

/**
 * Determines the current phase of an event based on its timeline.
 *
 * Rules:
 * 1. NOMINATION: Present time is within [nominationStartsAt, nominationEndsAt)
 * 2. VOTING: Present time is within [votingStartsAt, votingEndsAt)
 * 3. FALLBACK: If dates are missing, fallback to explicit boolean flags (Legacy Support)
 */
export function getEventPhase(event: Partial<Event>): PhaseStatus {
  const now = new Date();

  // 1. Check Date-based Logic (Preferred)
  const nomStart = event.nominationStartsAt
    ? new Date(event.nominationStartsAt)
    : null;
  const nomEnd = event.nominationEndsAt
    ? new Date(event.nominationEndsAt)
    : null;
  const voteStart = event.votingStartsAt
    ? new Date(event.votingStartsAt)
    : null;
  const voteEnd = event.votingEndsAt ? new Date(event.votingEndsAt) : null;

  let isNominationOpen = false;
  let isVotingOpen = false;
  let phase: EventPhase = "UNKNOWN";

  // Check Nomination Window
  if (nomStart && nomEnd) {
    if (now >= nomStart && now < nomEnd) {
      isNominationOpen = true;
      phase = "NOMINATION";
    }
  } else if (event.isNominationOpen) {
    // Legacy fallback
    isNominationOpen = true;
    phase = "NOMINATION";
  }

  // Check Voting Window
  if (voteStart && voteEnd) {
    if (now >= voteStart && now < voteEnd) {
      isVotingOpen = true;
      phase = "VOTING";
    }
  } else if (event.isVotingOpen) {
    // Legacy fallback
    isVotingOpen = true;
    phase = "VOTING";
  }

  // Conflict / Precedence Logic
  // If both are open (Hybrid), we can report Hybrid or prefer Voting.
  // For standard "Phase" display, we usually show the most "Active" one.
  if (isNominationOpen && isVotingOpen) {
    // Hybrid Case? For now, let's say "VOTING" takes UI precedence if type is VOTING,
    // but maybe return a status that says both?
    // Let's rely on the boolean flags to control the UI gates.
  } else if (!isNominationOpen && !isVotingOpen) {
    // Determine if Pre or Post
    if (event.status === "DRAFT") {
      phase = "DRAFT";
    } else if (voteEnd && now >= voteEnd) {
      phase = "ENDED";
    } else if (nomEnd && now >= nomEnd && (!voteStart || now < voteStart)) {
      phase = "REVIEW"; // Period between Nomination and Voting
    } else if (nomStart && now < nomStart) {
      phase = "UPCOMING";
    }
  }

  return {
    phase,
    isNominationOpen,
    isVotingOpen,
  };
}
