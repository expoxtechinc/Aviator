import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const community = readFileSync(resolve(root, "client/src/pages/Community.tsx"), "utf8");
const migration = readFileSync(resolve(root, "supabase/migrations/20260812_beatbox_public_community_media.sql"), "utf8");
const socialMigration = readFileSync(resolve(root, "supabase/migrations/20260812_beatbox_social_media_notifications.sql"), "utf8");
const commerceMigration = readFileSync(resolve(root, "supabase/migrations/20260812_beatbox_creator_social_commerce_extension.sql"), "utf8");
const advertiserMigration = readFileSync(resolve(root, "supabase/migrations/20260812_beatbox_advertiser_analytics.sql"), "utf8");

describe("Feed public media and protected asset boundaries", () => {
  it("serves social attachments with public URLs while keeping uploads owner-scoped", () => {
    expect(migration).toContain("where id = 'social-media'");
    expect(community).toContain("getPublicUrl(post.media_path!)");
    expect(socialMigration).toContain("for all to authenticated");
    expect(socialMigration).toContain("storage.foldername(name))[1] = auth.uid()::text");
  });

  it("keeps marketplace masters, previews, and covers private", () => {
    expect(commerceMigration).toContain("('content-covers', 'content-covers', false");
    expect(commerceMigration).toContain("('content-previews', 'content-previews', false");
    expect(commerceMigration).toContain("('content-masters', 'content-masters', false");
    expect(migration).not.toContain("update storage.buckets set public = true where id = 'content-");
  });

  it("preserves seller-scoped payment instructions and admin-only analytics access", () => {
    expect(commerceMigration).toContain("create policy \"BeatBox buyers view seller payment instructions on orders\"");
    expect(commerceMigration).toContain("o.seller_id = seller_payment_methods.seller_id");
    expect(commerceMigration).toContain("o.buyer_id = auth.uid() or public.is_beatbox_admin()");
    expect(advertiserMigration).toContain("public.is_beatbox_admin()");
    expect(advertiserMigration).toContain("drop policy if exists \"BeatBox admins manage ad events\"");
  });

  it("exposes signed-in save controls and debounced marketplace search", () => {
    expect(community).toContain("toggleBookmark");
    expect(community).toContain("social_post_bookmarks");
    expect(community).toContain("Search marketplace beats");
    expect(community).toContain("window.setTimeout");
    expect(community).toContain("contentReferenceHref(item.id)");
  });
});
