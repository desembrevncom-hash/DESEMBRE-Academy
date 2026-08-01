import { createClient } from "@supabase/supabase-js";
import { submitPublicCourseRegistration } from "../src/features/public-training/services/publicTrainingApi";

const url = process.env.VITE_SUPABASE_URL || "https://ynmcoeapfycijblydyuw.supabase.co";
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_QIWQKhXRvEOQ57t-gEep-g_qsiKFs09";
const sb = createClient(url, key);

async function test() {
  console.log("=== Testing Landing Page Template & Registration for TARGETED MODULATION ===");

  // 1. Fetch Schedule to find batch for targeted-modulation
  const { data: batches } = await sb.rpc("public_get_training_schedule");
  const targetBatch = (batches || []).find((b: any) =>
    (b.course?.slug || "").includes("targeted-modulation") ||
    (b.title || "").toLowerCase().includes("targeted modulation")
  ) || (batches || [])[0];

  if (!targetBatch) {
    console.error("No batch found");
    return;
  }

  console.log("\nFound Batch:", targetBatch.title, "ID:", targetBatch.id);

  // 2. Submit test registration from /l/targeted-modulation with UTM
  const testPhone = "09" + Math.floor(10000000 + Math.random() * 90000000);
  console.log("\nSubmitting registration for /l/targeted-modulation (Phone:", testPhone, ")...");

  const res = await submitPublicCourseRegistration({
    batchId: targetBatch.id,
    fullName: "Vũ Hoàng Targeted Mod Lead",
    phone: testPhone,
    email: "targeted.mod@example.com",
    notes: "Tôi muốn tham gia chuyên đề Targeted Modulation",
    source: "landing_page",
    campaign_slug: "targeted-modulation",
    utm_source: "facebook",
    utm_medium: "cpc_ads",
    utm_campaign: "targeted_modulation_august",
  });

  console.log("\nRegistration Result:", res);
}

test();
