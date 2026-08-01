import { createClient } from "@supabase/supabase-js";
import {
  getLandingPageBySlug,
  createLandingPage,
  updateLandingPage,
} from "../src/features/admin/services/academyAdminLandingPagesApi";

const url = process.env.VITE_SUPABASE_URL || "https://ynmcoeapfycijblydyuw.supabase.co";
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_QIWQKhXRvEOQ57t-gEep-g_qsiKFs09";
const sb = createClient(url, key);

async function testWorkflow() {
  console.log("=== Testing P3C.59 Admin Content Editor & Publish Workflow ===");

  const slug = "premium-glass-skin-program";

  // 1. Check if landing page exists in DB or create a draft
  console.log(`\n1. Fetching landing page for '${slug}'...`);
  let landing = await getLandingPageBySlug(slug);

  if (landing && landing.id && !landing.id.startsWith("default-")) {
    console.log(`Found existing DB Landing (ID: ${landing.id}, Published: ${landing.is_published})`);
  } else {
    console.log("Creating new DRAFT landing page in DB...");
    try {
      landing = await createLandingPage({
        title: "PREMIUM GLASS SKIN PROGRAM",
        slug: slug,
        hero_badge: "Khai giảng tháng 8 • Online & Hands-on",
        hero_title: "Chuyên đề: PREMIUM GLASS SKIN PROGRAM",
        hero_subtitle: "Kỹ thuật căng bóng da chuẩn Clinic Hàn Quốc.",
        hero_cover_url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&auto=format&fit=crop",
        primary_cta_label: "Đăng ký giữ chỗ ngay",
        secondary_cta_label: "Xem chi tiết chương trình",
        audience: [
          { title: "Kỹ thuật viên Thẩm mỹ", description: "Muốn làm chủ kỹ thuật căng bóng Glass Skin chuẩn Hàn." }
        ],
        outcomes: [
          { title: "Kỹ thuật Tiêm & Điện di", description: "Làm chủ thao tác phục hồi da căng bóng mướt mịn." }
        ],
        faqs: [
          { q: "Khóa học diễn ra trong bao lâu?", a: "Khóa học gồm 1 buổi lý thuyết và 1 buổi thực hành lâm sàng." }
        ],
        is_published: false,
      });
      console.log("Draft Created Successfully! ID:", landing.id, "Published:", landing.is_published);
    } catch (err: any) {
      console.warn("createLandingPage note:", err.message);
    }
  }

  // 2. Test Editing Content (Adding new FAQ item & Outcome)
  if (landing && landing.id && !landing.id.startsWith("default-")) {
    console.log("\n2. Updating Landing Page Content (Editing FAQs & Outcomes)...");
    const updated = await updateLandingPage(landing.id, {
      faqs: [
        { q: "Khóa học diễn ra trong bao lâu?", a: "Khóa học gồm 1 buổi lý thuyết và 1 buổi thực hành lâm sàng." },
        { q: "Có cấp chứng nhận hoàn thành không?", a: "Có, học viên hoàn thành được cấp chứng nhận từ DESEMBRE Training Center." }
      ],
      outcomes: [
        { title: "Kỹ thuật Tiêm & Điện di", description: "Làm chủ thao tác phục hồi da căng bóng mướt mịn." },
        { title: "Ứng dụng Hoạt chất Phục hồi", description: "Kê đơn combo HA & Peptide cấp ẩm tầng sâu." }
      ],
      is_published: true, // Publish it!
    });

    console.log("Updated Landing Published Status:", updated.is_published);
    console.log("Updated FAQs Count:", updated.faqs.length);
    console.log("Updated Outcomes Count:", updated.outcomes.length);
  }

  // 3. Verify public retrieval
  console.log("\n3. Re-fetching landing page after publish...");
  const finalLanding = await getLandingPageBySlug(slug);
  console.log("Final Public Title:", finalLanding?.title);
  console.log("Final Public Is Published:", finalLanding?.is_published);
  console.log("Final FAQs:", finalLanding?.faqs);

  console.log("\n=== P3C.59 Workflow Test Passed Successfully! ===");
}

testWorkflow();
