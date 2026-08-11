# BeatBox Project TODO

- [x] Use the official BeatBox logo URL exactly as provided throughout branded UI: https://cdn.phototourl.com/free/2026-08-11-b48b27bd-a5a9-4363-9b97-eacdce958524.png
- [x] Set BeatBox product naming and browser metadata consistently across the application
- [x] Build responsive landing page with hero, featured beats carousel, and top producers showcase
- [x] Build marketplace browse page with search, genre/mood/BPM filters, and grid/list toggle
- [x] Build reusable beat cards showing cover art, title, producer, price, play count, and preview controls
- [x] Implement inline watermarked 30–60 second audio preview player with waveform-style progress and volume control
- [ ] Implement Manus OAuth authentication with session persistence and protected routes
- [x] Enforce buyer and producer/seller role separation at the authentication and authorization layers
- [x] Implement producer profile pages with bio, social links, beat catalog, and follower count
- [x] Implement producer dashboard with beat upload, metadata, listing management, and sales history
- [x] Support beat uploads with audio file, cover art, title, genre, BPM, key, tags, and price metadata
- [x] Store uploaded audio and cover art in S3-compatible object storage
- [x] Build beat detail page with metadata, producer link, license options, Add to Cart, and Buy Now
- [x] Implement shopping cart and order summary flow
- [ ] Integrate Stripe Checkout with secure server-side payment intent handling
- [x] Implement post-purchase fulfillment with time-limited signed download links for full unmastered files
- [x] Prevent direct or permanent access to paid master beat files
- [x] Implement owner-only admin panel for users, beat listings, and reported content
- [x] Send purchase notifications to the platform owner and relevant producer
- [x] Add database schema, indexes, server procedures, and access controls for marketplace workflows
- [x] Add Vitest coverage for authorization, cart/order behavior, payment fulfillment, and signed-download safeguards
- [x] Verify responsive UI, loading states, empty states, error states, and mobile performance
- [x] Run type checks, tests, and production build verification
- [ ] Save one final checkpoint with all completed items marked complete

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
