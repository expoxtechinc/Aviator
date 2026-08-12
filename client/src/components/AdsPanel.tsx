import { supabase } from "@/lib/supabase";
import { BarChart3, ImagePlus, Loader2, Megaphone, Plus, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Campaign = { id: string; name: string; objective: string; budget: number; currency: string; start_at: string; end_at: string; status: string };
type Creative = { id: string; campaign_id: string; headline: string; body: string | null; image_path: string | null; target_url: string | null };

type EventCounts = Record<string, { impression: number; click: number }>;

export default function AdsPanel({ advertiserId }: { advertiserId: string }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [events, setEvents] = useState<EventCounts>({});
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [campaignForm, setCampaignForm] = useState({ name: "", objective: "profile", budget: "", currency: "USD", start_at: "", end_at: "" });
  const [creativeForm, setCreativeForm] = useState({ headline: "", body: "", target_url: "" });
  const [image, setImage] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const { data: campaignRows } = await supabase.from("ad_campaigns").select("id,name,objective,budget,currency,start_at,end_at,status").eq("advertiser_id", advertiserId).order("created_at", { ascending: false });
    const nextCampaigns = (campaignRows || []) as Campaign[];
    setCampaigns(nextCampaigns);
    const campaignIds = nextCampaigns.map(campaign => campaign.id);
    if (!selectedCampaign && campaignIds[0]) setSelectedCampaign(campaignIds[0]);
    if (!campaignIds.length) { setCreatives([]); setEvents({}); return; }
    const { data: creativeRows } = await supabase.from("ad_creatives").select("id,campaign_id,headline,body,image_path,target_url").in("campaign_id", campaignIds).order("created_at", { ascending: false });
    const nextCreatives = (creativeRows || []) as Creative[];
    setCreatives(nextCreatives);
    const { data: eventRows } = await supabase.from("ad_events").select("creative_id,event_type").in("creative_id", nextCreatives.map(creative => creative.id));
    const counts: EventCounts = {};
    (eventRows || []).forEach(row => { const current = counts[row.creative_id] || { impression: 0, click: 0 }; if (row.event_type === "impression") current.impression += 1; if (row.event_type === "click") current.click += 1; counts[row.creative_id] = current; });
    setEvents(counts);
  };

  useEffect(() => { void load(); }, [advertiserId]);

  const submitCampaign = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage(null);
    const start = new Date(campaignForm.start_at); const end = new Date(campaignForm.end_at);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) { setMessage("Choose a valid campaign period."); setBusy(false); return; }
    const { error } = await supabase.from("ad_campaigns").insert({ advertiser_id: advertiserId, ...campaignForm, budget: Number(campaignForm.budget) || 0, start_at: start.toISOString(), end_at: end.toISOString(), status: "pending_review" });
    setMessage(error ? error.message : "Campaign submitted for owner moderation.");
    if (!error) { setCampaignForm({ name: "", objective: "profile", budget: "", currency: "USD", start_at: "", end_at: "" }); await load(); }
    setBusy(false);
  };

  const submitCreative = async (event: React.FormEvent) => {
    event.preventDefault(); if (!selectedCampaign) { setMessage("Create or select a campaign first."); return; }
    setBusy(true); setMessage(null);
    try {
      let imagePath: string | null = null;
      if (image) { imagePath = `${advertiserId}/${crypto.randomUUID()}-${image.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`; const { error } = await supabase.storage.from("ad-creatives").upload(imagePath, image, { upsert: false, contentType: image.type }); if (error) throw error; }
      const { error } = await supabase.from("ad_creatives").insert({ campaign_id: selectedCampaign, headline: creativeForm.headline.trim(), body: creativeForm.body.trim() || null, image_path: imagePath, target_url: creativeForm.target_url.trim() || null });
      if (error) throw error;
      setMessage("Creative saved. It will follow the campaign’s moderation status before delivery."); setCreativeForm({ headline: "", body: "", target_url: "" }); setImage(null); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save creative."); } finally { setBusy(false); }
  };

  const visibleCreatives = useMemo(() => creatives.filter(creative => creative.campaign_id === selectedCampaign), [creatives, selectedCampaign]);
  return <div className="dashboard-grid">
    <form className="dashboard-panel profile-form" onSubmit={submitCampaign}><h2><Megaphone size={18} /> Advertise on BeatBox</h2><p>Campaigns require owner moderation before delivery. Budgets are recorded as limits; this form never marks payment successful.</p><div className="field-grid"><label>Campaign name<input required value={campaignForm.name} onChange={e => setCampaignForm({ ...campaignForm, name: e.target.value })} /></label><label>Objective<select value={campaignForm.objective} onChange={e => setCampaignForm({ ...campaignForm, objective: e.target.value })}><option value="profile">Promote profile</option><option value="content">Promote content</option><option value="product">Promote product</option></select></label><label>Budget<input required type="number" min="0" step="0.01" value={campaignForm.budget} onChange={e => setCampaignForm({ ...campaignForm, budget: e.target.value })} /></label><label>Currency<input value={campaignForm.currency} maxLength={3} onChange={e => setCampaignForm({ ...campaignForm, currency: e.target.value.toUpperCase() })} /></label><label>Start<input required type="datetime-local" value={campaignForm.start_at} onChange={e => setCampaignForm({ ...campaignForm, start_at: e.target.value })} /></label><label>End<input required type="datetime-local" value={campaignForm.end_at} onChange={e => setCampaignForm({ ...campaignForm, end_at: e.target.value })} /></label></div><button className="button" disabled={busy}>{busy ? <Loader2 className="spin" size={16} /> : <Plus size={16} />} Submit campaign</button></form>
    <div className="dashboard-panel"><h2>Campaigns & creatives</h2>{campaigns.length ? <><label>Selected campaign<select value={selectedCampaign} onChange={e => setSelectedCampaign(e.target.value)}>{campaigns.map(campaign => <option value={campaign.id} key={campaign.id}>{campaign.name} · {campaign.status}</option>)}</select></label><form className="profile-form" onSubmit={submitCreative}><h3><ImagePlus size={16} /> Add creative</h3><label>Headline<input required maxLength={120} value={creativeForm.headline} onChange={e => setCreativeForm({ ...creativeForm, headline: e.target.value })} /></label><label>Body<textarea rows={2} value={creativeForm.body} onChange={e => setCreativeForm({ ...creativeForm, body: e.target.value })} /></label><label>Target URL<input type="url" value={creativeForm.target_url} onChange={e => setCreativeForm({ ...creativeForm, target_url: e.target.value })} /></label><label className="file-input"><Upload size={16} /><b>{image ? image.name : "Creative image (optional)"}</b><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setImage(e.target.files?.[0] || null)} /></label><button className="button button--small" disabled={busy}><Plus size={14} /> Save creative</button></form>{visibleCreatives.length ? visibleCreatives.map(creative => { const count = events[creative.id] || { impression: 0, click: 0 }; return <div className="listing-row" key={creative.id}><div><b>{creative.headline}</b><p>{creative.body || "No body copy"}</p><span><BarChart3 size={13} /> {count.impression} impressions · {count.click} clicks</span></div></div>; }) : <p className="muted">No creative has been added to this campaign yet.</p>}</> : <p className="muted">Create a campaign to add a moderated creative and view its recorded events.</p>}{message && <p className={message.includes("error") || message.includes("Unable") ? "form-error" : "form-success"}>{message}</p>}</div>
  </div>;
}
