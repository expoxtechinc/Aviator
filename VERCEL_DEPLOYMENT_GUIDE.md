# BeatBox GitHub → Vercel production deployment

This guide deploys the BeatBox marketplace from the `main` branch of `expoxtechinc/Aviator` to Vercel. The repository already includes `vercel.json`, which builds the Vite application and rewrites all client routes to `index.html`.

## 1. Import the GitHub repository

1. In [Vercel](https://vercel.com/new), select **Add New → Project**.
2. Import `expoxtechinc/Aviator` from GitHub.
3. Set the branch to **`main`**.
4. Keep the **Root Directory** empty (`.`).
5. Use these build settings if Vercel does not populate them from `vercel.json`:

| Setting | Required value |
|---|---|
| Framework Preset | `Vite` |
| Install Command | `pnpm install --frozen-lockfile` |
| Build Command | `pnpm build` |
| Output Directory | `dist/public` |
| Node.js Version | `22.x` |

> Do not deploy the `dist` folder from your computer. Vercel must build the repository on its platform so future pushes to `main` deploy automatically.

## 2. Add Vercel environment variables

Open **Project Settings → Environment Variables**. Add both variables to **Production**, **Preview**, and **Development**. Then redeploy, because Vite embeds `VITE_*` values at build time.

| Variable | Production value | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://huhsbpjdwepovtjraxsd.supabase.co` | BeatBox Supabase API project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Use the active **beatbox** publishable API key from Supabase Project Settings → API → Publishable key | Browser-safe key; never use a service-role key here |

The AI assistant uses the serverless `/api/trpc` function and reads provider credentials only on the server. Add these optional server-only variables to **Production, Preview, and Development** if you want external-provider routing. Do not prefix them with `VITE_`.

| Variable | Purpose | Recommended value |
|---|---|---|
| `AI_ROUTER_ENABLED` | Enables the BeatBox AI router | `true` |
| `AI_ROUTER_TIMEOUT_MS` | Per-provider request timeout | `18000` |
| `GEMINI_API_KEY` | Gemini server credential | Add the rotated real key in Vercel, never GitHub/chat |
| `GEMINI_MODEL` | Gemini model name | `gemini-2.5-flash` |
| `GROQ_API_KEY` | Groq server credential | Add the rotated real key in Vercel, never GitHub/chat |
| `GROQ_MODEL` | Groq model name | `llama-3.3-70b-versatile` |
| `OPENROUTER_API_KEY` | OpenRouter server credential | Add the rotated real key in Vercel, never GitHub/chat |
| `OPENROUTER_MODEL` | OpenRouter model name | `deepseek/deepseek-chat-v3-0324:free` |

The router attempts Gemini, then Groq, then OpenRouter, then the built-in BeatBox provider. This provides resilience, not unlimited usage: provider quotas, rate limits, outages, and model availability still apply. The client never receives provider credentials.

No Stripe variables are required or supported for this build. Stripe Checkout remains deliberately disabled until real server-side credentials and webhook verification are configured. Never add `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, Google client secrets, provider keys, or a Stripe secret key as `VITE_*` variables: anything prefixed with `VITE_` is sent to the browser.

## 3. Configure Supabase application URLs

After the first Vercel deployment, copy the assigned production URL, referred to below as `https://YOUR-BEATBOX-DOMAIN`.

In **Supabase → Authentication → URL Configuration** set:

| Field | Value |
|---|---|
| Site URL | `https://YOUR-BEATBOX-DOMAIN` |
| Additional Redirect URLs | `https://YOUR-BEATBOX-DOMAIN/auth/callback` |
| Additional Redirect URLs | `https://YOUR-BEATBOX-DOMAIN/auth/callback?mode=recovery` |

For preview deployments, add the exact preview URL when testing authentication. If your Supabase URL configuration supports wildcard redirect URLs, use the Vercel preview pattern approved by your organization rather than exposing an overly broad wildcard.

BeatBox sends email confirmation and Google OAuth users to `/auth/callback`; password recovery uses `/auth/callback?mode=recovery`.

## 4. Enable Google sign-in in Supabase

1. In [Google Cloud Console](https://console.cloud.google.com/), create or select the Google Cloud project for BeatBox.
2. Configure the OAuth consent screen. Add the production domain to **Authorized domains** and publish the consent screen or add required test users.
3. Create an **OAuth 2.0 Client ID** of type **Web application**.
4. Add this exact Google **Authorized redirect URI**:

   ```text
   https://huhsbpjdwepovtjraxsd.supabase.co/auth/v1/callback
   ```

5. Copy the Google Client ID and Client Secret.
6. In **Supabase → Authentication → Providers → Google**, enable Google and paste the Client ID and Client Secret. Save.
7. Confirm the Supabase URL Configuration values in section 3 are saved.

Google returns to Supabase first, then Supabase returns the user to BeatBox at `/auth/callback`. Do **not** put the Vercel domain in Google’s redirect-URI field; the Google redirect URI must be the Supabase callback above.

## 5. Confirm email/password authentication

In **Supabase → Authentication → Providers → Email**, leave Email enabled. For production, keep email confirmation enabled and configure the production SMTP provider if the default email sending limits are not suitable. Verify that the confirmation and recovery templates preserve the configured redirect URL.

## 6. Deploy and verify

1. Return to Vercel and click **Deploy**.
2. Once the deployment is ready, open the production URL in an incognito window.
3. Verify the following before sharing the marketplace publicly:

| Check | Expected behavior |
|---|---|
| Landing and `/explore` | BeatBox loads with the official logo, responsive layout, and live empty states until producers publish beats |
| Email registration | Confirmation email completes at `/auth/callback` and a buyer profile exists in Supabase |
| Email sign-in | Session persists after refresh and sign-out clears the account state |
| Password recovery | Recovery email opens `/auth/callback?mode=recovery` and accepts a new password |
| Google sign-in | Google returns to `/auth/callback` and creates or updates a buyer profile |
| AI assistant | Signed-in user can open `/ai`; `/api/trpc` returns an answer or an honest provider-unavailable message without exposing keys |
| Seller registration | Authenticated buyer can select **Become a seller**; no admin approval is required |
| Seller dashboard | Seller can add profile details, payment instructions, a 30–60 second preview, a cover image, and a private master file |
| Buyer marketplace | Published beats appear in search and filters; favorites and cart behave only for signed-in users |
| Payment requests | Mobile Money, Orange Money, and WhatsApp requests do not create a payment-success state; seller review is required |
| Secure download | The active `secure-download` Supabase Edge Function requires a user JWT and verifies the entitlement before returning a time-limited master-file URL |

## 7. Verify Supabase Storage and secure delivery

The BeatBox migrations already created the storage buckets and RLS policies in the connected Supabase project. Do not recreate them manually and do not change their visibility to public. In **Supabase → Storage**, confirm the following bucket IDs exist and remain private.

| Bucket ID | Intended content | Maximum file size | Who may access it |
|---|---|---:|---|
| `beat-covers` | Beat cover images | 10 MB | Public read through the BeatBox storage policy; sellers manage only their own `{seller-id}/...` objects |
| `beat-previews` | Watermarked 30–60 second preview audio | 50 MB | Public read through the BeatBox storage policy; sellers manage only their own `{seller-id}/...` objects |
| `beat-masters` | Full unmastered paid-beat files | 500 MB | Seller owner access only; buyers do not receive direct bucket access |
| `payment-proofs` | Mobile Money/Orange Money proof images or PDFs | 10 MB | Buyer owns upload; relevant seller can review a proof referenced by that seller’s payment request |
| `avatars` | Profile photos | 5 MB | Authenticated user manages only their own `{user-id}/...` objects |

The first folder in every uploaded object key must be the authenticated user’s UUID. This is required by the storage policies. Sellers must upload covers, previews, and masters under their own UUID folder; buyers must upload payment proofs under their own UUID folder.

> **Master files must never be made public, copied into the `beat-previews` bucket, or given a permanent URL.** The active `secure-download` Edge Function validates the caller JWT and a free/verified-purchase entitlement, then creates a short-lived signed URL for the object in `beat-masters`.

Use this post-deploy storage test sequence:

1. Register a test user, use **Become a seller**, and upload a compliant cover, 30–60 second preview, and master. Confirm the files appear in the seller’s UUID folder in the correct buckets.
2. Open the published beat from a signed-out browser session. The cover and preview must be playable; the master must not be accessible from a bucket URL.
3. As a different buyer, add a free beat or submit a non-Stripe payment request. The buyer should not receive the master while a paid request is pending or rejected.
4. As the seller or admin, mark a genuine payment request as verified. The buyer’s dashboard should call `secure-download`; only then should a short-lived download URL be issued.
5. Paste the expired signed URL into a new browser session after its expiration period. It must fail. This confirms there is no permanent public-master access.

## 8. Day-two operations

Every push to `main` should trigger a Vercel deployment. Use Vercel’s deployment logs for build problems and Supabase’s Auth, API, Storage, and Edge Function logs for backend errors. When you attach a custom domain, add the custom domain and its `/auth/callback` addresses to Supabase URL Configuration, then update the Google consent screen’s authorized domain if necessary.

## 9. Production troubleshooting and recovery

Use the following recovery table rather than changing RLS policies or exposing private files to make a symptom disappear. After every configuration correction, trigger a new Vercel deployment or re-test in an incognito window so cached sessions and Vite build-time variables do not mask the result.

| Symptom | Where to inspect | Corrective action |
|---|---|---|
| Visitors see a Vercel login or SSO page instead of BeatBox | Vercel → Project → Settings → Deployment Protection | Disable team SSO/deployment protection for the Production environment, or create an approved public access policy. Then open the production URL in an incognito window. |
| Vercel build fails or reports a missing output directory | Vercel → Project → Deployments → failed build logs | Confirm the root directory is `.`, install command is `pnpm install --frozen-lockfile`, build command is `pnpm build`, output directory is `dist/public`, Node is 22.x, and `vercel.json` remains committed. Redeploy. |
| The site loads but shows “Supabase is not configured” or cannot load data | Vercel → Project → Settings → Environment Variables, then latest deployment logs | Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to Production, Preview, and Development. Use the publishable key, not a service-role key. Redeploy because Vite variables are compiled into the bundle. |
| Refreshing `/explore`, a beat URL, or `/auth/callback` returns a 404 | Repository `vercel.json` and Vercel deployment output | Keep the SPA rewrite in `vercel.json` and ensure Vercel uses the repository root. The repository also includes `api/trpc/[trpc].ts` for server-side tRPC; do not remove it or route `/api/trpc` to `index.html`. Redeploy. |
| `/ai` loads but chat reports no provider is available | Vercel → Project → Settings → Environment Variables; Vercel function logs | Add rotated real `GEMINI_API_KEY`, `GROQ_API_KEY`, and/or `OPENROUTER_API_KEY` as server-only variables, set `AI_ROUTER_ENABLED=true`, then redeploy. Provider quotas can still cause failover or temporary unavailability. |
| Email confirmation, password recovery, or Google sign-in returns to the wrong domain or shows `redirect_to` errors | Supabase → Authentication → URL Configuration | Set Site URL to the exact public HTTPS domain and add exact `/auth/callback` and `/auth/callback?mode=recovery` allowed redirects. Add preview URLs only when testing them. Retry in a fresh browser session. |
| Google reports `redirect_uri_mismatch` | Google Cloud Console → APIs & Services → Credentials; Supabase → Authentication → Providers → Google | Google must contain only `https://huhsbpjdwepovtjraxsd.supabase.co/auth/v1/callback` as the OAuth callback. Put the Vercel domain in Supabase redirect settings, not in Google’s redirect-URI field. Confirm Google is enabled in Supabase. |
| Google provider is not visible or a test user is denied | Supabase → Authentication → Providers → Google; Google Cloud Console → OAuth consent screen | Enable Google in Supabase and save the Client ID/Secret. Publish the Google consent screen or add the email address as a Google OAuth test user. |
| Seller cannot upload a cover, preview, or master file | Browser developer console; Supabase → Storage → policies and object path | Confirm the account has completed **Become a seller** and the object key begins with that authenticated seller UUID. Keep each bucket private and do not loosen the existing RLS policies. |
| A buyer can open a master file without an entitlement, or cannot download after a verified order | Supabase → Storage; Edge Functions → `secure-download` logs; orders and payment requests | A master must only live in `beat-masters`. Confirm the order is genuinely free or has `payment_verified`/delivered access, then invoke the `secure-download` Edge Function while signed in. Do not add public read permission to `beat-masters`. |
| Payment requests appear to complete automatically | Seller dashboard; Supabase `payment_requests` and `orders` records | The correct state after request submission is `payment_submitted` or `under_review`, not paid. Review through the seller/admin workflow and set `payment_verified` only after real payment evidence is checked. |
| A change pushed to GitHub does not appear on Vercel | Vercel → Project → Git; Vercel → Deployments; GitHub → Actions/commit history | Confirm Vercel is connected to `expoxtechinc/Aviator`, Production Branch is `main`, and the commit appears in Vercel deployments. If the Git integration is detached, reconnect it from Vercel and deploy the current `main` commit manually. |

### Recovery checklist

1. Capture the Vercel deployment URL, deployment ID, and timestamp.
2. Inspect the matching Vercel build or runtime logs before changing configuration.
3. For identity and storage failures, inspect Supabase Auth, Storage, Edge Function, and API logs for the same timestamp.
4. Apply the smallest correction in the controlling system: Vercel for builds/environment variables, Supabase for redirects/RLS/Storage, and Google Cloud for OAuth consent and callback setup.
5. Redeploy after a Vercel variable or source configuration change, then re-test in an incognito window with a non-admin test account.

## Production security checklist

- [ ] Vercel project is not protected by team SSO for public visitors, unless intentional.
- [ ] Only the listed `VITE_*` browser-safe variables are configured in Vercel; AI provider keys are server-only and unprefixed.
- [ ] AI provider keys were rotated after any accidental exposure and added directly in Vercel, not chat or GitHub.
- [ ] Supabase Site URL and allowed redirects match the final public Vercel/custom domain.
- [ ] Google OAuth uses the Supabase callback URL, not the Vercel callback URL.
- [ ] Email confirmation and recovery work in production.
- [ ] No service-role, database, Google-secret, or Stripe-secret credentials are committed to GitHub or exposed as browser variables.
- [ ] Stripe is left disabled until a real Checkout + webhook implementation is configured.

## References

1. [Vercel: Deploying a Vite app](https://vercel.com/docs/frameworks/frontend/vite)
2. [Vercel: Project configuration](https://vercel.com/docs/project-configuration/vercel-json)
3. [Supabase: Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
4. [Supabase: Sign in with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
