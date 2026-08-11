import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const migration = readFileSync(resolve(root, "supabase/migrations/20260811_beatbox_profile_and_seller_repair.sql"), "utf8");
const profileSaveRepair = readFileSync(resolve(root, "supabase/migrations/20260811_beatbox_profile_save_rpc_repair.sql"), "utf8");
const sellerRoleRepair = readFileSync(resolve(root, "supabase/migrations/20260811_beatbox_seller_role_enum_repair.sql"), "utf8");
const authContext = readFileSync(resolve(root, "client/src/contexts/SupabaseAuthContext.tsx"), "utf8");
const dashboards = readFileSync(resolve(root, "client/src/pages/Dashboards.tsx"), "utf8");

describe("BeatBox profile and seller security contract", () => {
  it("repairs only the authenticated caller profile through a guarded RPC", () => {
    expect(migration).toContain("function public.update_self_profile(");
    expect(migration).toContain("current_user_id uuid := auth.uid()");
    expect(migration).toContain("where id = current_user_id");
    expect(migration).toContain("profiles_read_own_or_admin");
    expect(migration).toContain("with check (id = auth.uid() or public.is_beatbox_admin())");
    expect(dashboards).toContain('supabase.rpc("update_self_profile"');
  });

  it("creates an id-matched profile without granting browser-side privilege changes", () => {
    expect(migration).toContain("function public.ensure_self_profile()");
    expect(migration).toContain("insert into public.profiles (id, email");
    expect(migration).toContain("current_user_id");
    expect(migration).toContain("drop policy if exists profiles_insert_own");
    expect(authContext).toContain('supabase.rpc("ensure_self_profile")');
  });

  it("promotes a seller immediately and idempotently without permitting self-assigned admin role", () => {
    expect(migration).toContain("function public.register_as_seller");
    expect(migration).toContain("on conflict (id) do update");
    expect(migration).toContain("'seller'::public.user_role");
    expect(migration).toContain("beatbox.allow_seller_registration");
    expect(authContext).toContain('supabase.rpc("register_as_seller"');
  });

  it("ships a narrow follow-up migration when the live profile RPC is missing", () => {
    expect(profileSaveRepair).toContain("create or replace function public.update_self_profile(");
    expect(profileSaveRepair).toContain("perform public.ensure_self_profile()");
    expect(profileSaveRepair).toContain("where id = current_user_id");
    expect(profileSaveRepair).toContain("revoke all on function public.update_self_profile");
    expect(profileSaveRepair).toContain("grant execute on function public.update_self_profile");
  });

  it("returns user_role enum values during instant seller registration", () => {
    expect(sellerRoleRepair).toContain("'admin'::public.user_role");
    expect(sellerRoleRepair).toContain("'seller'::public.user_role");
    expect(sellerRoleRepair).toContain("on conflict (id) do update");
    expect(sellerRoleRepair).toContain("grant execute on function public.register_as_seller");
  });
});
