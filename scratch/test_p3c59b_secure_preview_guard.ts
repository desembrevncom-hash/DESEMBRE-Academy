import { trackLandingEvent } from "../src/features/public-training/utils/landingTracking";

async function testSecurePreviewGuard() {
  console.log("=== Testing P3C.59B Secure Landing Preview Guard & Tracking Suppression ===");

  // 1. Test tracking suppression in preview mode
  console.log("\n1. Invoking trackLandingEvent with isPreview: true...");
  trackLandingEvent("landing_view", {
    campaign_slug: "premium-glass-skin-program",
    source: "preview",
    isPreview: true,
  });

  console.log("\n2. Invoking trackLandingEvent with isPreview: false (published mode)...");
  trackLandingEvent("landing_view", {
    campaign_slug: "biological-trigger",
    source: "landing_page",
    isPreview: false,
  });

  console.log("\n=== P3C.59B Secure Preview Guard Test Complete ===");
}

testSecurePreviewGuard();
