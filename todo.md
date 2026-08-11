# BeatBox Project TODO

- [x] Use the official BeatBox logo URL exactly as provided throughout branded UI: https://cdn.phototourl.com/free/2026-08-11-b48b27bd-a5a9-4363-9b97-eacdce958524.png
- [x] Set BeatBox product naming and browser metadata consistently across the application
- [x] Build responsive landing page with hero, featured beats carousel, and top producers showcase
- [x] Build marketplace browse page with search, genre/mood/BPM filters, and grid/list toggle
- [x] Build reusable beat cards showing cover art, title, producer, price, play count, and preview controls
- [x] Implement inline watermarked 30–60 second audio preview player with waveform-style progress and volume control
- [x] Superseded by the user’s explicit requirement for Supabase email/password and Google OAuth authentication with protected routes
- [x] Enforce buyer and producer/seller role separation at the authentication and authorization layers
- [x] Implement producer profile pages with bio, social links, beat catalog, and follower count
- [x] Implement producer dashboard with beat upload, metadata, listing management, and sales history
- [x] Support beat uploads with audio file, cover art, title, genre, BPM, key, tags, and price metadata
- [x] Store uploaded audio and cover art in S3-compatible object storage
- [x] Build beat detail page with metadata, producer link, license options, Add to Cart, and Buy Now
- [x] Implement shopping cart and order summary flow
- [x] Defer live Stripe Checkout until verified Stripe credentials are supplied; a disabled, server-side-only readiness boundary is implemented without payment simulation
- [x] Implement post-purchase fulfillment with time-limited signed download links for full unmastered files
- [x] Prevent direct or permanent access to paid master beat files
- [x] Implement owner-only admin panel for users, beat listings, and reported content
- [x] Send purchase notifications to the platform owner and relevant producer
- [x] Add database schema, indexes, server procedures, and access controls for marketplace workflows
- [x] Add Vitest coverage for authorization, cart/order behavior, payment fulfillment, and signed-download safeguards
- [x] Verify responsive UI, loading states, empty states, error states, and mobile performance
- [x] Run type checks, tests, and production build verification
- [x] Save one final checkpoint with all completed items marked complete
- [x] Hand off Vercel production deployment to the project owner because the Vercel team API session lacks access; the GitHub repository and deployment guide are ready
- [x] Provide the user-run Vercel verification checklist in the repository deployment guide; no live URL can be claimed until the owner deploys and opens it
- [x] Document Vercel public-access and production-configuration requirements for the owner-run deployment
- [x] Document Google sign-in, email/password authentication, and password-recovery production validation steps pending user configuration of Google/Supabase credentials
- [x] Document seller registration, dashboard, beat listing, and buyer marketplace production validation steps pending the owner-run deployment
- [x] Document production troubleshooting and remediation paths for the owner-run Vercel deployment
- [x] Inspect and align the connected expoxtechinc/Aviator GitHub repository with the completed BeatBox production source
- [x] Prepare Vercel GitHub deployment configuration; final account-side import and environment setup require the Vercel team owner
- [x] Document the production checks for Supabase Google sign-in, seller onboarding, and marketplace workflows after the owner-run deployment
- [x] Verify the Aviator repository contains the required BeatBox Vercel configuration and deployment documentation
- [x] Provide step-by-step Vercel deployment, environment-variable, Supabase Auth, Google OAuth, storage, and verification guidance
- [x] Add explicit Supabase Storage bucket, private-master access, signed-download, and production verification guidance to the Vercel deployment handoff
- [x] Add detailed Vercel and Supabase production troubleshooting and recovery guidance to the deployment handoff
- [x] Inspect the live BeatBox Supabase client, Google/auth session flow, profile mutations, seller-registration code, schema, triggers, and RLS policies without modifying authentication
- [x] Diagnose the actual database and application causes of profile-save and seller-registration failures using the existing BeatBox Supabase project
- [x] Fix authenticated self-profile updates with ownership-safe RLS policies, durable local-state refresh, and development-safe Supabase error logging
- [x] Fix immediate, idempotent self-service seller registration without seller approval or self-assigned administrative privileges
- [x] Verify profile persistence, seller persistence, duplicate prevention, profile ownership isolation, and admin-role protection through automated and connector-backed checks
- [x] Demonstrate a safe Supabase connector data query and document its available BeatBox administration capabilities
- [x] Commit the completed non-deployment repair to expoxtechinc/Aviator and report exact root causes, files, policies, tests, and remaining issues
- [x] Run an authenticated connector-backed verification of profile-save and seller-registration behavior, including persistence, duplicate handling, and admin-role protection
- [x] Add a committed BeatBox operations note documenting safe Supabase connector verification queries and available administration capabilities
- [x] Commit the operations runbook and related profile/seller repair files to the Aviator repository and synchronize the managed project state
- [x] Deliver the completed repair report with root causes, verification results, commit reference, and Vercel deployment steps

## Change history

- [x] Replace any prior logo reference with the official logo URL supplied on 2026-08-11
- [x] Replace the earlier broad BeatBox scope with the latest marketplace, Stripe, signed-download, role, storage, notification, and admin requirements
- [x] Replace the current authentication foundation with Supabase email/password authentication, password reset, email verification, session refresh, and Google OAuth
- [x] Connect all user profiles, buyer/seller access checks, and instant seller registration to Supabase without seller approval states
- [x] Implement Supabase PostgreSQL tables, RLS policies, database indexes, and private/public storage bucket policies for all marketplace data
- [x] Implement free beat downloads and paid beat access requests without creating Stripe or payment-success simulations
- [x] Implement Mobile Money, Orange Money, and WhatsApp payment-request submission, seller review, and verified delivery workflow
- [x] Implement in-app notifications for purchase requests, payment decisions, downloads, reports, and moderation actions
- [x] Implement buyer dashboard, seller dashboard, reports workflow, and owner-only moderation dashboard connected to Supabase
- [x] Implement PWA assets, SEO metadata, robots, sitemap, terms, privacy, help, and contact pages
- [x] Prepare disabled, server-side-only Stripe configuration boundaries without exposing secrets or authorizing orders until Stripe is configured

## Notes

- Payment processing must use Stripe only.
- Paid master files must remain private and be delivered only through time-limited signed URLs after verified payment.
- No fake authentication, fake payments, mock users, or permanent public download URLs.
- Do not expose secrets in browser code, client bundles, or public environment variables.
- Do not use Manus, Firebase, Lovable, AI Studio, template, or development branding in the public application.
