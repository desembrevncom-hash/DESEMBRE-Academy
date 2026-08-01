process.env.VITE_ENABLE_ADS_TRACKING = "true";
process.env.VITE_META_PIXEL_ID = "123456789012345";
process.env.VITE_TIKTOK_PIXEL_ID = "C12345678901234567";
process.env.VITE_GA4_MEASUREMENT_ID = "G-ABC1234567";
process.env.VITE_GTM_CONTAINER_ID = "GTM-XYZ7890";

import { getTrackingConfigStatus, initAdsTracking } from "../src/features/public-training/tracking/pixelSdkLoader";
import { trackLandingEvent } from "../src/features/public-training/utils/landingTracking";

async function testPixelSdkLoaderWithFakeEnv() {
  console.log("=== Testing P3C.61 Pixel SDK Loader with Configured Env Variables ===");

  // 1. Check Tracking Config Status with Masked IDs
  const status = getTrackingConfigStatus();
  console.log("\n1. Masked Tracking Config Status:", JSON.stringify(status, null, 2));

  // 2. Test Payload Sanitization in trackLandingEvent
  console.log("\n2. Invoking trackLandingEvent with sensitive PII payload...");
  trackLandingEvent("registration_submit_success", {
    campaign_slug: "biological-trigger",
    source: "landing_page",
    full_name: "NGUYỄN VĂN A (PII MUST NOT BE IN PIXEL)",
    phone: "0912345678 (PII MUST NOT BE IN PIXEL)",
    email: "test.pii@example.com (PII MUST NOT BE IN PIXEL)",
    notes: "Sensitive note (PII MUST NOT BE IN PIXEL)",
    utm_source: "facebook",
    utm_medium: "cpc_ads",
    utm_campaign: "august_launch",
  });

  console.log("\n=== P3C.61 Configured Env Test Complete ===");
}

testPixelSdkLoaderWithFakeEnv();
