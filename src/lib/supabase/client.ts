import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnvironment } from "./env";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (!browserClient) {
    const environment = getSupabaseEnvironment();

    browserClient = createClient(environment.url, environment.publishableKey);
  }

  return browserClient;
}
