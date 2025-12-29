import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.organizerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, reviewNotes } = body;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Verify Nomination belongs to Organizer
    const nomination = await prisma.nomination.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!nomination) {
      return NextResponse.json(
        { error: "Nomination not found" },
        { status: 404 }
      );
    }

    if (nomination.event.organizerId !== session.user.organizerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update Status
    const updatedNomination = await prisma.nomination.update({
      where: { id },
      data: {
        status,
        reviewNotes,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, nomination: updatedNomination });
  } catch (error) {
    console.error("Review Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
