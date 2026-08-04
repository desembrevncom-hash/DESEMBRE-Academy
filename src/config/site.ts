function getEnvVar(key: string): string | undefined {
  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv && key in metaEnv && metaEnv[key]) {
      return metaEnv[key];
    }
  } catch (_) {}
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
}

export function getPublicSiteUrl(): string {
  const envUrl =
    getEnvVar("VITE_PUBLIC_SITE_URL") ||
    getEnvVar("VITE_SITE_URL") ||
    getEnvVar("PUBLIC_SITE_URL");
  if (envUrl && envUrl.trim() !== "") {
    return envUrl.trim().replace(/\/+$/, "");
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "https://training.desembre-vn.com";
}

export const SITE_URL = getPublicSiteUrl();
export const OLD_SITE_URL = "https://academy.desembre-vn.com";
export const VERCEL_FALLBACK_URL = "https://desembre-academy.vercel.app";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og/academy-home.jpg`;
