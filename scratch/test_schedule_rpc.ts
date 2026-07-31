import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL || "https://ynmcoeapfycijblydyuw.supabase.co";
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_QIWQKhXRvEOQ57t-gEep-g_qsiKFs09";
const sb = createClient(url, key);

async function test() {
  const { data, error } = await sb.rpc("public_get_training_schedule");
  if (error) {
    console.error("RPC Error:", error);
    return;
  }

  const raw = (data || []) as any[];
  console.log("Raw RPC returned batches count:", raw.length);

  const clean = raw.filter((b) => {
    return Array.isArray(b.sessions) && b.sessions.some((s: any) => s.starts_at && s.ends_at);
  });

  console.log("Clean batches count after filtering:", clean.length);
  clean.forEach((b: any, idx: number) => {
    console.log(`[${idx + 1}] "${b.title}" - sessions: ${b.sessions.length}`);
  });
}

test();
