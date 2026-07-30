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
