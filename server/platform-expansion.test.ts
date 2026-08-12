import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("pasted_content_13 platform expansion", () => {
  it("exposes real Supabase phone OTP states without hardcoded credentials", () => {
    const auth = read("client/src/contexts/SupabaseAuthContext.tsx");
    const page = read("client/src/pages/Auth.tsx");
    expect(auth).toContain("signInWithOtp");
    expect(auth).toContain("verifyOtp");
    expect(page).toContain("Use phone OTP");
    expect(page).toContain("one-time-code");
    expect(page).not.toMatch(/AIza|gsk_|sk-or-/);
  });

  it("keeps private messaging behind authenticated user-scoped storage and RLS", () => {
    const page = read("client/src/pages/Messages.tsx");
    const migration = read("supabase/migrations/20260812_beatbox_platform_expansion.sql");
    expect(page).toContain("message-media");
    expect(page).toContain("conversation_members");
    expect(page).toContain("sender_id: user.id");
    expect(migration).toContain("alter table public.messages enable row level security");
    expect(migration).toContain("m.user_id = auth.uid()");
  });

  it("uses a constrained, RLS-protected reaction enum rather than fabricated counts", () => {
    const migration = read("supabase/migrations/20260812_beatbox_post_reactions.sql");
    const actions = read("client/src/components/SocialActions.tsx");
    for (const reaction of ["like", "love", "haha", "wow", "sad", "angry"]) expect(migration).toContain(`'${reaction}'`);
    expect(migration).toContain("primary key (post_id, user_id)");
    expect(actions).toContain("social_post_reactions");
    expect(actions).toContain("upsert");
  });
});
