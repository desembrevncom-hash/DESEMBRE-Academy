import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL || "https://ynmcoeapfycijblydyuw.supabase.co";
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_QIWQKhXRvEOQ57t-gEep-g_qsiKFs09";
const sb = createClient(url, key);

async function test() {
  const slugs = ["biological-trigger", "targeted-modulation"];

  for (const slug of slugs) {
    console.log(`\n--- Testing RPC public_get_course_detail for slug: "${slug}" ---`);
    const { data: rpcData, error: rpcError } = await sb.rpc("public_get_course_detail", {
      p_slug: slug,
    });
    console.log("RPC result:", rpcError ? `ERROR: ${rpcError.message}` : "OK");
    if (rpcData) {
      console.log("Course title:", rpcData.title, "| batches:", rpcData.batches?.length || 0);
    }

    console.log(`--- Testing Direct Fallback Table Query for slug: "${slug}" ---`);
    const { data: courseRow, error: courseErr } = await sb
      .from("courses")
      .select("*, batches:course_batches(*, sessions:course_sessions(*))")
      .eq("slug", slug)
      .maybeSingle();

    console.log("Direct table query result:", courseErr ? `ERROR: ${courseErr.message}` : "OK");
    if (courseRow) {
      console.log("Course row title:", courseRow.title, "| batches:", courseRow.batches?.length || 0);
    }
  }
}

test();
