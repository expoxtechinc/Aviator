import { logSupabaseError, supabase } from "@/lib/supabase";
import type { Profile, UserRole } from "@/lib/models";
import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  becomeSeller: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

const profileName = (user: User) =>
  String(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "BeatBox listener").slice(0, 80);

const profileUsername = (user: User) =>
  profileName(user).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 26) || `user-${user.id.slice(0, 8)}`;

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureProfile = useCallback(async (authUser: User | null) => {
    if (!authUser) {
      setProfile(null);
      return;
    }

    let { data, error } = await supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle();
    if (!data && !error) {
      const { error: ensureError } = await supabase.rpc("ensure_self_profile");
      if (ensureError) {
        logSupabaseError("ensure-profile", ensureError);
        throw ensureError;
      }
      ({ data, error } = await supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle());
    }
    if (error) {
      logSupabaseError("load-profile", error);
      throw error;
    }
    setProfile((data as Profile | null) ?? null);
  }, []);

  const refreshProfile = useCallback(async () => ensureProfile(session?.user ?? null), [ensureProfile, session?.user]);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      try {
        await ensureProfile(data.session?.user ?? null);
      } finally {
        if (active) setLoading(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setTimeout(() => void ensureProfile(nextSession?.user ?? null), 0);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [ensureProfile]);

  const value = useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signUp: async (name, email, password) => {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
      },
      signInWithGoogle: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
      resetPassword: async email => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?mode=recovery` });
        if (error) throw error;
      },
      becomeSeller: async () => {
        if (!session?.user) throw new Error("Sign in to become a seller.");
        const { error } = await supabase.rpc("register_as_seller", {
          producer_name_input: profile?.display_name || profileName(session.user),
        });
        if (error) {
          logSupabaseError("register-seller", error);
          throw error;
        }
        await refreshProfile();
      },
      refreshProfile,
    }),
    [loading, profile, refreshProfile, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSupabaseAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useSupabaseAuth must be used inside SupabaseAuthProvider.");
  return context;
}
