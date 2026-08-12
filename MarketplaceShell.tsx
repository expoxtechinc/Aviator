import { BrandLogo } from "@/components/BrandLogo";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Bell, Heart, Menu, ShoppingBag, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

export function MarketplaceShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();
  const { profile, user, signOut } = useSupabaseAuth();
  const isSeller = profile?.role === "seller" || profile?.role === "admin";
  const dashboardHref = profile?.role === "admin" ? "/admin" : isSeller ? "/seller" : "/account";
  const nav = [
    ["Discover", "/explore"],
    ["Catalog", "/catalog"],
    ["Community", "/community"],
    ["Producers", "/producers"],
    ["Studio", "/studio"],
    ["AI Assistant", "/ai"],
  ];

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header__inner container">
          <BrandLogo />
          <nav className="desktop-nav" aria-label="Primary navigation">
            {nav.map(([label, href]) => <Link key={href} href={href} className={location === href ? "is-active" : ""}>{label}</Link>)}
          </nav>
          <div className="site-header__actions">
            <Link href="/cart" className="icon-action" aria-label="Cart"><ShoppingBag size={19} /></Link>
            {user ? <>
              <Link href="/account" className="icon-action" aria-label="Notifications"><Bell size={19} /></Link>
              <Link href={dashboardHref} className="account-pill"><UserRound size={15} /> <span>{profile?.display_name || "Account"}</span></Link>
              <button type="button" className="text-button desktop-only" onClick={() => void signOut()}>Sign out</button>
            </> : <Link href="/auth" className="button button--small">Sign in</Link>}
            <button type="button" className="mobile-menu-toggle" aria-label="Toggle navigation" onClick={() => setMenuOpen(value => !value)}>{menuOpen ? <X /> : <Menu />}</button>
          </div>
        </div>
        {menuOpen && <nav className="mobile-nav container" aria-label="Mobile navigation">
          {nav.map(([label, href]) => <Link key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</Link>)}
          <Link href="/favorites" onClick={() => setMenuOpen(false)}><Heart size={16} /> Favorites</Link><Link href="/ai" onClick={() => setMenuOpen(false)}>AI Assistant</Link><Link href="/catalog" onClick={() => setMenuOpen(false)}>Creator catalog</Link><Link href="/help" onClick={() => setMenuOpen(false)}>How it works</Link>
          {user && <button type="button" onClick={() => void signOut()}>Sign out</button>}
        </nav>}
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <div className="container site-footer__grid">
          <div><BrandLogo compact /><p>Built for artists, producers, and music communities ready to move with more ownership.</p></div>
          <div><h2>Explore</h2><Link href="/explore">Browse beats</Link><Link href="/catalog">Creator catalog</Link><Link href="/community">Community</Link><Link href="/producers">Producers</Link><Link href="/studio">Creator studio</Link><Link href="/ai">AI assistant</Link><Link href="/seller">Sell on BeatBox</Link></div>
          <div><h2>Support</h2><Link href="/help">Help center</Link><Link href="/contact">Contact</Link><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link></div>
          <div className="site-footer__note"><h2>Secure by design</h2><p>Master files stay private. Downloads are issued only after verified entitlement and expire automatically.</p></div>
        </div>
        <div className="container site-footer__legal">© {new Date().getFullYear()} BeatBox. All rights reserved.</div>
      </footer>
    </div>
  );
}
