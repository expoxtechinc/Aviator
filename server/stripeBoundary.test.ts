import { beforeEach, describe, expect, it } from "vitest";
import { stripeCheckoutIsReady } from "./stripeBoundary";

const originalSecret = process.env.STRIPE_SECRET_KEY;
const originalWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

describe("BeatBox Stripe server boundary", () => {
  beforeEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  it("reports Stripe Checkout as unavailable until both server-only secrets exist", () => {
    expect(stripeCheckoutIsReady()).toBe(false);
    process.env.STRIPE_SECRET_KEY = "sk_test_not_a_real_key";
    expect(stripeCheckoutIsReady()).toBe(false);
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_not_a_real_key";
    expect(stripeCheckoutIsReady()).toBe(true);
  });
});

process.env.STRIPE_SECRET_KEY = originalSecret;
process.env.STRIPE_WEBHOOK_SECRET = originalWebhookSecret;
