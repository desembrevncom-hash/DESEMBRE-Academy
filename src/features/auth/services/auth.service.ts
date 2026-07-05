import { supabase } from '@/lib/supabase/client';
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

export const authService = {
  async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw normalizeError(error);
    return data.session;
  },

  async getUser(): Promise<User | null> {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw normalizeError(error);
    return data.user;
  },

  async signInWithPassword(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw normalizeError(error);
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw normalizeError(error);
  },

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    const { data } = supabase.auth.onAuthStateChange(callback);
    return data.subscription;
  }
};
