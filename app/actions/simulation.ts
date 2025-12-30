"use server";

import db from "@/lib/db";
import { BaseSimulator } from "@/lib/payments/simulation/BaseSimulator";
import { revalidatePath } from "next/cache";

// Helper to expose protected dispatchWebhook
class WebhookDispatcher extends BaseSimulator {
  protected providerName: "APPSN" | "PAYSTACK" | "USSD" = "PAYSTACK"; // Generic

  async trigger(input: { event: string; data: any }) {
    await this.dispatchWebhook(input, 0); // Immediate
  }
}

export async function completeSimulatedPayment(
  reference: string,
  outcome: "SUCCESS" | "FAILED"
) {
  try {
    const tx = await db.transaction.findUnique({ where: { reference } });
    if (!tx) return { success: false, error: "Transaction not found" };

    const dispatcher = new WebhookDispatcher();

    // Construct payload based on provider
    // For Paystack:
    await dispatcher.trigger({
      event: "charge.success", // Paystack event
      data: {
        reference: reference,
        status: outcome === "SUCCESS" ? "success" : "failed",
        amount: Number(tx.amount) * 100, // Subunits
        channel: "card",
      },
    });

    // Also update the simulatedFields if needed, but webhook should handle status
    return { success: true };
  } catch (error) {
    console.error("Simulation Trigger Error:", error);
    return { success: false };
  }
}

export async function getTransactionDetails(reference: string) {
  try {
    const tx = await db.transaction.findUnique({
      where: { reference },
      select: {
        amount: true,
        currency: true,
        customerEmail: true,
        id: true,
        status: true,
      },
    });
    return tx;
  } catch (e) {
    return null;
  }
}
