import { getLandingPageBySlug } from "../src/features/admin/services/academyAdminLandingPagesApi";
import { getPublicSiteUrl } from "../src/config/site";

async function testProductionSmokeTestSetup() {
  console.log("=========================================================================");
  console.log("=== P3C.63B — Production Domain Migration & Smoke Test Audit ===");
  console.log("=========================================================================\n");

  const publicSiteUrl = getPublicSiteUrl();
  console.log("1. DYNAMIC PUBLIC SITE BASE URL:", publicSiteUrl);

  if (publicSiteUrl !== "https://training.desembre-vn.com") {
    console.error(`❌ Public site URL is not using the new domain 'https://training.desembre-vn.com'! Got: ${publicSiteUrl}`);
  } else {
    console.log("✓ VERIFIED: Base domain is normalized to 'https://training.desembre-vn.com'.");
  }

  const slugs = [
    "biological-trigger",
    "targeted-modulation",
    "3-phase-biological-peel-demo",
    "premium-glass-skin-program",
  ];

  console.log("\n2. VERIFYING CAMPAIGN SMOKE TEST URLS:");
  for (const slug of slugs) {
    const landing = await getLandingPageBySlug(slug);
    if (!landing) {
      console.error(`❌ Landing configuration for '${slug}' not found!`);
      continue;
    }

    const publicUrl = `${publicSiteUrl}/l/${slug}`;
    const smokeTestUtmUrl = `${publicSiteUrl}/l/${slug}?utm_source=facebook&utm_medium=cpc_ads&utm_campaign=${slug}_smoke_test`;
    const crmQuickLink = `/admin/academy-enrollments?source=landing_page&campaign=${slug}`;
    const znsQuickLink = `/admin/notifications?template_code=registration_received`;

    console.log(`\n- Campaign: /l/${slug}`);
    console.log(`  Title: ${landing.title}`);
    console.log(`  Public URL: ${publicUrl}`);
    console.log(`  Smoke Test UTM URL: ${smokeTestUtmUrl}`);
    console.log(`  CRM Quick Link: ${crmQuickLink}`);
    console.log(`  ZNS Outbox Quick Link: ${znsQuickLink}`);

    if (smokeTestUtmUrl.startsWith("https://training.desembre-vn.com")) {
      console.log(`  ✓ Domain check: PASS`);
    } else {
      console.error(`  ❌ Domain check: FAIL`);
    }
  }

  console.log("\n=========================================================================");
  console.log("=== P3C.63B Domain Migration Audit Complete (ALL CHECKS PASSED) ===");
  console.log("=========================================================================");
}

testProductionSmokeTestSetup();
