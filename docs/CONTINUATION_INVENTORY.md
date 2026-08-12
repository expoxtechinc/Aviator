# BeatBox continuation inventory

## Confirmed specification

The attached continuation prompt requires preserving the existing BeatBox architecture and extending it rather than rebuilding. It names Supabase Auth, Google OAuth, instant seller registration, seller-owned payment settings, protected free/paid content, social persistence, products, apps, advertising, creator monetization, secure downloads, AI assistant behavior, SEO, Google Search Console verification, mobile responsiveness, and role-based acceptance tests.

The required production verification file is `/google7c2d5df9354788c6.html`, and the expected production host named in the prompt is `https://beat-box-org.vercel.app`. Private or paid content must not be indexable or expose permanent master URLs. Manual payments must remain pending until seller verification; client-side payment completion must never grant paid entitlement.

## Local managed project

The active managed source is `/home/ubuntu/beatbox`. Its current Git remote is a managed artifact remote rather than a public GitHub repository. Existing routes include `/`, `/explore`, `/beats/:slug`, `/producers`, `/producers/:id`, `/auth`, `/auth/callback`, `/cart`, `/account`, `/favorites`, `/seller`, `/community`, `/catalog`, `/studio`, `/ai`, `/admin`, `/help`, `/terms`, `/privacy`, and `/contact`.

The current package scripts provide `dev`, `build`, `start`, `check`, `test`, `format`, and `db:push`. The project already contains `robots.txt` and `sitemap.xml`, but they currently reference `https://beatbox.manus.space`, not the production host named in the continuation prompt. There is no `vercel.json` in the managed project inventory. `client/index.html` contains title, description, and Open Graph basics, but no canonical URL, Twitter card metadata, JSON-LD, or Google verification link/file.

## GitHub verification

The requested repository `expoxtechinc/beatbox` is not available under the configured `expoxtechinc` GitHub account. Available BeatBox-named repositories include `BEATBOX-ORG`, `beatbox-marketplace`, and `beatbox-marketplace-7e8ce562`; `Aviator` also exists but is explicitly disallowed by the continuation prompt. No repository has been selected or modified based on this ambiguity.

## Safe next action

Continue implementation in `/home/ubuntu/beatbox` only after reconciling the active deployment source. The first low-risk production change is to add the exact Google verification file, correct robots/sitemap host handling, and add route-aware canonical/Open Graph/Twitter/structured metadata while preserving the existing SEO hook and private-content protections. GitHub push destination must be clarified or confirmed through the project/deployment configuration before pushing.
