import { createClient } from "@supabase/supabase-js";
import { submitPublicCourseRegistration } from "../src/features/public-training/services/publicTrainingApi";

const url = process.env.VITE_SUPABASE_URL || "https://ynmcoeapfycijblydyuw.supabase.co";
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_QIWQKhXRvEOQ57t-gEep-g_qsiKFs09";
const sb = createClient(url, key);

async function test() {
  const { data: batches } = await sb.rpc("public_get_training_schedule");
  const batch = (batches || [])[0];

  const testPhone = "09" + Math.floor(10000000 + Math.random() * 90000000);
  console.log("Submitting registration (phone:", testPhone, ")...");

  const res = await submitPublicCourseRegistration({
    batchId: batch.id,
    fullName: "Nguyễn Thị Landing Ads",
    phone: testPhone,
    email: "landing.ads@example.com",
    notes: "Tư vấn thêm về protocol",
    source: "landing_page",
    campaign_slug: "biological-trigger",
    utm_source: "facebook",
    utm_medium: "cpc_ads",
    utm_campaign: "biological_trigger_august",
  });

  console.log("Submit result:", res);

  if (res.registration_id) {
    const { data: regRow } = await sb
      .from("course_registrations")
      .select("id, full_name, phone, source, notes, status, created_at")
      .eq("id", res.registration_id)
      .maybeSingle();

    console.log("\n--- Registered Row in DB ---");
    console.log(regRow);

    const { data: outbox } = await sb
      .from("notification_outbox")
      .select("id, template_code, status, payload")
      .eq("registration_id", res.registration_id)
      .maybeSingle();

    console.log("\n--- Queued ZNS Outbox Job ---");
    console.log(outbox);
  }
}

test();
