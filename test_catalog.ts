import { createClient } from "@supabase/supabase-js";
const url = process.env.VITE_SUPABASE_URL || "https://ynmcoeapfycijblydyuw.supabase.co";
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_QIWQKhXRvEOQ57t-gEep-g_qsiKFs09";
const sb = createClient(url, key);

async function run() {
  const { data, error } = await sb.rpc("get_academy_public_course_catalog");
  console.log("catalog result:", error ? error.message : "OK", error || (Array.isArray(data) ? data.length + " courses" : "not array"));
}
run();
