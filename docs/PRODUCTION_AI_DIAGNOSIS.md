# Production AI diagnosis

On 12 August 2026, the public health request

`https://beat-box-org.vercel.app/api/trpc/ai.health?batch=1&input=%7B%220%22%3A%7B%22json%3Anull%22%7D%7D`

returned the BeatBox SPA shell rather than a JSON tRPC response. The rendered page showed the application’s `404 Page Not Found` screen. This confirms that the deployed `/api/trpc/ai.health` path is being handled by the frontend fallback instead of reaching `api/trpc/[trpc].ts`. The user-visible `Unexpected end of JSON input` symptom is therefore consistent with the client attempting to parse a non-JSON production response.

The existing source confirms that the frontend sends tRPC requests to `${window.location.origin}/api/trpc`, the serverless handler exists at `api/trpc/[trpc].ts`, and `vercel.json` previously had only a catch-all `/(.*) -> /index.html` rewrite. The repair adds an explicit `/api/trpc/:path* -> /api/trpc/[trpc].ts` rewrite before the SPA fallback and adds a client transport guard that converts HTML, empty, and other non-JSON responses into a safe structured error message.

The live health endpoint must be rechecked after the owner’s next Vercel deployment. An authenticated chat request cannot be completed from the signed-out public endpoint because `ai.chat` is intentionally protected and requires a real Supabase session.

## Verification update

The managed local preview now returns a valid JSON tRPC response from `/api/trpc/ai.health`, reporting the ordered providers `gemini`, `groq`, `openrouter`, and `manus`, with all four configured in the managed environment. The public Vercel URL was checked before this source change and returned the SPA 404; it must be checked again after the owner deploys the updated source and Vercel configuration.

## Owner-controlled post-deployment verification

After deploying the current `main` branch to Vercel, verify the serverless tRPC route with the public hostname:

```bash
curl -i 'https://beat-box-org.vercel.app/api/trpc/ai.health?batch=1&input=%7B%220%22%3A%7B%22json%3Anull%7D%7D'
```

The response must be JSON with HTTP 200 and a tRPC batch payload containing the health procedure result. An HTML SPA document, Vercel 404, empty body, or JSON parse error indicates a stale deployment or inactive `/api/trpc/:path*` rewrite. Check Vercel runtime logs for `api/trpc/[trpc]` while making the request.

For authenticated chat smoke testing, sign in through configured Google OAuth or email/password, open `/ai`, and send `Give me three Liberian music marketplace discovery tips`. Confirm a normal assistant message renders, the browser request targets `/api/trpc/ai.chat`, and the response is JSON rather than the SPA shell. Repeat with one provider unavailable to confirm ordered fallback; provider keys must remain server-only. If it fails, capture HTTP status, response `content-type`, tRPC `data.code`, and the correlated Vercel runtime-log entry before changing routing or secrets.
