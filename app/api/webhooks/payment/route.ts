import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { confirmVote } from "@/lib/voting/engine";
import { confirmTicketPurchase } from "@/lib/ticketing/engine";
import { verifyWebhookSignature } from "@/lib/payments/security";

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    if (!bodyText) {
      return NextResponse.json({ message: "Empty body" }, { status: 400 });
    }

    // 1. Signature Verification
    const paystackSignature = req.headers.get("x-paystack-signature");
    const internalSignature = req.headers.get("x-easevote-signature");
    // Generic/Simulated header for strict dev bypass if needed (optional, using internalSignature instead for now)

    let isValid = false;

    // A. Paystack Verification
    if (paystackSignature && process.env.PAYSTACK_SECRET_KEY) {
      isValid = verifyWebhookSignature(
        bodyText,
        paystackSignature,
        process.env.PAYSTACK_SECRET_KEY
      );
    }
    // B. Internal/Simulated Verification
    else if (internalSignature && process.env.WEBHOOK_SECRET_KEY) {
      isValid = verifyWebhookSignature(
        bodyText,
        internalSignature,
        process.env.WEBHOOK_SECRET_KEY
      );
    }
    // C. Dev Bypass (Explicit Simulation Key - UNSAFE for Prod, strict check)
    else if (
      process.env.NODE_ENV === "development" &&
      req.headers.get("x-simulation-key") === process.env.WEBHOOK_SECRET_KEY
    ) {
      // Allow if we have a direct simulation key match in dev only
      // This is a "god mode" for local testing without computing signatures
      isValid = true;
    }

    if (!isValid) {
      console.warn("[WEBHOOK] Invalid Signature or Missing Secret");
      return NextResponse.json(
        { message: "Unauthorized: Invalid Signature" },
        { status: 401 }
      );
    }

    const body = JSON.parse(bodyText);
    const event = body.event || body.type; // Handling different structures (Paystack vs others)
    const reference = body.data?.reference || body.reference;

    console.log("[WEBHOOK] Received Verified Event:", { event, reference });

    if (!reference) {
      return NextResponse.json(
        { message: "No reference provided" },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.findUnique({
      where: { reference },
    });

    if (!transaction) {
      return NextResponse.json(
        { message: "Transaction not found" },
        { status: 404 }
      );
    }

    if (transaction.status === "SUCCESS") {
      return NextResponse.json({ message: "Already processed" });
    }

    // Determine Status from Payload
    let status: "SUCCESS" | "FAILED" = "FAILED";

    // Check specific provider patterns or generic simulation
    if (event === "charge.success" || body.status === "SUCCESS") {
      status = "SUCCESS";
    }

    // Update Transaction
    const updatedTx = await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: status,
        paidAt: status === "SUCCESS" ? new Date() : null,
        providerRef: body.data?.id?.toString() || body.providerRef,
        metadata: {
          ...((transaction.metadata as object) || {}),
          webhookPayload: body,
        },
      },
    });

    if (status === "SUCCESS") {
      // TRIGGER POST-PAYMENT LOGIC (Votes, Tickets, etc)
      // This is duplicates logic from the original simulated internal helper.
      // Ideally, extract this into a service: processSuccessfulPayment(tx)

      await processPostPaymentActions(updatedTx);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[WEBHOOK] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

async function processPostPaymentActions(tx: any) {
  if (tx.type === "VOTE") {
    try {
      await confirmVote(tx.id);
      console.log(`[PAYMENT] Confirmed Vote for ${tx.reference}`);
    } catch (e) {
      console.error(`[PAYMENT] Failed to confirm vote for ${tx.reference}`, e);
    }
  } else if (tx.type === "TICKET") {
    try {
      await confirmTicketPurchase(tx.id);
      console.log(`[PAYMENT] Confirmed Ticket for ${tx.reference}`);
    } catch (e) {
      console.error(
        `[PAYMENT] Failed to confirm ticket for ${tx.reference}`,
        e
      );
    }
  }
}
