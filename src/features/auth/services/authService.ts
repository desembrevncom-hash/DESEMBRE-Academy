import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { normalizePhone } from '@/lib/phoneNormalization';

export const authService = {
  requestOtp: async (phone: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) throw new Error("Supabase client not initialized");

    const normalized = normalizePhone(phone);
    if (!normalized) throw new Error("Invalid Vietnamese phone number format.");

    const { error } = await supabase.auth.signInWithOtp({
      phone: normalized,
    });

    if (error) throw error;
    return { ok: true, phone: normalized };
  },

  verifyOtp: async (phone: string, token: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) throw new Error("Supabase client not initialized");

    const normalized = normalizePhone(phone);
    if (!normalized) throw new Error("Invalid Vietnamese phone number format.");

    const { data, error } = await supabase.auth.verifyOtp({
      phone: normalized,
      token,
      type: 'sms',
    });

    if (error) throw error;
    return { ok: true, session: data.session };
  },

  linkStudentAccount: async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) throw new Error("Supabase client not initialized");

    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) throw new Error("Not authenticated");

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/link-student-account`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to link student account");
    }

    const data = await response.json();
    return data as { status: 'linked' | 'pending_review' | 'blocked' };
  }
};
