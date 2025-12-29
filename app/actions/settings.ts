"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getSystemSettings() {
  try {
    return await db.systemSetting.findMany({
      orderBy: { key: "asc" },
    });
  } catch (error) {
    console.error("Error fetching system settings:", error);
    return [];
  }
}

export async function updateSystemSetting(
  key: string,
  value: any,
  userEmail: string
) {
  try {
    // 1. Update the setting
    await db.systemSetting.upsert({
      where: { key },
      update: { value, updatedBy: userEmail },
      create: { key, value, updatedBy: userEmail, category: "general" },
    });

    // 2. Log the action (Audit Trail)
    const user = await db.user.findUnique({ where: { email: userEmail } });
    if (user) {
      await db.activityLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_SYSTEM_SETTING",
          entityType: "SystemSetting",
          entityId: key,
          metadata: { oldValue: "unknown", newValue: value },
        },
      });
    }

    revalidatePath("/super-admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Error updating system setting:", error);
    return { success: false, message: "Failed to update setting" };
  }
}
