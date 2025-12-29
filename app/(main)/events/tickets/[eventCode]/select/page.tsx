import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import { TicketSelectionClient } from "./TicketSelectionClient";

export default async function TicketSelectionPage({
  params,
}: {
  params: Promise<{ eventCode: string }>;
}) {
  const { eventCode } = await params;

  // Fetch event from database
  const event = await prisma.event.findFirst({
    where: { eventCode: eventCode },
    include: {
      ticketTypes: {
        where: { isActive: true },
        orderBy: { price: "asc" },
      },
      organizer: {
        select: { businessName: true, user: { select: { name: true } } },
      },
    },
  });

  if (!event) return notFound();

  // Transform Prisma data to match TicketingEvent type expected by Client Component
  const pageEvent = {
    id: event.id,
    title: event.title,
    eventCode: event.eventCode,
    image: event.coverImage || "/placeholder-event.jpg",
    category: event.type as any,
    date: event.startDate.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    time: event.startDate.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    venue: event.venue || event.location || "TBA",
    organizer: event.organizer.businessName || event.organizer.user.name,
    description: event.description || "",
    ticketTypes: event.ticketTypes.map((t) => ({
      id: t.id,
      name: t.name,
      price: Number(t.price),
      available: t.quantity - t.soldCount,
      description: t.description || "",
    })),
  };

  return <TicketSelectionClient event={pageEvent as any} />;
}
