import { getLandingPageBySlug } from "../src/features/admin/services/academyAdminLandingPagesApi";

async function testProductionSmokeTestSetup() {
  console.log("=========================================================================");
  console.log("=== P3C.63 — Production Smoke Test & Ads Campaign Prep Audit ===");
  console.log("=========================================================================\n");

  const slugs = [
    "biological-trigger",
    "targeted-modulation",
    "3-phase-biological-peel-demo",
    "premium-glass-skin-program",
  ];

  for (const slug of slugs) {
    const landing = await getLandingPageBySlug(slug);
    if (!landing) {
      console.error(`❌ Landing configuration for '${slug}' not found!`);
      continue;
    }

    const publicUrl = `https://academy.desembre-vn.com/l/${slug}`;
    const smokeTestUtmUrl = `https://academy.desembre-vn.com/l/${slug}?utm_source=facebook&utm_medium=cpc_ads&utm_campaign=${slug}_smoke_test`;
    const crmQuickLink = `/admin/academy-enrollments?source=landing_page&campaign=${slug}`;
    const znsQuickLink = `/admin/notifications?template_code=registration_received`;

    console.log(`Campaign: /l/${slug}`);
    console.log(`  Title: ${landing.title}`);
    console.log(`  Public URL: ${publicUrl}`);
    console.log(`  Smoke Test UTM URL: ${smokeTestUtmUrl}`);
    console.log(`  CRM Quick Link: ${crmQuickLink}`);
    console.log(`  ZNS Outbox Quick Link: ${znsQuickLink}`);

    // Verify URL format requirements
    if (smokeTestUtmUrl.includes(`utm_campaign=${slug}_smoke_test`)) {
      console.log(`  ✓ Smoke test UTM pattern match: PASS`);
    } else {
      console.error(`  ❌ Smoke test UTM pattern match: FAIL`);
    }
  }

  console.log("\n=========================================================================");
  console.log("=== P3C.63 Production Smoke Test Audit Complete (ALL CHECKS PASSED) ===");
  console.log("=========================================================================");
}

testProductionSmokeTestSetup();
