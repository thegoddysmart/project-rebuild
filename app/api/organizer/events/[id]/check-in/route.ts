import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // In Next.js 15+, params is a Promise
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params in Next.js 15+ (assuming this version based on recent changes, but safely handling it)
    const { id: eventId } = await params;

    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Ticket code is required" },
        { status: 400 }
      );
    }

    // 1. Find Ticket
    // Search by ticketCode OR qrCode
    const ticket = await prisma.ticket.findFirst({
      where: {
        OR: [{ ticketCode: code }, { qrCode: code }],
      },
      include: {
        ticketType: true,
        transaction: {
          select: {
            customerName: true,
            customerEmail: true,
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Invalid ticket" }, { status: 404 });
    }

    // 2. Validate Event Match
    if (ticket.ticketType.eventId !== eventId) {
      return NextResponse.json(
        { error: "Ticket does not belong to this event" },
        { status: 400 }
      );
    }

    // 3. Check for Double Entry
    if (ticket.isCheckedIn) {
      return NextResponse.json(
        {
          error: "Ticket already checked in",
          checkedInAt: ticket.checkedInAt,
          checkedInBy: ticket.checkedInBy,
          holder: ticket.holderName || ticket.transaction.customerName,
          ticketType: ticket.ticketType.name,
        },
        { status: 409 } // Conflict
      );
    }

    // 4. Perform Check-In
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        isCheckedIn: true,
        checkedInAt: new Date(),
        checkedInBy: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      ticket: {
        code: updatedTicket.ticketCode,
        holder: updatedTicket.holderName || ticket.transaction.customerName,
        type: ticket.ticketType.name,
        checkedInAt: updatedTicket.checkedInAt,
      },
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
