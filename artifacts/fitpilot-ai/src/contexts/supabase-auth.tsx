import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSession, signIn, signUp, signOut, subscribeToAuth } from "@/services/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/client";

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  configured: boolean;
  signIn: typeof signIn;
  signUp: typeof signUp;
  signOut: typeof signOut;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    getSession()
      .then(setSession)
      .finally(() => setLoading(false));
    const subscription = subscribeToAuth((_event, nextSession) => setSession(nextSession));
    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo(() => ({
    session,
    loading,
    configured: isSupabaseConfigured,
    signIn,
    signUp,
    signOut,
  }), [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSupabaseAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useSupabaseAuth must be used inside SupabaseAuthProvider");
  return context;
}