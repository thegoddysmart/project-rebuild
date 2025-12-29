import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ResultsDashboardClient from "./ResultsDashboardClient";

export default async function VoteResultsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.organizerId) {
    redirect("/auth/signin");
  }

  // Fetch Voting & Hybrid Events with full hierarchy
  const events = await prisma.event.findMany({
    where: {
      organizerId: session.user.organizerId,
      type: { in: ["VOTING", "HYBRID"] },
    },
    select: {
      id: true,
      title: true,
      eventCode: true,
      status: true,
      totalVotes: true,
      totalRevenue: true,
      categories: {
        select: {
          id: true,
          name: true,
          totalVotes: true,
          candidates: {
            select: {
              id: true,
              name: true,
              code: true,
              voteCount: true,
              image: true,
            },
            orderBy: {
              voteCount: "desc",
            },
          },
        },
        orderBy: {
          totalVotes: "desc", // Most popular categories first
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Serialize Decimal types if necessary (though totalRevenue is Decimal)
  // We need to convert Decimal to number/string for Client Component
  const serializedEvents = events.map((event) => ({
    ...event,
    totalRevenue: Number(event.totalRevenue),
  }));

  return <ResultsDashboardClient events={serializedEvents} />;
}
