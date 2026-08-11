import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error("BeatBox requires VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.");
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export const BEATBOX_LOGO_URL = "https://cdn.phototourl.com/free/2026-08-11-b48b27bd-a5a9-4363-9b97-eacdce958524.png";

/** Logs only structured Supabase error metadata during local development. */
export function logSupabaseError(operation: string, error: unknown) {
  if (!import.meta.env.DEV || !error || typeof error !== "object") return;
  const candidate = error as { code?: string; message?: string; details?: string; hint?: string };
  console.error(`[BeatBox:${operation}]`, {
    code: candidate.code,
    message: candidate.message,
    details: candidate.details,
    hint: candidate.hint,
  });
}
