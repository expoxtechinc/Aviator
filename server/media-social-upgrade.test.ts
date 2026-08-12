import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const migration = readFileSync(resolve(root, "supabase/migrations/20260812_beatbox_media_social_upgrade.sql"), "utf8");
const sharesMigration = readFileSync(resolve(root, "supabase/migrations/20260812_beatbox_social_post_shares_fix.sql"), "utf8");
const actions = readFileSync(resolve(root, "client/src/components/SocialActions.tsx"), "utf8");
const comments = readFileSync(resolve(root, "client/src/components/CommentThread.tsx"), "utf8");
const reels = readFileSync(resolve(root, "client/src/pages/Reels.tsx"), "utf8");
const app = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");

describe("BeatBox media-first social upgrade", () => {
  it("defines additive RLS-protected structures for comments, mentions, hashtags, and reels", () => {
    for (const table of ["social_post_comment_likes", "social_post_mentions", "social_hashtags", "social_post_hashtags", "social_reels"]) expect(migration).toContain(`public.${table}`);
    expect(migration).toContain("alter table public.social_reels enable row level security");
    expect(migration).toContain("Never store or expose paid marketplace masters");
  });
  it("keeps social post shares separate from marketplace content shares", () => {
    expect(sharesMigration).toContain("public.social_post_shares");
    expect(actions).toContain('from("social_post_shares")');
    expect(actions).not.toContain('from("content_shares").insert({ post_id');
  });
  it("offers persistent sharing, replies, comment likes, report, and delete-own controls", () => {
    for (const token of ["Copy link", "WhatsApp", "Facebook", "Telegram", "role=\"menu\""]) expect(actions).toContain(token);
    for (const token of ["social_post_comment_likes", "parent_id", "Delete your comment", "Report comment", "inline-token"]) expect(comments).toContain(token);
  });
  it("registers a mobile-first public Reels route", () => {
    expect(app).toContain('path="/reels" component={Reels}');
    expect(reels).toContain('from("social_reels")');
    expect(reels).toContain("Paid marketplace masters remain protected");
  });
});
