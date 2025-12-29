"use server";

import db from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth"; // Assuming you use next-auth for sessions
import { authOptions } from "@/lib/auth"; // Adjust path as per your project
import bcrypt from "bcryptjs";

export async function getAdminProfile() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return null;

    const user = await db.user.findUnique({
      where: { email: session.user.email! },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    return null;
  }
}

export async function updateAdminProfile(data: {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Optional: Check if email is being changed and if it's already taken
    if (data.email !== session.user.email) {
      const existing = await db.user.findUnique({
        where: { email: data.email },
      });
      if (existing) {
        return { success: false, error: "Email is already in use" };
      }
    }

    await db.user.update({
      where: { id: data.userId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        avatar: data.avatar,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating admin profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function changeAdminPassword(data: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}) {
  try {
    const user = await db.user.findUnique({
      where: { id: data.userId },
    });

    if (!user || !user.passwordHash) {
      return { success: false, error: "User not found" };
    }

    const isValid = await bcrypt.compare(
      data.currentPassword,
      user.passwordHash
    );
    if (!isValid) {
      return { success: false, error: "Incorrect current password" };
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    await db.user.update({
      where: { id: data.userId },
      data: { passwordHash: hashedPassword },
    });

    return { success: true };
  } catch (error) {
    console.error("Error changing admin password:", error);
    return { success: false, error: "Failed to change password" };
  }
}

export async function getAdminEvents(options?: {
  query?: string;
  status?: string;
  type?: string;
}) {
  try {
    const where: Prisma.EventWhereInput = {};

    if (options?.status && options.status !== "all") {
      where.status = options.status as any;
    }

    if (options?.type && options.type !== "all") {
      const types = options.type.split(",");
      if (types.length > 1) {
        where.type = { in: types as any[] };
      } else {
        where.type = options.type as any;
      }
    }

    if (options?.query) {
      where.OR = [
        { title: { contains: options.query, mode: "insensitive" } },
        { eventCode: { contains: options.query, mode: "insensitive" } },
        {
          organizer: {
            businessName: { contains: options.query, mode: "insensitive" },
          },
        },
        {
          organizer: {
            user: { name: { contains: options.query, mode: "insensitive" } },
          },
        },
      ];
    }

    const events = await db.event.findMany({
      where,
      include: {
        organizer: {
          select: {
            businessName: true,
            logo: true,
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedEvents = events.map((event) => ({
      id: event.id,
      eventCode: event.eventCode,
      title: event.title,
      organizer: {
        name: event.organizer.businessName || event.organizer.user.name,
        avatar:
          event.organizer.logo ||
          event.organizer.user.avatar ||
          (event.organizer.businessName || event.organizer.user.name)
            .substring(0, 2)
            .toUpperCase(),
      },
      type: event.type,
      status: event.status,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      stats: {
        votes: event.totalVotes,
        revenue: Number(event.totalRevenue),
        // For ticketing, we might want to sum ticket sales if needed, but the model has totalRevenue/totalVotes directly on Event which is convenient.
        // If needed, we could count tickets: ticketsSold: event.transactions.filter(t => t.type === 'TICKET' && t.status === 'SUCCESS').length
        // but for now let's use the aggregated fields.
      },
    }));

    return formattedEvents;
  } catch (error) {
    console.error("Error fetching admin events:", error);
    return [];
  }
}

import { revalidatePath } from "next/cache";

export async function updateEventStatus(eventId: string, status: string) {
  try {
    // Basic validation of status enum could be added here if strictness is needed
    // but Prisma will throw if invalid string is passed to an enum field anyway.

    await db.event.update({
      where: { id: eventId },
      data: { status: status as any }, // Cast to any or import EventStatus enum to be strict
    });

    revalidatePath("/admin/events");
    return { success: true };
  } catch (error) {
    console.error("Error updating event status:", error);
    return { success: false, error: "Failed to update status" };
  }
}

export async function getAdminEventDetails(eventId: string) {
  try {
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          select: {
            id: true,
            businessName: true,
            logo: true,
            businessEmail: true,
            businessPhone: true,
            user: {
              select: {
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        categories: {
          include: {
            candidates: {
              orderBy: { voteCount: "desc" },
            },
          },
        },
        ticketTypes: true,
      },
    });

    if (!event) return null;

    // Cast to any to avoid strict type checking issues with included relations
    const e = event as any;

    // Calculate derived stats
    const candidatesCount = e.categories.reduce(
      (acc: any, cat: any) => acc + cat.candidates.length,
      0
    );
    const ticketsSold = e.ticketTypes.reduce(
      (acc: any, t: any) => acc + t.soldCount,
      0
    );

    return {
      ...event,
      organizer: {
        id: e.organizer.id,
        name: e.organizer.businessName || e.organizer.user.name,
        email: e.organizer.businessEmail || e.organizer.user.email,
        phone: e.organizer.businessPhone || null,
        avatar: e.organizer.logo || e.organizer.user.avatar,
      },
      stats: {
        votes: event.totalVotes,
        revenue: Number(event.totalRevenue),
        candidatesCount,
        ticketTypesCount: event.ticketTypes.length,
        ticketsSold,
      },
    };
  } catch (error) {
    console.error("Error fetching admin event details:", error);
    return null;
  }
}

export async function getAdminVotingStats() {
  try {
    const aggregate = await db.event.aggregate({
      where: {
        type: { in: ["VOTING", "HYBRID"] },
      },
      _sum: {
        totalVotes: true,
        totalRevenue: true,
      },
      _count: {
        id: true,
      },
    });

    const activeCount = await db.event.count({
      where: {
        type: { in: ["VOTING", "HYBRID"] },
        status: "LIVE",
      },
    });

    return {
      totalVotes: aggregate._sum.totalVotes || 0,
      totalRevenue: Number(aggregate._sum.totalRevenue) || 0,
      totalEvents: aggregate._count.id || 0,
      activeEvents: activeCount,
    };
  } catch (error) {
    console.error("Error fetching admin voting stats:", error);
    return {
      totalVotes: 0,
      totalRevenue: 0,
      totalEvents: 0,
      activeEvents: 0,
    };
  }
}

export async function getAdminTicketingStats() {
  try {
    const revenueAggregate = await db.event.aggregate({
      where: {
        type: { in: ["TICKETING", "HYBRID"] },
      },
      _sum: {
        totalRevenue: true,
      },
      _count: {
        id: true,
      },
    });

    const ticketsAggregate = await db.ticketType.aggregate({
      where: {
        event: {
          type: { in: ["TICKETING", "HYBRID"] },
        },
      },
      _sum: {
        soldCount: true,
      },
    });

    const activeCount = await db.event.count({
      where: {
        type: { in: ["TICKETING", "HYBRID"] },
        status: "LIVE",
      },
    });

    return {
      totalRevenue: Number(revenueAggregate._sum.totalRevenue) || 0,
      ticketsSold: ticketsAggregate._sum.soldCount || 0,
      totalEvents: revenueAggregate._count.id || 0,
      activeEvents: activeCount,
    };
  } catch (error) {
    console.error("Error fetching admin ticketing stats:", error);
    return {
      totalRevenue: 0,
      ticketsSold: 0,
      totalEvents: 0,
      activeEvents: 0,
    };
  }
}

export async function getAdminApprovalStats() {
  try {
    const pendingCount = await db.event.count({
      where: {
        status: "PENDING_REVIEW",
      },
    });

    const votingPending = await db.event.count({
      where: {
        status: "PENDING_REVIEW",
        type: { in: ["VOTING", "HYBRID"] },
      },
    });

    const ticketingPending = await db.event.count({
      where: {
        status: "PENDING_REVIEW",
        type: { in: ["TICKETING", "HYBRID"] },
      },
    });

    return {
      totalPending: pendingCount,
      votingPending,
      ticketingPending,
    };
  } catch (error) {
    console.error("Error fetching admin approval stats:", error);
    return {
      totalPending: 0,
      votingPending: 0,
      ticketingPending: 0,
    };
  }
}

export async function getAdminOrganizers() {
  try {
    const organizers = await db.organizerProfile.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatar: true,
            createdAt: true,
            status: true,
          },
        },
        _count: {
          select: { events: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return organizers.map((org: any) => ({
      id: org.id,
      name: org.businessName || org.user.name,
      email: org.businessEmail || org.user.email,
      phone: org.businessPhone,
      avatar: org.logo || org.user.avatar,
      verificationStatus: org.verified ? "VERIFIED" : "PENDING",
      userStatus: org.user.status,
      eventsCount: org._count.events,
      totalRevenue: Number(org.totalRevenue),
      balance: Number(org.balance),
      joinedAt: org.user.createdAt,
    }));
  } catch (error) {
    console.error("Error fetching admin organizers:", error);
    return [];
  }
}

export async function getOrganizerDetails(organizerId: string) {
  try {
    const organizer = await db.organizerProfile.findUnique({
      where: { id: organizerId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            status: true,
            createdAt: true,
          },
        },
        events: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        payouts: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!organizer) return null;

    return {
      ...organizer,
      totalRevenue: Number(organizer.totalRevenue),
      balance: Number(organizer.balance),
      commissionRate: Number(organizer.commissionRate),
      events: organizer.events.map((e) => ({
        ...e,
        totalRevenue: Number(e.totalRevenue),
      })),
      payouts: organizer.payouts.map((p) => ({
        ...p,
        amount: Number(p.amount),
        fee: Number(p.fee),
        netAmount: Number(p.netAmount),
      })),
    };
  } catch (error) {
    console.error("Error fetching organizer details:", error);
    return null;
  }
}

export async function verifyOrganizer(organizerId: string, verified: boolean) {
  try {
    await db.organizerProfile.update({
      where: { id: organizerId },
      data: { verified },
    });
    revalidatePath("/admin/organizers");
    revalidatePath(`/admin/organizers/${organizerId}`);
    return { success: true };
  } catch (error) {
    console.error("Error verifying organizer:", error);
    return { success: false, message: "Failed to update verification status" };
  }
}

export async function updateUserStatus(userId: string, status: string) {
  try {
    await db.user.update({
      where: { id: userId },
      data: { status: status as any },
    });
    revalidatePath("/admin/organizers");
    return { success: true };
  } catch (error) {
    console.error("Error updating user status:", error);
    return { success: false, message: "Failed to update user status" };
  }
}

export async function getAdminTransactionStats() {
  try {
    const totalVolume = await db.transaction.aggregate({
      _sum: { amount: true },
    });

    const netRevenue = await db.transaction.aggregate({
      _sum: { fee: true, commission: true },
      where: { status: "SUCCESS" },
    });

    const successCount = await db.transaction.count({
      where: { status: "SUCCESS" },
    });

    const failedCount = await db.transaction.count({
      where: { status: "FAILED" },
    });

    const pendingCount = await db.transaction.count({
      where: { status: "PENDING" },
    });

    return {
      totalVolume: Number(totalVolume._sum.amount || 0),
      netRevenue:
        Number(netRevenue._sum.fee || 0) +
        Number(netRevenue._sum.commission || 0),
      successRate:
        (successCount / (successCount + failedCount + pendingCount)) * 100 || 0,
      pendingCount,
    };
  } catch (error) {
    console.error("Error fetching transaction stats:", error);
    return {
      totalVolume: 0,
      netRevenue: 0,
      successRate: 0,
      pendingCount: 0,
    };
  }
}

export async function getAdminTransactions() {
  try {
    const transactions = await db.transaction.findMany({
      take: 100, // Limit for now, pagination to come later if needed
      orderBy: { createdAt: "desc" },
      include: {
        event: {
          select: { title: true },
        },
      },
    });

    return transactions.map((tx: any) => ({
      id: tx.id,
      reference: tx.reference,
      type: tx.type,
      amount: Number(tx.amount),
      status: tx.status,
      // Payer info logic: prioritize explicit fields, fallback to relations if existed
      payer: tx.customerName || tx.customerEmail || "Anonymous",
      event: tx.event?.title || "N/A",
      date: tx.createdAt,
    }));
  } catch (error) {
    console.error("Error fetching admin transactions:", error);
    return [];
  }
}

export async function getAdminPayoutStats() {
  try {
    const pendingAmount = await db.payout.aggregate({
      _sum: { amount: true },
      where: { status: "PENDING" },
    });

    const processed24h = await db.payout.aggregate({
      _sum: { amount: true },
      where: {
        status: "COMPLETED",
        processedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    const totalPaid = await db.payout.aggregate({
      _sum: { amount: true },
      where: { status: "COMPLETED" },
    });

    return {
      pendingAmount: Number(pendingAmount._sum.amount || 0),
      processed24h: Number(processed24h._sum.amount || 0),
      totalPaid: Number(totalPaid._sum.amount || 0),
    };
  } catch (error) {
    console.error("Error fetching payout stats:", error);
    return {
      pendingAmount: 0,
      processed24h: 0,
      totalPaid: 0,
    };
  }
}

export async function getAdminPayouts() {
  try {
    const payouts = await db.payout.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      include: {
        organizer: {
          select: {
            businessName: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    return payouts.map((p: any) => ({
      id: p.id,
      amount: Number(p.amount),
      status: p.status,
      bankName: p.bankName,
      accountName: p.bankAccountName,
      accountNumber: p.bankAccountNumber,
      organizerName: p.organizer.businessName || p.organizer.user.name,
      organizerEmail: p.organizer.user.email,
      date: p.createdAt,
      reference: p.reference,
    }));
  } catch (error) {
    console.error("Error fetching admin payouts:", error);
    return [];
  }
}

export async function updatePayoutStatus(payoutId: string, status: string) {
  try {
    await db.payout.update({
      where: { id: payoutId },
      data: {
        status: status as any,
        processedAt: status === "COMPLETED" ? new Date() : undefined,
      },
    });
    revalidatePath("/admin/payouts");
    revalidatePath("/admin/organizers");
    return { success: true };
  } catch (error) {
    console.error("Error updating payout status:", error);
    return { success: false, message: "Failed to update payout status" };
  }
}

export async function updateEventVotingSettings(
  eventId: string,
  settings: { showVoteCount: boolean; showSalesEnd: boolean }
) {
  try {
    await db.event.update({
      where: { id: eventId },
      data: {
        showVoteCount: settings.showVoteCount,
        showSalesEnd: settings.showSalesEnd,
      },
    });
    revalidatePath("/admin/events");
    revalidatePath(`/admin/events/${eventId}`);
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating voting settings:", error);
    return { success: false, error: "Failed to update settings" };
  }
}

// ==========================================
// ARCHIVAL ACTIONS
// ==========================================

export async function archiveEvent(eventId: string, pruneData: boolean) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session ||
      !["ADMIN", "SUPER_ADMIN"].includes(session.user?.role || "")
    ) {
      return { success: false, error: "Unauthorized" };
    }

    // 1. Update status to ARCHIVED
    await db.event.update({
      where: { id: eventId },
      data: { status: "ARCHIVED" },
    });

    // 2. Prune Data if requested
    if (pruneData) {
      // Find all candidates for this event to delete their votes
      // Actually simpler: votes serve relations mostly to candidate or transaction.
      // If we delete votes, we might break transaction relations if strictly governed, but usually votes are leaf nodes.
      // Let's check schema: Vote -> Candidate (Cascade Delete)
      // Transaction -> Vote (Relation)

      // We can find all candidates for the event and delete their votes.
      // Or easier: find candidates of event's categories.

      const candidates = await db.candidate.findMany({
        where: {
          category: {
            eventId: eventId,
          },
        },
        select: { id: true },
      });

      const candidateIds = candidates.map((c) => c.id);

      if (candidateIds.length > 0) {
        await db.vote.deleteMany({
          where: {
            candidateId: { in: candidateIds },
          },
        });
      }

      // Note: We are NOT deleting candidates or categories, just the Vote records which are the high-volume data.
      // We also keep Transactions for financial records.
    }

    revalidatePath("/admin/events");
    revalidatePath(`/admin/events/${eventId}`);
    return { success: true };
  } catch (error) {
    console.error("Error archiving event:", error);
    return { success: false, error: "Failed to archive event" };
  }
}

export async function restoreEvent(eventId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session ||
      !["ADMIN", "SUPER_ADMIN"].includes(session.user?.role || "")
    ) {
      return { success: false, error: "Unauthorized" };
    }

    await db.event.update({
      where: { id: eventId },
      data: { status: "ENDED" }, // Default to ENDED when restoring
    });

    revalidatePath("/admin/events");
    revalidatePath(`/admin/events/${eventId}`);
    return { success: true };
  } catch (error) {
    console.error("Error restoring event:", error);
    return { success: false, error: "Failed to restore event" };
  }
}
