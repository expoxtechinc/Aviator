import { TRPCError } from "@trpc/server";

/**
 * Stripe-specific payment code intentionally remains server-side. The UI can read
 * only availability; it cannot create a payment or declare an order paid.
 */
export function stripeCheckoutIsReady() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

export function requireStripeCheckoutConfiguration() {
  if (!stripeCheckoutIsReady()) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Stripe Checkout is not configured for this BeatBox environment.",
    });
  }
}
