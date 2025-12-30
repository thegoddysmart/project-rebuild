import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import NominationsDashboardClient from "./NominationsDashboardClient";

export default async function NominationsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.organizerId) {
    redirect("/auth/signin");
  }

  // Fetch all nominations for events owned by this organizer
  const nominations = await prisma.nomination.findMany({
    where: {
      event: {
        organizerId: session.user.organizerId,
      },
    },
    include: {
      category: {
        select: {
          name: true,
        },
      },
      event: {
        select: {
          id: true,
          title: true,
          eventCode: true,
          nominationForm: {
            select: {
              fields: {
                select: {
                  key: true,
                  label: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculate Stats
  const stats = {
    total: nominations.length,
    pending: nominations.filter((n) => n.status === "PENDING").length,
    approved: nominations.filter((n) => n.status === "APPROVED").length,
    rejected: nominations.filter((n) => n.status === "REJECTED").length,
  };

  // Serialize dates for client component
  const localizedNominations = nominations.map((n) => {
    // Create a map of custom field keys to labels for this nomination's event
    const fieldMap: Record<string, string> = {};
    if (n.event.nominationForm?.fields) {
      n.event.nominationForm.fields.forEach((f) => {
        fieldMap[f.key] = f.label;
      });
    }

    return {
      ...n,
      categoryName: n.category?.name || "Unknown",
      reason: n.bio,
      createdAt: n.createdAt.toISOString(),
      reviewedAt: n.reviewedAt?.toISOString() || null,
      updatedAt: n.updatedAt.toISOString(),
      fieldLabels: fieldMap, // Pass the map to client
    };
  });

  return (
    <NominationsDashboardClient
      initialNominations={localizedNominations}
      stats={stats}
    />
  );
}
