import { createClient } from "@supabase/supabase-js";

const url = "https://ynmcoeapfycijblydyuw.supabase.co";
const key = "sb_publishable_QIWQKhXRvEOQ57t-gEep-g_qsiKFs09";
const supabase = createClient(url, key);

async function main() {
  // Query check constraints via RPC or postgrest if allowed
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .limit(5);

  console.log("Courses:", data, error);
}

main().catch(console.error);
