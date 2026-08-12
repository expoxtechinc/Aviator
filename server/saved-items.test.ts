import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const page = readFileSync(resolve(root, "client/src/pages/SavedItems.tsx"), "utf8");
const app = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
const shell = readFileSync(resolve(root, "client/src/components/MarketplaceShell.tsx"), "utf8");

describe("Saved Items protection and behavior contracts", () => {
  it("is a protected route with signed-in gating and account navigation", () => {
    expect(app).toContain('path="/saved" component={SavedItems}');
    expect(page).toContain("Sign in to see saved items.");
    expect(shell).toContain('href="/saved"');
  });

  it("reads only the current user's bookmarks and public post/profile fields", () => {
    expect(page).toContain('from("social_post_bookmarks")');
    expect(page).toContain('.eq("user_id", user.id)');
    expect(page).toContain('profiles!social_posts_author_id_fkey');
    expect(page).toContain('.eq("social_posts.status", "published")');
    expect(page).toContain('post?.status === "published"');
    expect(page).not.toContain("content-masters");
    expect(page).not.toContain("payment_proofs");
  });

  it("supports filtering, marketplace references, and truthful removal rollback", () => {
    expect(page).toContain("Filter saved items");
    expect(page).toContain("contentReferenceHref(item.content_id)");
    expect(page).toContain('.delete().eq("user_id", user.id).eq("post_id", postId)');
    expect(page).toContain("setItems(previous)");
    expect(page).toContain("Remove");
    expect(page).toContain('href={`/feed?post=${encodeURIComponent(item.id)}`}');
  });
});
