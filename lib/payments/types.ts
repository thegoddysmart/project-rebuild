export type PaymentProvider = "APPSN" | "PAYSTACK" | "USSD" | "HUBTEL";

export type InitPaymentInput = {
  amount: number;
  currency: string;
  email?: string;
  phone?: string;
  reference: string;
  metadata: Record<string, any>;
};

export type InitResponse = {
  success: boolean;
  transactionId: string;
  paymentUrl?: string; // For redirects (Paystack)
  displayMessage?: string; // For USSD/MoMo prompts
  status: "PENDING" | "SUCCESS" | "FAILED";
};

export type VerifyResponse = {
  success: boolean;
  status: "PENDING" | "SUCCESS" | "FAILED";
  transactionId: string;
  amount: number;
  currency: string;
  gatewayReference?: string;
  raw?: any;
};

export interface PaymentGateway {
  initializePayment(input: InitPaymentInput): Promise<InitResponse>;
  verifyPayment(reference: string): Promise<VerifyResponse>;
  handleWebhook(req: Request): Promise<void>;
}
