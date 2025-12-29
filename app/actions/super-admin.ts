"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";

export async function getSuperAdminOrganizers() {
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
    console.error("Error fetching super admin organizers:", error);
    return [];
  }
}

export async function verifyOrganizer(organizerId: string, verified: boolean) {
  try {
    await db.organizerProfile.update({
      where: { id: organizerId },
      data: { verified },
    });
    revalidatePath("/super-admin/organizers");
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
    revalidatePath("/super-admin/organizers");
    return { success: true };
  } catch (error) {
    return { success: false, message: "Failed to update user status" };
  }
}

export async function getAdmins() {
  try {
    const admins = await db.user.findMany({
      where: { role: "ADMIN" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
        status: true,
        lastLoginAt: true,
      },
    });
    return admins;
  } catch (error) {
    console.error("Error fetching admins:", error);
    return [];
  }
}

export async function getAdminDetails(adminId: string) {
  try {
    const admin = await db.user.findUnique({
      where: { id: adminId, role: "ADMIN" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        emailVerified: true,
      },
    });
    return admin;
  } catch (error) {
    console.error("Error fetching admin details:", error);
    return null;
  }
}

export async function createAdmin(data: {
  name: string;
  email: string;
  password: string;
}) {
  try {
    const existing = await db.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return { success: false, message: "User with this email already exists" };
    }

    const passwordHash = await hash(data.password, 12);

    await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
        emailVerified: new Date(),
      },
    });

    revalidatePath("/super-admin/admins");
    return { success: true };
  } catch (error) {
    console.error("Error creating admin:", error);
    return { success: false, message: "Failed to create admin" };
  }
}

export async function removeAdmin(adminId: string) {
  try {
    // Ideally we should soft delete or just remove the role,
    // but for now deleting the user if they have no other data is fine.
    // Given constraints, let's just delete the user record to keep it simple as requested.
    await db.user.delete({
      where: { id: adminId },
    });
    revalidatePath("/super-admin/admins");
    return { success: true };
  } catch (error) {
    console.error("Error removing admin:", error);
    return { success: false, message: "Failed to remove admin" };
  }
}

export async function getGlobalTransactions() {
  try {
    const transactions = await db.transaction.findMany({
      take: 100, // Limit for performance, in real app needs pagination
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
      payer:
        tx.customerName || tx.customerEmail || tx.customerPhone || "Anonymous",
      event: tx.event.title,
      date: tx.createdAt,
    }));
  } catch (error) {
    console.error("Error fetching global transactions:", error);
    return [];
  }
}

export async function getGlobalEvents(filter?: {
  status?: string;
  type?: string;
  query?: string;
}) {
  try {
    const where: any = {};

    if (filter?.status && filter.status !== "all") {
      where.status = filter.status;
    }

    if (filter?.type && filter.type !== "all") {
      where.type = filter.type;
    }

    if (filter?.query) {
      where.OR = [
        { title: { contains: filter.query, mode: "insensitive" } },
        { eventCode: { contains: filter.query, mode: "insensitive" } },
        {
          organizer: {
            businessName: { contains: filter.query, mode: "insensitive" },
          },
        },
      ];
    }

    const events = await db.event.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        organizer: {
          select: {
            businessName: true,
            logo: true,
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      take: 50, // Limit for performance
    });

    return events.map((event: any) => ({
      id: event.id,
      eventCode: event.eventCode,
      title: event.title,
      organizer: {
        name: event.organizer.businessName,
        avatar: event.organizer.logo,
      },
      type: event.type,
      status: event.status,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      stats: {
        revenue: Number(event.totalRevenue),
        votes: event.totalVotes,
      },
    }));
  } catch (error) {
    console.error("Error fetching global events:", error);
    return [];
  }
}

export async function getGlobalPayouts() {
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
    console.error("Error fetching global payouts:", error);
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
    revalidatePath("/super-admin/payouts");
    revalidatePath("/super-admin/organizers");
    return { success: true };
  } catch (error) {
    console.error("Error updating payout status:", error);
    return { success: false, message: "Failed to update payout status" };
  }
}

