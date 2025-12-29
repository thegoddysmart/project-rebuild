import db from "@/lib/db";

/**
 * Creates a temporary reservation for tickets.
 * This prevents overselling by locking inventory for 10 minutes.
 */
export async function createTicketReservation(
  ticketTypeId: string,
  quantity: number,
  expiresInMinutes: number = 10,
  reference?: string
) {
  // 0. Cleanup expired reservations first (outside the main transaction to reduce lock time)
  try {
    await db.ticketReservation.updateMany({
      where: {
        status: "RESERVED",
        expiresAt: { lt: new Date() },
      },
      data: {
        status: "EXPIRED",
      },
    });
  } catch (e) {
    console.error("[RESERVATION] Cleanup failed (non-critical):", e);
  }

  return await db.$transaction(
    async (tx) => {
      // 1. Get Ticket Type and its eventId
      const ticketType = await tx.ticketType.findUnique({
        where: { id: ticketTypeId },
        select: {
          id: true,
          eventId: true,
          quantity: true,
          soldCount: true,
          isActive: true,
          salesEnd: true,
        },
      });

      if (!ticketType) throw new Error("Ticket not found");
      if (!ticketType.isActive)
        throw new Error("This ticket is no longer available");
      if (ticketType.salesEnd && new Date() > ticketType.salesEnd)
        throw new Error("Ticket sales have ended");

      // 2. Count active (non-expired and non-cancelled/confirmed) reservations
      const activeReservations = await tx.ticketReservation.aggregate({
        where: {
          ticketTypeId: ticketTypeId,
          status: "RESERVED",
          expiresAt: { gt: new Date() },
        },
        _sum: { quantity: true },
      });

      const pendingReservations = activeReservations._sum.quantity || 0;
      const totalSold = ticketType.soldCount;
      const available = ticketType.quantity - (totalSold + pendingReservations);

      if (available < quantity) {
        throw new Error(
          "Insufficient tickets available. Some might be reserved by other users."
        );
      }

      // 3. Create the reservation
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

      return await tx.ticketReservation.create({
        data: {
          ticketTypeId,
          eventId: ticketType.eventId,
          quantity,
          expiresAt,
          status: "RESERVED",
          reference,
        },
      });
    },
    { timeout: 30000 }
  );
}

/**
 * Clean up expired reservations to free up inventory.
 * Should be called periodically or before availability checks.
 */
export async function cleanupExpiredReservations() {
  return await db.ticketReservation.updateMany({
    where: {
      status: "RESERVED",
      expiresAt: { lt: new Date() },
    },
    data: {
      status: "EXPIRED",
    },
  });
}
