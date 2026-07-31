export interface LandingTrackPayload extends Record<string, unknown> {
  route?: string;
  course_slug?: string;
  campaign_slug?: string;
  batch_id?: string;
  batch_title?: string;
  registration_id?: string;
  duplicate?: boolean;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export function trackLandingEvent(eventName: string, payload?: LandingTrackPayload): void {
  if (typeof window === "undefined") return;

  const fullPayload = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    ...payload,
  };

  console.log(`[Landing Tracking Event: ${eventName}]`, fullPayload);

  try {
    // 1. GA4 / Google Tag Manager
    const win = window as any;
    if (typeof win.gtag === "function") {
      win.gtag("event", eventName, fullPayload);
    }

    // 2. Meta (Facebook) Pixel
    if (typeof win.fbq === "function") {
      if (eventName === "campaign_registration_success") {
        win.fbq("track", "Lead", fullPayload);
      } else {
        win.fbq("trackCustom", eventName, fullPayload);
      }
    }

    // 3. TikTok Pixel
    if (typeof win.ttq === "object" && typeof win.ttq.track === "function") {
      if (eventName === "campaign_registration_success") {
        win.ttq.track("SubmitForm", fullPayload);
      } else {
        win.ttq.track(eventName, fullPayload);
      }
    }
  } catch (err) {
    console.warn("[trackLandingEvent error]:", err);
  }
}
