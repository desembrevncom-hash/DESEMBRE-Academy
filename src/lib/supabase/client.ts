import { createClient } from '@supabase/supabase-js';
import { env } from './env';

if (typeof window === "undefined") {
    throw new Error("Supabase client should only be instantiated in the browser.");
}

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);
