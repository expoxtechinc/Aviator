import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type DownloadRequest = { beat_id?: string };

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRole) {
    return new Response(JSON.stringify({ error: "Download service is not configured" }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const bearer = request.headers.get("Authorization") || "";
  const token = bearer.startsWith("Bearer ") ? bearer.slice(7) : "";
  if (!token) {
    return new Response(JSON.stringify({ error: "Authentication is required" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const admin = createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: auth, error: authError } = await admin.auth.getUser(token);
  if (authError || !auth.user) {
    return new Response(JSON.stringify({ error: "Your session could not be verified" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  let payload: DownloadRequest;
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "A beat identifier is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (!payload.beat_id) {
    return new Response(JSON.stringify({ error: "A beat identifier is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const { data: beat, error: beatError } = await admin
    .from("beats")
    .select("id,title,is_free,master_url")
    .eq("id", payload.beat_id)
    .eq("status", "published")
    .maybeSingle();
  if (beatError || !beat?.master_url || /^https?:\/\//i.test(beat.master_url)) {
    return new Response(JSON.stringify({ error: "This beat is not available for secure delivery" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  let verifiedOrderId: string | null = null;
  if (!beat.is_free) {
    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id")
      .eq("beat_id", beat.id)
      .eq("buyer_id", auth.user.id)
      .in("status", ["payment_verified", "delivered"])
      .order("verified_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "No verified payment entitlement exists for this beat" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    verifiedOrderId = order.id;
  }

  const filename = `${beat.title.replace(/[^a-z0-9_-]+/gi, "-").replace(/(^-|-$)/g, "") || "beat"}-BeatBox-master`;
  const { data: signed, error: signedError } = await admin.storage.from("beat-masters").createSignedUrl(beat.master_url, 300, { download: filename });
  if (signedError || !signed?.signedUrl) {
    return new Response(JSON.stringify({ error: "The secure download link could not be created" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  await admin.from("downloads").insert({ user_id: auth.user.id, beat_id: beat.id, order_id: verifiedOrderId });
  return new Response(JSON.stringify({ url: signed.signedUrl, expires_in: 300 }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
