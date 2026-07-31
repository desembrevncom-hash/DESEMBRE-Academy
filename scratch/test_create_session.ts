import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL || "https://ynmcoeapfycijblydyuw.supabase.co";
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_QIWQKhXRvEOQ57t-gEep-g_qsiKFs09";
const sb = createClient(url, key);

async function test() {
  const batchId = "d995dd56-706e-4503-94be-f933b7aaab95"; // 3-PHASE BIOLOGICAL PEEL DEMO
  
  console.log("Calling admin_create_course_session for batch:", batchId);

  const startsAt = new Date("2026-08-18T14:00:00+07:00").toISOString();
  const endsAt = new Date("2026-08-18T16:00:00+07:00").toISOString();

  const { data, error } = await sb.rpc("admin_create_course_session", {
    p_batch_id: batchId,
    p_title: "Buổi 1: Practical Demo 3-Phase Peel",
    p_description: "Thực hành trực tiếp kỹ thuật 3-Phase Peel",
    p_starts_at: startsAt,
    p_ends_at: endsAt,
    p_location_type: "office",
    p_location_detail: "Phòng Đào Tạo DESEMBRE Center",
    p_order_index: 1,
  });

  if (error) {
    console.error("admin_create_course_session RPC Error:", error);
    return;
  }

  console.log("Session created successfully with ID:", data);

  // Check admin batches list
  const { data: batches } = await sb.rpc("admin_get_course_batches");
  const batch = (batches || []).find((b: any) => b.id === batchId);
  console.log("Updated batch session count in admin:", batch?.title, "| sessions:", batch?.sessions_count);
}

test();
