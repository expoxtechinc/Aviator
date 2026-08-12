import type { SellerEarning } from "@/lib/models";
import { supabase } from "@/lib/supabase";
import { BarChart3, DollarSign, Loader2, Package } from "lucide-react";
import { useEffect, useState } from "react";

const money = (amount: number | null | undefined, currency = "USD") => new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount || 0);

type DownloadSummary = { download_count: number; beat_count: number };

export default function EarningsPanel({ sellerId }: { sellerId: string }) {
  const [rows, setRows] = useState<SellerEarning[]>([]);
  const [downloads, setDownloads] = useState<DownloadSummary>({ download_count: 0, beat_count: 0 });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    void Promise.all([
      supabase.from("seller_earnings").select("order_id,seller_id,beat_id,amount,platform_fee_amount,seller_amount,currency,status,verified_at,created_at").eq("seller_id", sellerId).order("created_at", { ascending: false }),
      supabase.rpc("get_seller_download_summary", { seller_id_input: sellerId }),
    ]).then(([earningsResult, downloadsResult]) => {
      if (!mounted) return;
      setRows((earningsResult.data || []) as SellerEarning[]);
      const summary = Array.isArray(downloadsResult.data) ? downloadsResult.data[0] : downloadsResult.data;
      setDownloads((summary || { download_count: 0, beat_count: 0 }) as DownloadSummary);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [sellerId]);
  const total = rows.reduce((sum, row) => sum + Number(row.seller_amount || 0), 0);
  return <div className="dashboard-grid"><div className="dashboard-panel"><h2><DollarSign size={18} /> Verified earnings</h2><div className="stat-card"><span>Verified seller amount</span><strong>{money(total, rows[0]?.currency || "USD")}</strong></div><p className="muted">Only verified or delivered orders are included. Pending payment requests do not count as earnings.</p><div className="stats-grid"><div className="stat-card"><BarChart3 size={18} /><span>Real downloads</span><strong>{downloads.download_count}</strong></div><div className="stat-card"><Package size={18} /><span>Beats downloaded</span><strong>{downloads.beat_count}</strong></div></div></div><div className="dashboard-panel"><h2>Verified transactions</h2>{loading ? <Loader2 className="spin" /> : rows.length ? rows.map(row => <div className="order-row" key={row.order_id}><div><b>{row.status.replace(/_/g, " ")}</b><span>{new Date(row.created_at).toLocaleDateString()} · fee {money(row.platform_fee_amount, row.currency)}</span></div><strong>{money(row.seller_amount, row.currency)}</strong></div>) : <p className="muted">No verified transactions yet.</p>}</div></div>;
}
