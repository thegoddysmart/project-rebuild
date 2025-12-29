import { PaymentGateway, PaymentProvider } from "./types";
import { SimulatedAppsnMobile } from "./simulation/SimulatedAppsnMobile";
import { SimulatedPaystack } from "./simulation/SimulatedPaystack";
import { SimulatedUSSD } from "./simulation/SimulatedUSSD";

export function getPaymentGateway(provider: PaymentProvider): PaymentGateway {
  // Check global environment flag
  // In a real app we might use process.env.PAYMENT_MODE
  // For this prototype, we'll assume EVERYTHING is simulated if the
  // provider isn't explicitly configured as live.

  const isSimulated = process.env.PAYMENT_MODE === "SIMULATED" || true; // Default to true for now

  if (isSimulated) {
    switch (provider) {
      case "APPSN":
        return new SimulatedAppsnMobile();
      case "PAYSTACK":
        return new SimulatedPaystack();
      case "USSD":
        return new SimulatedUSSD();
      case "HUBTEL":
        // Fallback or map to AppsnMobile for now as Hubtel also does MoMo
        return new SimulatedAppsnMobile();
      default:
        throw new Error(`Simulated provider ${provider} not implemented`);
    }
  }

  // Future Real Implementation Fallback
  throw new Error(
    "Real payment providers are not configured yet. Set PAYMENT_MODE=SIMULATED"
  );
}
