import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { money } from "@/lib/marketplace";
import type { Beat } from "@/lib/models";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

type PaymentInstruction = { id: string; method_type: string; method_name: string; account_number: string; instructions: string | null };

export function PaymentRequestPanel({ beat }: { beat: Beat }) {
  const { user } = useSupabaseAuth();
  const [method, setMethod] = useState("Mobile Money");
  const [reference, setReference] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<PaymentInstruction[]>([]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setBusy(true); setMessage(null);
    try {
      let proofPath: string | null = null;
      if (proof) {
        const safe = proof.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        proofPath = `${user.id}/${crypto.randomUUID()}-${safe}`;
        const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(proofPath, proof, { upsert: false, contentType: proof.type });
        if (uploadError) throw uploadError;
      }
      const { error } = await supabase.rpc("create_payment_request", {
        p_beat_id: beat.id,
        p_method: method,
        p_reference: reference || null,
        p_proof_path: proofPath,
      });
      if (error) throw error;
      const { data: methods, error: methodsError } = await supabase
        .from("seller_payment_methods")
        .select("id,method_type,method_name,account_number,instructions")
        .eq("seller_id", beat.seller_id)
        .eq("method_type", method)
        .eq("is_active", true);
      if (methodsError) throw methodsError;
      setInstructions((methods ?? []) as PaymentInstruction[]);
      setMessage("Payment request submitted. No payment has been verified; use the seller instructions below, then await their review.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to submit the payment request."); }
    finally { setBusy(false); }
  };

  if (!user) return <div className="payment-request"><h3>Request this license</h3><p>Sign in to submit a Mobile Money, Orange Money, or WhatsApp payment request.</p><Link className="button button--small" href="/auth">Sign in to continue</Link></div>;
  return <form className="payment-request" onSubmit={submit}><div className="payment-request__title"><div><p className="eyebrow"><span /> Payment request</p><h3>Request “{beat.title}”</h3></div><strong>{money(beat.price)}</strong></div><p>BeatBox does not process or verify this payment automatically. Submit your real payment details, then the seller reviews them before a private download can be released.</p><div className="field-grid"><label>Payment method<select value={method} onChange={event => { setMethod(event.target.value); setInstructions([]); }}><option>Mobile Money</option><option>Orange Money</option><option>WhatsApp</option></select></label><label>Reference or contact<input value={reference} onChange={event => setReference(event.target.value)} placeholder="Transaction reference or WhatsApp number" required /></label></div><label className="upload-proof"><Upload size={16} /><span>{proof ? proof.name : "Attach payment proof (optional)"}</span><input type="file" accept="image/jpeg,image/png,application/pdf" onChange={event => setProof(event.target.files?.[0] ?? null)} /></label><button className="button" type="submit" disabled={busy}>{busy ? <Loader2 className="spin" size={16} /> : null} Submit payment request</button>{message && <p className={message.startsWith("Payment request submitted") ? "form-success" : "form-error"}>{message.startsWith("Payment request submitted") && <CheckCircle2 size={16} />}{message}</p>}{message?.startsWith("Payment request submitted") && <div className="payment-instructions"><b>Seller instructions</b>{instructions.length ? instructions.map(item => <div key={item.id}><span>{item.method_type} · {item.method_name}</span><strong>{item.account_number}</strong>{item.instructions && <small>{item.instructions}</small>}</div>) : <p>The seller has not configured instructions for this method. Your request is still pending and the seller can contact you using the details you supplied.</p>}</div>}</form>;
}
