import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL || "https://ynmcoeapfycijblydyuw.supabase.co";
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_QIWQKhXRvEOQ57t-gEep-g_qsiKFs09";
const sb = createClient(url, key);

async function check() {
  const { data: cols } = await sb
    .from("course_registrations")
    .select("*")
    .limit(1);

  console.log("course_registrations table columns sample:", cols ? Object.keys(cols[0] || {}) : "empty");
}

check();
