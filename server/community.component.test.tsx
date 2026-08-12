// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const authState = { user: null as { id: string } | null, profile: null as { display_name: string } | null, loading: false };
  const state = { socialPosts: { data: [] as unknown[], error: null as Error | null, pending: false }, likes: { data: [] as unknown[], error: null as Error | null }, bookmarks: { data: [] as unknown[], error: null as Error | null }, follows: { data: [] as unknown[], error: null as Error | null }, likeInsertError: null as Error | null };
  const queryFor = (table: string) => {
    const response = table === "social_posts" ? state.socialPosts : table === "social_post_likes" ? state.likes : table === "social_post_bookmarks" ? state.bookmarks : state.follows;
    const chain: Record<string, unknown> = {};
    for (const method of ["select", "eq", "order", "range"]) chain[method] = vi.fn(() => chain);
    chain.then = (resolve: (value: unknown) => unknown) => table === "social_posts" && state.socialPosts.pending ? new Promise(() => {}) : Promise.resolve(response).then(resolve);
    chain.insert = vi.fn(() => Promise.resolve({ error: table === "social_post_likes" ? state.likeInsertError : null }));
    chain.delete = vi.fn(() => chain);
    return chain;
  };
  const supabaseMock = { from: vi.fn((table: string) => queryFor(table)), storage: { from: vi.fn() } };
  return { authState, state, supabaseMock };
});
const { authState, state, supabaseMock } = mocks;
vi.mock("@/contexts/SupabaseAuthContext", () => ({ useSupabaseAuth: () => mocks.authState }));
vi.mock("@/lib/supabase", () => ({ supabase: mocks.supabaseMock }));

import Community from "@/pages/Community";

const publishedPost = { id: "post-1", author_id: "creator-1", body: "New movie announcement", content_id: "movie-1", media_path: null, media_type: null, link_url: null, status: "published", like_count: 0, comment_count: 0, share_count: 0, created_at: "2026-08-12T00:00:00.000Z", profiles: { display_name: "Creator", avatar_url: null } };

afterEach(() => cleanup());

beforeEach(() => {
  authState.user = null;
  authState.profile = null;
  state.socialPosts = { data: [], error: null, pending: false };
  state.likes = { data: [], error: null };
  state.bookmarks = { data: [], error: null };
  state.follows = { data: [], error: null };
  state.likeInsertError = null;
  vi.clearAllMocks();
});

describe("Community Feed component", () => {
  it("shows an explicit initial loading state", () => {
    state.socialPosts = { data: [], error: null, pending: true };
    render(<Community />);
    expect(screen.getByText("Loading the BeatBox Feed…")).toBeTruthy();
  });

  it("shows a retryable error instead of silently rendering an empty feed", async () => {
    state.socialPosts = { data: [], error: new Error("Feed unavailable"), pending: false };
    render(<Community />);
    expect((await screen.findByRole("alert")).textContent).toContain("Feed unavailable");
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
  });

  it("renders published content references without exposing private media", async () => {
    state.socialPosts = { data: [publishedPost], error: null, pending: false };
    render(<Community />);
    expect(await screen.findByText("New movie announcement")).toBeTruthy();
    expect(screen.getByRole("link", { name: "View attached creator content" }).getAttribute("href")).toBe("/catalog?content=movie-1");
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByRole("audio")).toBeNull();
    expect(screen.queryByRole("video")).toBeNull();
  });

  it("persists a signed-in like interaction through Supabase", async () => {
    authState.user = { id: "buyer-1" };
    authState.profile = { display_name: "Buyer" };
    state.socialPosts = { data: [publishedPost], error: null, pending: false };
    render(<Community />);
    await screen.findByText("New movie announcement");
    const article = screen.getByText("New movie announcement").closest("article");
    expect(article).toBeTruthy();
    const actionBar = article?.querySelector(".community-post__actions");
    expect(actionBar).toBeTruthy();
    const likeButton = within(actionBar as HTMLElement).getAllByRole("button")[0];
    fireEvent.click(likeButton);
    await waitFor(() => expect(supabaseMock.from).toHaveBeenCalledWith("social_post_likes"));
  });
});
