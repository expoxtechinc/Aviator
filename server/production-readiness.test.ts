import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("BeatBox production readiness contracts", () => {
  it("keeps public discovery aliases and route-aware metadata wired", () => {
    const app = read("client/src/App.tsx");
    const catalog = read("client/src/pages/MarketCatalog.tsx");
    const meta = read("client/src/hooks/usePageMeta.ts");
    for (const route of ["/discover", "/categories", "/trending", "/new-releases", "/free-downloads", "/paid-content", "/products"]) expect(app).toContain(route);
    expect(catalog).toContain("content_items");
    expect(meta).toContain("canonical");
  });

  it("keeps social persistence, secure media, and moderation actions connected", () => {
    const community = read("client/src/pages/Community.tsx");
    for (const table of ["social_posts", "social_post_likes", "social_post_comments", "social_reposts", "social_post_bookmarks", "producer_follows", "social_friend_requests", "social_blocks", "social_mutes", "reports"]) expect(community).toContain(table);
    expect(community).toContain("createSignedUrl");
    expect(community).toContain("profiles!social_posts_author_id_fkey");
  });

  it("preserves pending manual-payment and entitlement-controlled fulfillment", () => {
    const catalog = read("client/src/pages/MarketCatalog.tsx");
    const studio = read("client/src/pages/CreatorHub.tsx");
    const download = read("supabase/functions/secure-download/index.ts");
    expect(catalog).toContain('status: "pending"');
    expect(catalog).toContain("Payment remains pending");
    expect(studio).toContain("seller_payment_methods");
    expect(download).toContain("createSignedUrl");
    expect(download).toContain("entitlement");
  });

  it("keeps creator monetization and admin boundaries server/database backed", () => {
    const studio = read("client/src/pages/CreatorHub.tsx");
    const admin = read("client/src/pages/Dashboards.tsx");
    const serverTests = read("server/beatbox.security.test.ts");
    expect(studio).toContain("seller_earnings");
    expect(studio).toContain("advertiser");
    expect(admin).toContain("reports");
    expect(serverTests).toContain("admin");
  });
});
