import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

/**
 * Verifies a ticket and marks it as used (Atomic Check-in).
 */
export async function POST(req: NextRequest) {
  try {
    const { ticketCode, eventId } = await req.json();

    if (!ticketCode || !eventId) {
      return NextResponse.json(
        { error: "Missing ticket code or event ID" },
        { status: 400 }
      );
    }

    // Atomic verify and update
    const result = await db.$transaction(async (tx) => {
      // 1. Find the ticket
      const ticket = await tx.ticket.findUnique({
        where: { ticketCode },
        include: { ticketType: true },
      });

      if (!ticket) {
        return {
          success: false,
          reason: "INVALID",
          message: "Ticket not found",
        };
      }

      // 2. Security Check: Does the ticket belong to this event?
      if (ticket.eventId !== eventId) {
        return {
          success: false,
          reason: "INVALID",
          message: "Ticket does not belong to this event",
        };
      }

      // 3. Status Check: Is it already used?
      if (ticket.isCheckedIn) {
        return {
          success: false,
          reason: "ALREADY_USED",
          message: `Ticket already used at ${ticket.checkedInAt?.toLocaleString()}`,
        };
      }

      // 4. Mark as used
      const updatedTicket = await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          isCheckedIn: true,
          checkedInAt: new Date(),
          // checkedInBy: ... (could add staff ID here)
        },
      });

      return {
        success: true,
        ticket: {
          code: updatedTicket.ticketCode,
          type: ticket.ticketType.name,
          holderName: updatedTicket.holderName,
        },
        message: "Check-in Successful",
      };
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[TICKET_VERIFY] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
