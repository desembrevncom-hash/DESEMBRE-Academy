export function getSupabaseEnvironment() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url) {
    throw new Error("Missing VITE_SUPABASE_URL in environment variables.");
  }

  if (!key) {
    throw new Error("Missing VITE_SUPABASE_PUBLISHABLE_KEY in environment variables.");
  }

  if (!url.includes('ynmcoeapfycijblydyuw')) {
    throw new Error("VITE_SUPABASE_URL must resolve to the correct staging project.");
  }

  if (url.includes('wmhfvggbthyikqvlyqup') || url.includes('xhfqjupiidexvlltstal')) {
    throw new Error("VITE_SUPABASE_URL contains forbidden project references.");
  }

  return { url, publishableKey: key };
}
