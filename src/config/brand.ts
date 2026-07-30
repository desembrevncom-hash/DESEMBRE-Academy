export const BRAND_NAME = "DESEMBRE Training Center";
export const BRAND_NAME_UPPER = "DESEMBRE TRAINING CENTER";
export const BRAND_TAGLINE = "Học đúng kiến thức. Phát triển đúng hướng.";
export const BRAND_DESCRIPTION = "Trung tâm đào tạo chuyên sâu dành cho khách hàng, đối tác và đội ngũ DESEMBRE.";

export const SITE_URL = "https://academy.desembre-vn.com";
export const DEFAULT_OG_IMAGE = "https://academy.desembre-vn.com/og/academy-home.jpg";

export function getCanonicalUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${cleanPath}`;
}

export function getValidOgImage(url?: string | null): string {
  if (url && (url.startsWith("https://") || url.startsWith("http://"))) {
    return url;
  }
  return DEFAULT_OG_IMAGE;
}
