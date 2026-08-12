import type { SocialPost } from "@/lib/models";

export const FEED_PAGE_SIZE = 20;

export function getFeedRange(page: number, pageSize = FEED_PAGE_SIZE): [number, number] {
  const safePage = Math.max(0, Math.floor(page));
  return [safePage * pageSize, safePage * pageSize + pageSize - 1];
}

export function normalizeSocialPost(row: SocialPost & { profiles?: SocialPost["profiles"] | SocialPost["profiles"][] }): SocialPost {
  return { ...row, profiles: Array.isArray(row.profiles) ? row.profiles[0] || null : row.profiles || null };
}

export function publicPublishedPosts(rows: SocialPost[]): SocialPost[] {
  return rows.filter(row => row.status === "published");
}

export function contentReferenceHref(contentId: string): string {
  return `/catalog?content=${encodeURIComponent(contentId)}`;
}
