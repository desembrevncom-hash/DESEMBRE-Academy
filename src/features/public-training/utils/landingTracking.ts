export type LandingEventName =
  | "landing_view"
  | "landing_cta_click"
  | "registration_form_open"
  | "registration_submit_attempt"
  | "registration_submit_success"
  | "registration_submit_error";

export interface LandingTrackPayload extends Record<string, unknown> {
  campaign_slug?: string;
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  course_slug?: string;
  batch_id?: string;
  batch_title?: string;
  registration_id?: string;
  duplicate?: boolean;
  error_message?: string;
}

export function sanitizePixelPayload(eventName: string, payload?: LandingTrackPayload) {
  const eventId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const pathname = typeof window !== "undefined" ? window.location.pathname : "";

  // STRICT ALLOWLIST: Never include full_name, phone, email, notes, registration_id, or raw url/query
  return {
    event_name: eventName,
    event_id: eventId,
    timestamp: new Date().toISOString(),
    pathname,
    campaign_slug: payload?.campaign_slug,
    source: payload?.source,
    utm_source: payload?.utm_source,
    utm_medium: payload?.utm_medium,
    utm_campaign: payload?.utm_campaign,
    course_slug: payload?.course_slug,
    batch_id: payload?.batch_id,
    duplicate: payload?.duplicate,
  };
}

export function trackLandingEvent(eventName: LandingEventName | string, payload?: LandingTrackPayload): void {
  if (typeof window === "undefined") return;

  const isPreview =
    payload?.isPreview === true ||
    payload?.source === "preview" ||
    window.location.search.includes("preview=1") ||
    window.location.pathname.includes("/admin/");

  const internalPayload = {
    timestamp: new Date().toISOString(),
    pathname: window.location.pathname,
    isPreview,
    ...payload,
  };

  // Preview Mode: DO NOT fire third-party tracking pixels
  if (isPreview) {
    if (import.meta.env.DEV) {
      console.debug(`[PREVIEW MODE Suppressed Tracking Event: ${eventName}]`, internalPayload);
    }
    return;
  }

  // Internal log for DEV (may contain internal registration_id for debugging)
  if (import.meta.env.DEV) {
    console.debug(`[Landing Tracking Event: ${eventName}]`, internalPayload);
  }

  // Strict Sanitized Payload for third-party pixels (NO PII, NO registration_id, NO raw URL)
  const sanitizedPayload = sanitizePixelPayload(eventName, payload);

  try {
    const win = window as any;
    const isSuccessConversion = eventName === "registration_submit_success";

    // 1. Google Analytics 4 / Tag Manager
    if (typeof win.gtag === "function") {
      if (isSuccessConversion) {
        win.gtag("event", "generate_lead", sanitizedPayload);
      } else {
        win.gtag("event", eventName, sanitizedPayload);
      }
    }

    // 2. Meta (Facebook) Pixel
    if (typeof win.fbq === "function") {
      if (isSuccessConversion) {
        win.fbq("track", "Lead", sanitizedPayload);
      } else {
        win.fbq("trackCustom", eventName, sanitizedPayload);
      }
    }

    // 3. TikTok Pixel
    if (typeof win.ttq === "object" && typeof win.ttq.track === "function") {
      if (isSuccessConversion) {
        win.ttq.track("SubmitForm", sanitizedPayload);
        win.ttq.track("CompleteRegistration", sanitizedPayload);
      } else {
        win.ttq.track(eventName, sanitizedPayload);
      }
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[trackLandingEvent error]:", err);
    }
  }
}
