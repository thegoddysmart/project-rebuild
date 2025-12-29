import { NextRequest, NextResponse } from "next/server";
import { createVoteIntent } from "@/lib/voting/engine";
import { getPaymentGateway } from "@/lib/payments/factory";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      eventId,
      candidateId,
      quantity,
      voterName,
      voterPhone,
      voterEmail,
    } = body;

    // 1. Create Vote Intent (validates event, price, creates pending transaction)
    const { transaction, provider } = await createVoteIntent({
      eventId,
      candidateId,
      quantity: Number(quantity),
      voterName,
      voterPhone,
      voterEmail,
    });

    // 2. Initialize Payment Gateway
    const gateway = getPaymentGateway(provider);

    // 3. Initiate Charge
    const initResult = await gateway.initializePayment({
      amount: Number(transaction.amount),
      currency: transaction.currency,
      reference: transaction.reference,
      email: voterEmail,
      phone: voterPhone,
      metadata: {
        transactionId: transaction.id,
      },
    });

    return NextResponse.json({
      success: true,
      transactionRef: transaction.reference,
      paymentUrl: initResult.paymentUrl,
      message: initResult.displayMessage,
      status: initResult.status,
    });
  } catch (error: any) {
    console.error("Vote Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate vote" },
      { status: 500 }
    );
  }
}
