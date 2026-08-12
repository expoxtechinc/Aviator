import { describe, expect, it, vi } from "vitest";
import { aiRouter, routeWithFallback, type OpenAIMessage, type ProviderDescriptor } from "./aiRouter";

describe("BeatBox AI router behavior", () => {
  const messages: OpenAIMessage[] = [{ role: "user", content: "Help me find a beat." }];

  it("retries a provider and returns its result before falling through", async () => {
    let calls = 0;
    const first: ProviderDescriptor = {
      name: "gemini",
      call: vi.fn(async () => {
        calls += 1;
        if (calls === 1) throw new Error("temporary outage");
        return { text: "Gemini answer", provider: "gemini", model: "test" };
      }),
    };
    const second: ProviderDescriptor = {
      name: "groq",
      call: vi.fn(async () => ({ text: "Groq answer", provider: "groq", model: "test" })),
    };

    const outcome = await routeWithFallback(messages, [first, second], 2);
    expect(outcome.result.provider).toBe("gemini");
    expect(calls).toBe(2);
    expect(second.call).not.toHaveBeenCalled();
    expect(outcome.failures).toEqual(["gemini#1:temporary outage"]);
  });

  it("falls through in the declared order after retry exhaustion", async () => {
    const first: ProviderDescriptor = {
      name: "gemini",
      call: vi.fn(async () => { throw new Error("down"); }),
    };
    const second: ProviderDescriptor = {
      name: "groq",
      call: vi.fn(async () => ({ text: "Groq answer", provider: "groq", model: "test" })),
    };

    const outcome = await routeWithFallback(messages, [first, second], 2);
    expect(outcome.result.provider).toBe("groq");
    expect(first.call).toHaveBeenCalledTimes(2);
    expect(second.call).toHaveBeenCalledTimes(1);
    expect(outcome.failures).toHaveLength(2);
  });

  it("fails over after a hanging provider exceeds the router timeout", async () => {
    const hanging: ProviderDescriptor = {
      name: "gemini",
      call: vi.fn(() => new Promise(() => undefined)),
    };
    const fallback: ProviderDescriptor = {
      name: "groq",
      call: vi.fn(async () => ({ text: "Fallback answer", provider: "groq", model: "test" })),
    };

    const started = Date.now();
    const outcome = await routeWithFallback(messages, [hanging, fallback], 1, 10);
    expect(outcome.result.provider).toBe("groq");
    expect(outcome.failures).toEqual(["gemini#1:AI provider timeout"]);
    expect(Date.now() - started).toBeLessThan(500);
  });

  it("exposes bounded health metadata without credentials", async () => {
    const caller = aiRouter.createCaller({ req: {} as never, res: {} as never, user: null });
    const health = await caller.health();
    expect(health.enabled).toBe(true);
    expect(health.timeoutMs).toBeGreaterThanOrEqual(3_000);
    expect(health.timeoutMs).toBeLessThanOrEqual(30_000);
    expect(health.maxAttemptsPerProvider).toBe(2);
    expect(health.order).toEqual(["gemini", "groq", "openrouter", "manus"]);
    expect(JSON.stringify(health)).not.toMatch(/AIza|gsk_|sk-or-/);
  });

  it("rejects unauthenticated chat calls at the protected procedure boundary", async () => {
    const caller = aiRouter.createCaller({ req: {} as never, res: {} as never, user: null });
    await expect(caller.chat({ messages })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
