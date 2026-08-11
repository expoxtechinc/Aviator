# BeatBox Supabase Operations Runbook

## Purpose

This runbook records the safe administrative checks for BeatBox’s Supabase project. It is intended for the project owner or a trusted operator working through an authorized Supabase administration connection. It does **not** contain credentials, user identifiers, payment information, or production profile data.

> Treat the database as the authority for identity, seller roles, orders, and download entitlements. Use the web application for normal user actions; reserve administration access for maintenance, diagnostics, and controlled migrations.

## Operating safeguards

| Activity | Required approach | Reason |
|---|---|---|
| Read production state | Select only necessary columns and always use an explicit `LIMIT`. | Prevents unnecessary exposure of customer data. |
| Apply schema or function changes | Use a named, recorded database migration. | Keeps the live schema traceable and reproducible from the repository. |
| Verify user-scoped RPC behavior | Execute a short `BEGIN`/`ROLLBACK` transaction with locally scoped request claims. | Tests the authenticated path without retaining verification content. |
| Diagnose a user-reported error | Inspect the exact RPC signature, function body, grants, policies, and error log before changing application code. | Separates client contract issues from database policy or function faults. |
| Handle sensitive data | Never place secrets, auth tokens, phone numbers, payment references, master-file URLs, or full profile exports in repository files or support messages. | Preserves customer privacy and protects delivery controls. |

## Safe verification sequence

The following sequence is sufficient to diagnose profile and seller onboarding without changing production records.

1. Confirm the project reference before every administration session: `huhsbpjdwepovtjraxsd`.
2. Inventory the relevant routines with `pg_proc` and `pg_get_function_identity_arguments`, restricting the query to the exact function names. The expected client contracts are `update_self_profile(text, text, text, text)` and `register_as_seller(text)`.
3. Check execution privileges with `has_function_privilege`. Profile and seller RPCs must be executable by `authenticated` and must not be executable by `anon`.
4. Confirm the `profiles_update_own`, `seller_profiles_insert_own`, and `seller_profiles_update_own` policies are present. Do not weaken ownership policies to make a browser mutation succeed.
5. When behavior must be proven, use a rollback-only transaction. Set a local authenticated subject, invoke `update_self_profile`, invoke `register_as_seller` twice, and confirm one seller profile is present. To verify the administrative safeguard, promote the transaction-only row to the enum value `admin`, invoke seller registration again, and confirm the role remains `admin`. Finish with `ROLLBACK`.

## Current repair status

| Area | Live repair | Verification standard |
|---|---|---|
| Profile persistence | `update_self_profile` is defined as a guarded `SECURITY DEFINER` routine that scopes updates to `auth.uid()` and validates public-profile fields. | Its signature and authenticated execution grant are present; a rollback-only live check confirmed display name, username, bio, and country changes resolve for the authenticated profile. |
| Seller onboarding | `register_as_seller` creates or updates the caller’s `seller_profiles` row and explicitly returns `public.user_role` enum values when changing roles. | A rollback-only live check invoked the routine twice and confirmed exactly one seller profile with the requested producer name. |
| Privilege preservation | Seller promotion treats an existing admin as an admin instead of downgrading or replacing the role. | A rollback-only live check set a temporary admin role and confirmed it remained `admin` after seller registration. |
| Browser contract | The dashboard sends named `p_display_name`, `p_username`, `p_bio`, and `p_country` parameters; onboarding sends `producer_name_input`. | The client parameter names match the deployed PostgreSQL routine signatures. |

## Repair migrations

The repository contains all required migrations for a clean environment and the two narrow production follow-ups.

| Migration | Responsibility |
|---|---|
| `20260811_beatbox_profile_and_seller_repair.sql` | Creates guarded self-profile and seller registration routines, updates the ownership policies, and uses `public.user_role` enum values for seller promotion. |
| `20260811_beatbox_profile_save_rpc_repair.sql` | Recreates `update_self_profile` if it is absent from a live environment and limits execution to authenticated accounts. |
| `20260811_beatbox_seller_role_enum_repair.sql` | Corrects the live seller promotion function so its `CASE` expression returns `public.user_role` values rather than untyped text. |

## Administration capabilities

| Need | Safe capability |
|---|---|
| Schema health | List tables, columns, policies, functions, extensions, and recorded migrations. |
| Access-control maintenance | Apply reviewed RLS, function, trigger, storage, or index changes through named migrations. |
| Authentication diagnostics | Inspect Auth service logs and verify OAuth redirect configuration in the Supabase dashboard without exposing credentials. |
| Storage delivery checks | Inspect public-preview and private-master bucket configuration, then confirm signed-download routing without publishing private master paths. |
| Marketplace support | Query a narrowly scoped order, payment request, report, or notification by a known internal identifier only when support requires it. |
| Runtime investigation | Retrieve targeted API, database, Auth, Storage, or Edge Function logs for a reported incident. |

## Escalation and recovery

If profile saving or seller registration fails again, capture the browser error message and the timestamp, then inspect the live function definition and database logs first. Do not disable RLS, grant broad `anon` access, or convert private beat masters to public objects as a workaround. A schema correction should be made in a new migration, validated locally with the existing Vitest suite, and verified in a rollback-only transaction before it is announced to users.
