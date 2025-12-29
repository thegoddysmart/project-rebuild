import crypto from "crypto";

/**
 * Verifies a webhook signature using HMAC-SHA512.
 * @param payload The raw body of the request as a string.
 * @param signature The signature provided in the header.
 * @param secret The secret key used to hash the payload.
 * @returns true if valid, false otherwise.
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!payload || !signature || !secret) return false;

  const hash = crypto
    .createHmac("sha512", secret)
    .update(payload)
    .digest("hex");

  return hash === signature;
}
