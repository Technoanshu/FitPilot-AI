import type { AuthChangeEvent, Session, Subscription } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

export interface AuthCredentials {
  email: string;
  password: string;
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signIn(credentials: AuthCredentials) {
  const { data, error } = await supabase.auth.signInWithPassword(credentials);
  if (error) throw error;
  return data;
}

export async function signUp(credentials: AuthCredentials, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    ...credentials,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string, redirectTo = window.location.origin) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

export function subscribeToAuth(
  callback: (event: AuthChangeEvent, session: Session | null) => void
): Subscription {
  return supabase.auth.onAuthStateChange(callback).data.subscription;
}