import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

export type AuthErrorInfo = {
  code?: string;
  message: string;
  status?: number;
};

function normalizeError(error: any): AuthErrorInfo {
  return {
    code: error?.code,
    message: error?.message || 'Unknown authentication error',
    status: error?.status
  };
}

function getClientOrThrow() {
  const client = getSupabaseBrowserClient();
  if (!client) {
    throw new Error('Supabase client is not available in this environment.');
  }
  return client;
}

export const authService = {
  async getSession(): Promise<Session | null> {
    const client = getClientOrThrow();
    const { data, error } = await client.auth.getSession();
    if (error) throw normalizeError(error);
    return data.session;
  },

  async getUser(): Promise<User | null> {
    const client = getClientOrThrow();
    const { data, error } = await client.auth.getUser();
    if (error) throw normalizeError(error);
    return data.user;
  },

  async signInWithPassword(email: string, password: string) {
    const client = getClientOrThrow();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw normalizeError(error);
    return data;
  },

  async signOut() {
    const client = getClientOrThrow();
    const { error } = await client.auth.signOut();
    if (error) throw normalizeError(error);
  },

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    const client = getClientOrThrow();
    const { data } = client.auth.onAuthStateChange(callback);
    return data.subscription;
  }
};
