import { describe, expect, it } from "vitest";
import { contentReferenceHref, FEED_PAGE_SIZE, getFeedRange, normalizeSocialPost, publicPublishedPosts } from "../client/src/lib/feed";
import type { SocialPost } from "../client/src/lib/models";

const post = (overrides: Partial<SocialPost> = {}): SocialPost => ({
  id: "post-1",
  author_id: "creator-1",
  body: "Launch update",
  content_id: "content-1",
  media_path: null,
  media_type: null,
  link_url: null,
  status: "published",
  like_count: 0,
  comment_count: 0,
  share_count: 0,
  created_at: "2026-08-12T00:00:00.000Z",
  profiles: { display_name: "Creator", avatar_url: null },
  ...overrides,
});

describe("BeatBox public Feed behavior", () => {
  it("returns stable bounded ranges for paginated public queries", () => {
    expect(getFeedRange(0)).toEqual([0, FEED_PAGE_SIZE - 1]);
    expect(getFeedRange(2)).toEqual([FEED_PAGE_SIZE * 2, FEED_PAGE_SIZE * 3 - 1]);
    expect(getFeedRange(-4)).toEqual([0, FEED_PAGE_SIZE - 1]);
  });

  it("keeps only published posts and normalizes embedded profile arrays", () => {
    const normalized = normalizeSocialPost({ ...post(), profiles: [{ display_name: "Creator", avatar_url: null }] });
    expect(normalized.profiles?.display_name).toBe("Creator");
    expect(publicPublishedPosts([post(), post({ id: "draft", status: "draft" })])).toHaveLength(1);
    expect(publicPublishedPosts([post(), post({ id: "removed", status: "removed" })])[0].id).toBe("post-1");
  });

  it("creates safe catalog deep links for referenced content", () => {
    expect(contentReferenceHref("movie/one?x=1")).toBe("/catalog?content=movie%2Fone%3Fx%3D1");
  });
});
