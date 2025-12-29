import { SIMULATION_CONFIG } from "./config";
import { PaymentProvider } from "../types";

export abstract class BaseSimulator {
  protected abstract providerName: "APPSN" | "PAYSTACK" | "USSD";

  protected get config() {
    return SIMULATION_CONFIG[this.providerName];
  }

  protected async simulateDelay() {
    // @ts-ignore
    const { min, max } = this.config.delays || { min: 1000, max: 2000 };
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  protected determineOutcome(metadata?: any): "SUCCESS" | "FAILED" {
    if (metadata?._force_outcome) {
      return metadata._force_outcome;
    }
    const rand = Math.random();
    return rand <= this.config.successRate ? "SUCCESS" : "FAILED";
  }

  protected async dispatchWebhook(payload: any, delay: number = 0) {
    if (delay > 0) {
      setTimeout(async () => {
        await this._sendWebhook(payload);
      }, delay);
    } else {
      await this._sendWebhook(payload);
    }
  }

  private async _sendWebhook(payload: any) {
    try {
      // In a real scenario, this would POST to localhost:3000/api/webhooks/payment
      // ensuring the app is running. For simulation within the same runtime,
      // we might want to call a service directly or use fetch to self.

      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      await fetch(`${baseUrl}/api/webhooks/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-paystack-signature": "simulated-signature", // Fake signature
          "x-simulation-key": process.env.WEBHOOK_SECRET_KEY || "", // Bypass key for dev
        },
        body: JSON.stringify(payload),
      });

      console.log(`[SIMULATION] Webhook dispatched for ${this.providerName}`);
    } catch (error) {
      console.error(
        `[SIMULATION] Failed to dispatch webhook for ${this.providerName}`,
        error
      );
    }
  }
}
