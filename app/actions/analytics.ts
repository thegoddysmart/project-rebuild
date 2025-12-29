"use server";

import db from "@/lib/db";
import { startOfDay, subDays, format } from "date-fns";

export async function getRevenueAnalytics(days: number = 7) {
  try {
    const startDate = startOfDay(subDays(new Date(), days - 1));

    // Grouping by date in Prisma usually requires raw query or post-processing.
    // For simplicity and DB agnostic behavior, we'll fetch successes in range and map in JS.
    // In production with high volume, raw SQL (DATE_TRUNC) is better.

    const transactions = await db.transaction.findMany({
      where: {
        status: "SUCCESS",
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        amount: true,
        createdAt: true,
      },
    });

    // Initialize map with 0 for all days
    const dailyRevenue = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const date = subDays(new Date(), i);
      dailyRevenue.set(format(date, "MMM dd"), 0);
    }

    // Fill with data
    transactions.forEach((tx) => {
      const dateKey = format(tx.createdAt, "MMM dd");
      const current = dailyRevenue.get(dateKey) || 0;
      dailyRevenue.set(dateKey, current + Number(tx.amount));
    });

    // Convert to array and reverse to show chronological order
    return Array.from(dailyRevenue.entries())
      .map(([date, amount]) => ({ date, amount }))
      .reverse();
  } catch (error) {
    console.error("Error fetching revenue analytics:", error);
    return [];
  }
}

export async function getUserGrowthStats(days: number = 7) {
  try {
    const startDate = startOfDay(subDays(new Date(), days - 1));

    const users = await db.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        role: true,
      },
    });

    const dailyGrowth = new Map<
      string,
      { organizers: number; users: number }
    >();
    for (let i = 0; i < days; i++) {
      const date = subDays(new Date(), i);
      dailyGrowth.set(format(date, "MMM dd"), { organizers: 0, users: 0 });
    }

    users.forEach((user) => {
      const dateKey = format(user.createdAt, "MMM dd");
      const current = dailyGrowth.get(dateKey) || { organizers: 0, users: 0 };
      if (user.role === "ORGANIZER") {
        current.organizers += 1;
      } else {
        current.users += 1;
      }
      dailyGrowth.set(dateKey, current);
    });

    return Array.from(dailyGrowth.entries())
      .map(([date, counts]) => ({
        date,
        organizers: counts.organizers,
        users: counts.users,
      }))
      .reverse();
  } catch (error) {
    console.error("Error fetching user growth stats:", error);
    return [];
  }
}
