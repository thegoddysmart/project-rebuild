import db from "@/lib/db";
import { randomUUID } from "crypto";

/**
 * Confirms a ticket purchase after successful payment.
 * Converts reservation into valid Ticket records.
 */
export async function confirmTicketPurchase(transactionId: string) {
  return await db.$transaction(async (tx) => {
    // 1. Fetch transaction and its metadata
    const transaction = await tx.transaction.findUnique({
      where: { id: transactionId },
      include: { event: true },
    });

    if (!transaction) throw new Error("Transaction not found");
    // status check is handled by caller or here

    const metadata = transaction.metadata as any;
    if (!metadata || !metadata.ticketTypeId || !metadata.quantity) {
      throw new Error("Invalid transaction metadata for ticketing");
    }

    const { ticketTypeId, quantity, voterName, voterPhone, voterEmail } =
      metadata;

    // 2. check if tickets already generated for this transaction
    const existingTickets = await tx.ticket.count({
      where: { transactionId },
    });

    if (existingTickets > 0) {
      console.log(
        `[TICKETING] Tickets already generated for transaction ${transaction.reference}`
      );
      return { success: true, alreadyProcessed: true };
    }

    // 3. Find and update reservation to CONFIRMED
    const reservation = await tx.ticketReservation.findFirst({
      where: {
        ticketTypeId,
        reference: transaction.reference,
        status: "RESERVED",
      },
    });

    if (reservation) {
      await tx.ticketReservation.update({
        where: { id: reservation.id },
        data: { status: "CONFIRMED" },
      });
    }

    // 4. Generate Ticket records
    const ticketsData = [];
    for (let i = 0; i < quantity; i++) {
      const ticketCode = `TKT-${randomUUID()
        .split("-")[0]
        .toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      ticketsData.push({
        eventId: transaction.eventId,
        ticketTypeId,
        transactionId,
        ticketCode,
        holderName: voterName,
        holderPhone: voterPhone,
        holderEmail: voterEmail,
        qrCode: JSON.stringify({ t: ticketCode, e: transaction.eventId }),
      });
    }

    await tx.ticket.createMany({
      data: ticketsData,
    });

    // 5. Update TicketType Sold Count
    await tx.ticketType.update({
      where: { id: ticketTypeId },
      data: {
        soldCount: { increment: quantity },
      },
    });

    // 6. Update Event Revenue Aggregates
    await tx.event.update({
      where: { id: transaction.eventId },
      data: {
        totalRevenue: { increment: transaction.amount },
      },
    });

    // 7. Update Organizer Revenue Aggregates
    await tx.organizerProfile.update({
      where: { id: transaction.event.organizerId },
      data: {
        totalRevenue: { increment: transaction.amount },
        balance: { increment: transaction.netAmount },
      },
    });

    console.log(
      `[TICKETING] Successfully fulfilled ${quantity} tickets for ${transaction.reference}`
    );
    return { success: true, count: quantity };
  });
}
