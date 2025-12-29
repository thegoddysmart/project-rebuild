import { BaseSimulator } from "./BaseSimulator";
import {
  InitPaymentInput,
  InitResponse,
  PaymentGateway,
  VerifyResponse,
} from "../types";

export class SimulatedUSSD extends BaseSimulator implements PaymentGateway {
  protected providerName: "USSD" = "USSD";

  async initializePayment(input: InitPaymentInput): Promise<InitResponse> {
    await this.simulateDelay(); // Network delay

    const outcome = this.determineOutcome();

    // USSD is time-sensitive.
    this.dispatchWebhook(
      {
        type: "payment",
        status: outcome,
        reference: input.reference,
      },
      4000
    );

    return {
      success: true, // Init is successful, waiting for user action
      transactionId: `USSD-${Date.now()}`,
      status: "PENDING",
      displayMessage: "Dial *170# to approve transaction.",
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
