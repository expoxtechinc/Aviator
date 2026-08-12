# BeatBox Extension Design

## Compatibility boundary

The extension keeps the existing Supabase project, GitHub repository, Vercel project, Supabase Auth flows, Google OAuth, `seller_payment_methods`, private Storage buckets, `secure-download`, payment-request RPCs, RLS helpers, and current BeatBox UI shell. No production reset, duplicate project, or service-role key is introduced.

## Reuse decisions

| Existing capability | Extension decision |
|---|---|
| `beats` | Extend with `content_type`, `access_mode`, `currency`, and `download_enabled` so existing beat URLs, cards, orders, previews, and signed downloads remain valid. |
| `seller_payment_methods` | Add seller-owned country, currency, account-holder, and contact fields; retain existing method rows and buyer visibility policy. |
| `orders` and `payment_requests` | Preserve the existing non-Stripe request/review lifecycle; add seller payout and platform-fee fields only after verification. |
| `secure-download` | Extend its request contract to support the existing beat master plus generic protected content while keeping five-minute signed URLs and entitlement checks. |
| Supabase Storage | Reuse existing beat buckets and add separate private content buckets only where media type requires it; no private original becomes public. |
| Existing `profiles`, `producer_follows`, `notifications`, `reports` | Reuse them for identity, follows, alerts, and moderation wherever compatible. |

## New domain boundaries

The extension introduces a generic `content_items`-style interaction layer for comments, reactions, shares, and bookmarks; social posts with media references; products and product orders; advertiser campaigns, creatives, and event counters; and a seller earnings view derived from verified orders. These additions are isolated from existing beat/order rows and use owner-scoped RLS policies.

## Access modes

Creators can select `free_download`, `paid_download`, or `stream_only`. Free downloads require authentication and are signed from private Storage. Paid downloads require a verified or delivered order for the owning content item. Stream-only content never receives an original-file download entitlement. Preview and cover reads remain separate from original delivery.

## Security invariants

Every seller-owned row checks `auth.uid()` against its owner. Admin-only mutations use the existing BeatBox admin helper. Buyer visibility of seller payment data is limited to an order context. Paid/private originals are never selected through public client queries and are delivered only through the entitlement-checked Edge Function. Payment completion and seller earnings are derived only from verified states; no client can mark a payment successful.
