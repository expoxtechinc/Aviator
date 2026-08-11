import { describe, expect, it } from "vitest";

describe("Supabase public configuration", () => {
  it("reaches the Supabase Auth settings endpoint with the configured publishable key", async () => {
    const url = process.env.VITE_SUPABASE_URL;
    const apiKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    expect(url).toMatch(/^https:\/\/[a-z0-9-]+\.supabase\.co$/i);
    expect(apiKey).toBeTruthy();

    const response = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: apiKey! },
    });

    expect(response.ok).toBe(true);
  });
});