export async function updateCommissionRate(organizerId: string, rate: number) {
  try {
    await db.organizerProfile.update({
      where: { id: organizerId },
      data: { commissionRate: rate },
    });
    revalidatePath(`/super-admin/organizers/${organizerId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating commission rate:", error);
    return { success: false, message: "Failed to update commission rate" };
  }
}

export async function getRevenueStats() {
  try {
    // 1. Revenue Over Time (Last 30 Days) via Transactions
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const transactions = await db.transaction.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: "SUCCESS",
      },
      select: {
        amount: true,
        createdAt: true,
      },
    });

    // Group by date
    const dailyRevenue = new Map<string, number>();
    for (const tx of transactions) {
      const date = tx.createdAt.toISOString().split("T")[0]; // YYYY-MM-DD
      dailyRevenue.set(date, (dailyRevenue.get(date) || 0) + Number(tx.amount));
    }

    // Fill missing days
    const trendData = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      trendData.push({
        date: new Date(dateStr).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        revenue: dailyRevenue.get(dateStr) || 0,
      });
    }

    // 2. Revenue by Type (Voting vs Ticketing)
    const revenueByType = await db.event.groupBy({
      by: ["type"],
      _sum: {
        totalRevenue: true,
      },
    });

    const typeData = revenueByType.map((item) => ({
      name: item.type,
      value: Number(item._sum.totalRevenue || 0),
    }));

    // 3. Top Events
    const topEvents = await db.event.findMany({
      take: 5,
      orderBy: { totalRevenue: "desc" },
      select: {
        id: true,
        title: true,
        totalRevenue: true,
        type: true,
      },
    });

    // 4. Top Organizers
    const topOrganizers = await db.organizerProfile.findMany({
      take: 5,
      orderBy: { totalRevenue: "desc" },
      select: {
        id: true,
        businessName: true,
        totalRevenue: true,
        user: { select: { name: true } },
      },
    });

    return {
      trend: trendData,
      byType: typeData,
      topEvents: topEvents.map((e) => ({
        ...e,
        totalRevenue: Number(e.totalRevenue),
      })),
      topOrganizers: topOrganizers.map((o) => ({
        id: o.id,
        name: o.businessName || o.user.name,
        totalRevenue: Number(o.totalRevenue),
      })),
      totalRevenue: Number(
        (
          await db.transaction.aggregate({
            _sum: { amount: true },
            where: { status: "SUCCESS" },
          })
        )._sum.amount || 0
      ),
    };
  } catch (error) {
    console.error("Error fetching revenue stats:", error);
    return null;
  }
}

export async function getUserAnalytics() {
  try {
    // 1. User Growth (Last 30 Days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const users = await db.user.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
      },
    });

    const dailySignups = new Map<string, number>();
    for (const user of users) {
      const date = user.createdAt.toISOString().split("T")[0];
      dailySignups.set(date, (dailySignups.get(date) || 0) + 1);
    }

    const growthTrend = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      growthTrend.push({
        date: new Date(dateStr).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        users: dailySignups.get(dateStr) || 0,
      });
    }

    // 2. Verification Funnel
    const totalOrganizers = await db.user.count({
      where: { role: "ORGANIZER" },
    });

    const withProfile = await db.organizerProfile.count();

    const verified = await db.organizerProfile.count({
      where: { verified: true },
    });

    const funnelData = [
      { name: "Total Signups", value: totalOrganizers },
      { name: "Profile Created", value: withProfile },
      { name: "Verified", value: verified },
    ];

    // 3. Top Active Users (Most recent logins)
    const topActive = await db.user.findMany({
      take: 10,
      orderBy: { lastLoginAt: "desc" },
      where: {
        lastLoginAt: { not: null },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        lastLoginAt: true,
        avatar: true,
      },
    });

    return {
      growthTrend,
      funnelData,
      topActive: topActive.map((u) => ({
        ...u,
        lastLoginAt: u.lastLoginAt!.toISOString(),
      })),
      totalUsers: await db.user.count(),
    };
  } catch (error) {
    console.error("Error fetching user analytics:", error);
    return null;
  }
}

export async function getSystemLogs() {
  try {
    const logs = await db.activityLog.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    return logs.map((log) => ({
      id: log.id,
      user: {
        name: log.user.name,
        email: log.user.email,
        avatar: log.user.avatar,
        role: log.user.role,
      },
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      metadata: log.metadata,
      createdAt: log.createdAt,
    }));
  } catch (error) {
    console.error("Error fetching system logs:", error);
    return [];
  }
}
