import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/db";
import { getEventNominationForm } from "@/app/actions/nomination-form";
import NominationWrapper from "./NominationWrapper";

interface PageProps {
  searchParams: Promise<{
    eventCode?: string;
  }>;
}

export default async function NominationPage({ searchParams }: PageProps) {
  const { eventCode } = await searchParams;

  if (!eventCode) {
    redirect("/events");
  }

  const event = await prisma.event.findUnique({
    where: { eventCode },
    include: {
      categories: true,
    },
  });

  if (!event) {
    return notFound();
  }

  // Fetch the nomination form configuration
  let formConfig = await getEventNominationForm(event.id);

  // Serialize event for client
  const clientEvent: any = {
    ...event,
    votePrice: event.votePrice ? Number(event.votePrice) : 0,
    totalRevenue: Number(event.totalRevenue),
  };

  return <NominationWrapper event={clientEvent} formConfig={formConfig} />;
}
