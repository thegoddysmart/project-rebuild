import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.organizerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, organizationName, phone, address } = body;

    // Transaction to update both User and OrganizerProfile
    const result = await prisma.$transaction(async (tx) => {
      // Update User (Name)
      await tx.user.update({
        where: { id: session.user.id },
        data: { name },
      });

      // Update OrganizerProfile
      const updatedProfile = await tx.organizerProfile.update({
        where: { id: session.user.organizerId },
        data: {
          businessName: organizationName, // Map provided organizationName to businessName
          businessPhone: phone, // Map provided phone to businessPhone
          address,
        },
      });

      return updatedProfile;
    });

    return NextResponse.json({ success: true, profile: result });
  } catch (error) {
    console.error("Profile Update Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
