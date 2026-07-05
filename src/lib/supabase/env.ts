export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
};

if (!env.supabaseUrl) {
  throw new Error("Missing VITE_SUPABASE_URL in environment variables.");
}

if (!env.supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_PUBLISHABLE_KEY in environment variables.");
}

if (!env.supabaseUrl.includes('ynmcoeapfycijblydyuw')) {
  throw new Error("VITE_SUPABASE_URL must resolve to the correct staging project.");
}

if (env.supabaseUrl.includes('wmhfvggbthyikqvlyqup') || env.supabaseUrl.includes('xhfqjupiidexvlltstal')) {
  throw new Error("VITE_SUPABASE_URL contains forbidden project references.");
}
