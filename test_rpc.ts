import { createClient } from "@supabase/supabase-js";
const url = process.env.VITE_SUPABASE_URL || "https://ynmcoeapfycijblydyuw.supabase.co";
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_QIWQKhXRvEOQ57t-gEep-g_qsiKFs09";
const sb = createClient(url, key);

async function run() {
  const { data, error } = await sb.rpc("get_academy_public_course_outline", {
    p_course_slug: "course-a-v4",
  });
  console.log("p_course_slug result:", error ? "ERROR" : "OK", error || !!data);
  
  const { data: d2, error: e2 } = await sb.rpc("get_academy_public_course_outline", {
    p_slug: "course-a-v4",
  });
  console.log("p_slug result:", e2 ? "ERROR" : "OK", e2 || !!d2);
}
run();
