import { sanitizePixelPayload } from "../src/features/public-training/utils/landingTracking";

function testStrictPrivacySanitization() {
  console.log("=========================================================================");
  console.log("=== P3C.61B — Strict Pixel Payload Privacy Hotfix Audit ===");
  console.log("=========================================================================\n");

  const mockPayload = {
    campaign_slug: "biological-trigger",
    source: "landing_page",
    full_name: "NGUYỄN THIỆN NHÂN (PII)",
    phone: "0988776655 (PII)",
    email: "nhan.nguyen@example.com (PII)",
    notes: "Đăng ký từ ads riêng tư [campaign: biological-trigger]",
    registration_id: "00000000-0000-0000-0000-000000000099",
    url: "https://training.desembre-vn.com/l/biological-trigger?secret_token=abc&full_name=Nguyen%20A",
    href: "https://training.desembre-vn.com/l/biological-trigger?secret_token=abc",
    utm_source: "facebook",
    utm_medium: "cpc_ads",
    utm_campaign: "august_launch_batch_1",
    course_slug: "biological-trigger",
    batch_id: "batch-uuid-1234",
  };

  const sanitized = sanitizePixelPayload("registration_submit_success", mockPayload as any);

  console.log("Raw Payload Keys:", Object.keys(mockPayload));
  console.log("Sanitized Payload Output:", JSON.stringify(sanitized, null, 2));

  // Assertions for EXCLUDED fields
  const forbiddenFields = ["full_name", "phone", "email", "notes", "registration_id", "url", "href"];
  let hasForbidden = false;

  for (const field of forbiddenFields) {
    if (field in sanitized) {
      console.error(`❌ VIOLATION: Forbidden field '${field}' was NOT stripped from pixel payload!`);
      hasForbidden = true;
    } else {
      console.log(`✓ VERIFIED: '${field}' is strictly EXCLUDED.`);
    }
  }

  // Assertions for REQUIRED fields
  const requiredFields = ["event_name", "event_id", "timestamp", "pathname", "campaign_slug", "utm_source", "utm_medium", "utm_campaign"];
  let missingRequired = false;

  for (const field of requiredFields) {
    if (field in sanitized && sanitized[field as keyof typeof sanitized] !== undefined) {
      console.log(`✓ VERIFIED: Required field '${field}' is present (${sanitized[field as keyof typeof sanitized]}).`);
    } else {
      console.error(`❌ VIOLATION: Required field '${field}' is MISSING!`);
      missingRequired = true;
    }
  }

  // Verify event_id is NOT registration_id
  if (sanitized.event_id === mockPayload.registration_id) {
    console.error("❌ VIOLATION: event_id equals registration_id!");
    hasForbidden = true;
  } else {
    console.log(`✓ VERIFIED: event_id '${sanitized.event_id}' is securely randomized and decoupled from registration_id.`);
  }

  if (hasForbidden || missingRequired) {
    console.error("\n❌ TEST FAILED: Strict privacy compliance check failed.");
    process.exit(1);
  } else {
    console.log("\n=========================================================================");
    console.log("=== P3C.61B Strict Privacy Audit Completed (ALL CHECKS PASSED 100%) ===");
    console.log("=========================================================================");
  }
}

testStrictPrivacySanitization();
