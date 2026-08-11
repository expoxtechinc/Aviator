# Profile and seller-registration diagnosis — 2026-08-11

## Confirmed live Supabase facts

- Connected project: `huhsbpjdwepovtjraxsd` (Beat Box), active in `eu-west-1`.
- The `profiles` table is RLS enabled and contains self-only `SELECT`, `INSERT`, and `UPDATE` policies. Its editable fields include `username` (unique), `display_name`, `bio`, and `country`.
- The `seller_profiles` table is RLS enabled, has no rows, and has self-only insert/update policies. Its insert policy also requires `public.is_beatbox_seller()`.
- The live database has active privilege and seller-verification triggers, but the expected `public.promote_self_to_seller(text)` RPC was absent from the live function inventory. The client currently calls that absent RPC, which prevents seller registration.
- The profile editor sends an unrestricted `update(form)` request. A repair should use a dedicated, security-definer self-profile RPC that normalizes its allowed fields, reserves roles and account status, validates username format, and returns the persisted profile for immediate local-state refresh.
- Google OAuth configuration and client initialization are outside the scope of this repair and must remain unchanged.

## Live API-log evidence

The recent Supabase API log records a production `404` for `POST /rest/v1/rpc/promote_self_to_seller`, confirming that seller registration fails because the client calls a database routine that does not exist in the live project. The same log records a successful `204` profile update; therefore the reported profile-save failure is not a blanket RLS denial, but the client currently cannot distinguish a constraint/no-row error from a durable save and does not request the persisted row. The producer-directory query returned a `400` because it filters the hardened `public_profiles` projection by a `role` column that is no longer publicly exposed; this is a separate seller-discovery defect that should be corrected without reopening the private profiles table.
