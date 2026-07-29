export interface LandingTrackPayload extends Record<string, unknown> {
  route?: string;
  course_slug?: string;
  batch_id?: string;
  batch_title?: string;
  registration_id?: string;
  duplicate?: boolean;
}

export function trackLandingEvent(eventName: string, payload?: LandingTrackPayload): void {
  if (typeof window !== "undefined") {
    const fullPayload = {
      route: "/synergistic-protocol",
      course_slug: "chuyen-de-synergistic-protocol-online",
      timestamp: new Date().toISOString(),
      ...payload,
    };
    console.log("[Landing Tracking]", eventName, fullPayload);
  }
}
