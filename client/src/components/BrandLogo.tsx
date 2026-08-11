import { BEATBOX_LOGO_URL } from "@/lib/supabase";
import { Link } from "wouter";

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand-logo" aria-label="BeatBox home">
      <img src={BEATBOX_LOGO_URL} alt="BeatBox" className="brand-logo__mark" />
      {!compact && <span className="brand-logo__word">BeatBox</span>}
    </Link>
  );
}
