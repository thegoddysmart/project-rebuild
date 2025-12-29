import { BaseSimulator } from "./BaseSimulator";
import {
  InitPaymentInput,
  InitResponse,
  PaymentGateway,
  VerifyResponse,
} from "../types";

export class SimulatedAppsnMobile
  extends BaseSimulator
  implements PaymentGateway
{
  protected providerName: "APPSN" = "APPSN";

  async initializePayment(input: InitPaymentInput): Promise<InitResponse> {
    await this.simulateDelay(); // Simulate network request

    const outcome = this.determineOutcome(input.metadata);
    const delay = outcome === "SUCCESS" ? 5000 : 2000; // 5s for approval, 2s for immediate failure

    // Schedule delayed webhook
    // Schedule delayed webhook (DISABLED: UI will trigger it)
    // this.dispatchWebhook(
    //   {
    //     event: "charge.completed",
    //     data: {
    //       reference: input.reference,
    //       status: outcome,
    //       amount: input.amount,
    //       currency: input.currency,
    //       channel: "mobile_money",
    //     },
    //   },
    //   delay
    // );

    // Redirect to simulated Mobile Phone UI
    return {
      success: true,
      transactionId: `APPSN-${Date.now()}`,
      status: "PENDING",
      paymentUrl: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/checkout/appsn?reference=${input.reference}`,
      displayMessage: "Redirecting to Payment Simulator...",
    };
  }

  async verifyPayment(reference: string): Promise<VerifyResponse> {
    // In a real app, this would query the provider API
    // Here we just return PENDING because the webhook drives the state
    return {
      success: true,
      status: "PENDING",
      transactionId: reference,
      amount: 0,
      currency: "GHS",
    };
  }

  async handleWebhook(req: Request): Promise<void> {
    // Logic handled by generic webhook handler
  }
}
