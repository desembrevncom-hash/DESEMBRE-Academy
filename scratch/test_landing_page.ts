import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL || "https://ynmcoeapfycijblydyuw.supabase.co";
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_QIWQKhXRvEOQ57t-gEep-g_qsiKFs09";
const sb = createClient(url, key);

async function test() {
  console.log("--- Testing Public Schedule Batches ---");
  const { data: scheduleData, error } = await sb.rpc("public_get_training_schedule");
  if (error) {
    console.error("RPC Error:", error);
    return;
  }

  const batches = (scheduleData || []) as any[];
  console.log("Total public eligible batches:", batches.length);
  batches.forEach((b: any, idx: number) => {
    console.log(`[${idx + 1}] Title: "${b.title}" | course.slug: "${b.course?.slug}" | sessions: ${b.sessions?.length || 0}`);
  });

  const bioTriggerBatches = batches.filter((b: any) =>
    b.course?.slug === "biological-trigger" || (b.title || "").toLowerCase().includes("biological trigger")
  );

  console.log("\nMatching batches for BIOLOGICAL TRIGGER campaign landing:", bioTriggerBatches.length);
  bioTriggerBatches.forEach((b: any) => {
    console.log(`- Batch ID: ${b.id} | Title: "${b.title}" | Start Date: ${b.start_date}`);
  });
}

test();
