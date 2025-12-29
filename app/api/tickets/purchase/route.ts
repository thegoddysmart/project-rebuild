import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getPaymentGateway } from "@/lib/payments/factory";
import { getActiveOnlineGateway } from "@/lib/payments/monitor";
import { createTicketReservation } from "@/lib/ticketing/reservation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      eventId,
      ticketTypeId,
      quantity,
      voterName,
      voterPhone,
      voterEmail,
    } = body;

    // 1. Validation
    if (!eventId || !ticketTypeId || !quantity || quantity < 1) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const reference = `TIX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 2. Reservation / Availability Check
    await createTicketReservation(
      ticketTypeId,
      quantity,
      10, // 10 minutes
      reference
    );

    // 3. Get Price
    const ticketType = await prisma.ticketType.findUnique({
      where: { id: ticketTypeId },
    });
    if (!ticketType)
      return NextResponse.json({ error: "Invalid ticket" }, { status: 404 });

    const amount = Number(ticketType.price) * quantity;

    // 4. Payment Init
    const provider = await getActiveOnlineGateway();
    const gateway = getPaymentGateway(provider);

    // Create Metadata
    const transaction = await prisma.transaction.create({
      data: {
        amount,
        netAmount: amount,
        paymentMethod: "MOBILE_MONEY",
        paymentProvider: provider,
        status: "PENDING",
        type: "TICKET",
        eventId,
        reference,
        isSimulated: true, // Should use config
        simulationProvider: provider,
        metadata: {
          ticketTypeId,
          quantity,
          voterName,
          voterPhone,
          voterEmail,
        },
      },
    });

    const initResult = await gateway.initializePayment({
      amount,
      currency: "GHS",
      reference,
      email: voterEmail || "ticket@easevote.com",
      phone: voterPhone,
      metadata: { transactionId: transaction.id },
    });

    return NextResponse.json({
      success: true,
      transactionRef: reference,
      paymentUrl: initResult.paymentUrl,
      message: initResult.displayMessage,
      status: initResult.status,
    });
  } catch (error: any) {
    console.error("Ticket Purchase Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Error" },
      { status: 500 }
    );
  }
}
