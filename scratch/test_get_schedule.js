import { createClient } from "@supabase/supabase-js";

const url = "https://ynmcoeapfycijblydyuw.supabase.co";
const key = "sb_publishable_QIWQKhXRvEOQ57t-gEep-g_qsiKFs09";
const supabase = createClient(url, key);

async function main() {
  const { data: batches, error: bErr } = await supabase
    .from("course_batches")
    .select("*, course:courses(*)");
  
  console.log("Direct course_batches query:", batches, bErr);

  const { data: rpcData, error: rpcErr } = await supabase.rpc("public_get_training_schedule");
  console.log("RPC public_get_training_schedule result count:", rpcData?.length, "Error:", rpcErr);
  console.log("RPC data:", JSON.stringify(rpcData, null, 2));
}

main().catch(console.error);
