import { BaseSimulator } from "./BaseSimulator";
import {
  InitPaymentInput,
  InitResponse,
  PaymentGateway,
  VerifyResponse,
} from "../types";

export class SimulatedPaystack extends BaseSimulator implements PaymentGateway {
  protected providerName: "PAYSTACK" = "PAYSTACK";

  async initializePayment(input: InitPaymentInput): Promise<InitResponse> {
    await this.simulateDelay();

    // In simulation, we don't actually redirect, but we provide a fake URL
    // that the frontend could "pretend" to use, or we just auto-succeed via webhook.

    // For seamless dev exp, we'll schedule the webhook to fire shortly
    // to simulate the user completing payment on the hosted page.

    const outcome = this.determineOutcome();

    // this.dispatchWebhook(
    //   {
    //     event: "charge.success",
    //     data: {
    //       reference: input.reference,
    //       status: outcome === "SUCCESS" ? "success" : "failed",
    //       amount: input.amount * 100, // Paystack uses subunits
    //     },
    //   },
    //   3000 // 3 seconds "on the checkout page"
    // );

    // Redirect to our own fake checkout UI
    return {
      success: true,
      transactionId: `PSTK-${Date.now()}`,
      status: "PENDING",
      paymentUrl: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/checkout/paystack?reference=${input.reference}`,
    };
  }

  async verifyPayment(reference: string): Promise<VerifyResponse> {
    return {
      success: true,
      status: "PENDING",
      transactionId: reference,
      amount: 0,
      currency: "GHS",
    };
  }

  async handleWebhook(req: Request): Promise<void> {}
}
