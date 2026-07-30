/**
 * REGRESSION GUARD (P3C.41A):
 * Checks if a record (course, batch, etc.) is a synthetic test/smoke record.
 * 
 * CRITICAL RULE:
 * - Do NOT include "demo" or "cancel" as test keywords!
 *   Real courses may have "DEMO" in their title (e.g. "Chuyên đề: 3-PHASE BIOLOGICAL PEEL DEMO").
 * - Test keywords ALLOWED ONLY: "smoke", "test", "dummy", "fake", "m6c-release".
 */
export function isDemoRecord(input: { title?: string | null; slug?: string | null }): boolean {
  if (!input) return false;
  
  const searchStr = ((input.title || "") + " " + (input.slug || "")).toLowerCase();
  return (
    searchStr.includes("smoke") ||
    searchStr.includes("test") ||
    searchStr.includes("dummy") ||
    searchStr.includes("fake") ||
    searchStr.includes("m6c-release")
  );
}
