export function trackLandingEvent(eventName: string, payload?: Record<string, unknown>): void {
  if (typeof window !== "undefined") {
    console.log("[Landing Tracking]", eventName, payload || {});
  }
}
