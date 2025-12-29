import { notFound } from "next/navigation";
import VoteClient from "./VoteClient";
import prisma from "@/lib/db";

export default async function VotePage({
  params,
}: {
  params: Promise<{ eventCode: string; candidateId: string }>;
}) {
  const { eventCode, candidateId } = await params;

  // Fetch real event and candidate
  const event = await prisma.event.findFirst({
    where: { eventCode: eventCode },
    include: {
      categories: {
        include: {
          candidates: true,
        },
      },
    },
  });

  if (!event) return notFound();

  // Find candidate in the event's categories
  const candidate = event.categories
    .flatMap((c) => c.candidates)
    .find((c) => c.id === candidateId);

  if (!candidate) return notFound();

  // Safe transformation for client
  const clientEvent = {
    ...event,
    votePrice: event.votePrice ? Number(event.votePrice) : 0,
    location: event.location || "Accra, Ghana",
    totalRevenue: Number(event.totalRevenue),
  };

  return (
    <VoteClient
      event={clientEvent as any}
      candidate={{ ...candidate, image: candidate.image ?? "" }}
    />
  );
}
