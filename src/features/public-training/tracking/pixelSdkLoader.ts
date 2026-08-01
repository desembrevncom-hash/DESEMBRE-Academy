/**
 * P3C.61 — Production Pixel SDK Loader & Ads Launch Safety
 * Dynamically loads Meta Pixel, TikTok Pixel, GA4, and GTM SDKs safely without throwing errors.
 */

let isMetaLoaded = false;
let isTikTokLoaded = false;
let isGA4Loaded = false;
let isGTMLoaded = false;

function maskId(id?: string): string {
  if (!id || !id.trim()) return "(Chưa cấu hình)";
  const clean = id.trim();
  if (clean.length <= 6) return clean.slice(0, 2) + "***";
  return clean.slice(0, 4) + "****" + clean.slice(-4);
}

export interface TrackingConfigStatus {
  isEnabled: boolean;
  metaPixel: { configured: boolean; maskedId: string };
  tikTokPixel: { configured: boolean; maskedId: string };
  ga4: { configured: boolean; maskedId: string };
  gtm: { configured: boolean; maskedId: string };
}

function getEnvVar(key: string): string | undefined {
  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv && key in metaEnv) {
      return metaEnv[key];
    }
  } catch (_) {}
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }
  return undefined;
}

export function getTrackingConfigStatus(): TrackingConfigStatus {
  const isEnabled = getEnvVar("VITE_ENABLE_ADS_TRACKING") === "true";
  const metaId = getEnvVar("VITE_META_PIXEL_ID");
  const tiktokId = getEnvVar("VITE_TIKTOK_PIXEL_ID");
  const ga4Id = getEnvVar("VITE_GA4_MEASUREMENT_ID");
  const gtmId = getEnvVar("VITE_GTM_CONTAINER_ID");

  return {
    isEnabled,
    metaPixel: { configured: !!metaId, maskedId: maskId(metaId) },
    tikTokPixel: { configured: !!tiktokId, maskedId: maskId(tiktokId) },
    ga4: { configured: !!ga4Id, maskedId: maskId(ga4Id) },
    gtm: { configured: !!gtmId, maskedId: maskId(gtmId) },
  };
}

export function loadMetaPixel(pixelId?: string): boolean {
  if (!pixelId || typeof window === "undefined" || isMetaLoaded) return false;

  try {
    const win = window as any;
    if (typeof win.fbq === "function") {
      isMetaLoaded = true;
      return true;
    }

    (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      if (s && s.parentNode) {
        s.parentNode.insertBefore(t, s);
      } else {
        b.head.appendChild(t);
      }
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

    win.fbq("init", pixelId);
    win.fbq("track", "PageView");
    isMetaLoaded = true;
    if (import.meta.env.DEV) {
      console.debug(`[PixelSdkLoader] Loaded Meta Pixel: ${maskId(pixelId)}`);
    }
    return true;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[PixelSdkLoader] Meta Pixel load warning:", err);
    }
    return false;
  }
}

export function loadTikTokPixel(pixelId?: string): boolean {
  if (!pixelId || typeof window === "undefined" || isTikTokLoaded) return false;

  try {
    const win = window as any;
    if (typeof win.ttq === "object") {
      isTikTokLoaded = true;
      return true;
    }

    (function (w: any, d: any, t: any) {
      w.TiktokPixelObject = t;
      var ttq = (w[t] = w[t] || []);
      (ttq.methods = [
        "page",
        "track",
        "identify",
        "instances",
        "debug",
        "on",
        "off",
        "once",
        "ready",
        "alias",
        "group",
        "enableCookie",
        "disableCookie",
      ]),
        (ttq.setAndDefer = function (t: any, e: any) {
          t[e] = function () {
            t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
          };
        });
      for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
      ttq.instance = function (t: any) {
        for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++)
          ttq.setAndDefer(e, ttq.methods[n]);
        return e;
      };
      ttq.load = function (e: any, n: any) {
        var i = "https://analytics.tiktok.com/i18n/pixel/events.js";
        (ttq._i = ttq._i || {}),
          (ttq._i[e] = []),
          (ttq._i[e]._u = i),
          (ttq._t = ttq._t || {}),
          (ttq._t[e] = +new Date()),
          (ttq._o = ttq._o || {}),
          (ttq._o[e] = n || {});
        var o = d.createElement("script");
        (o.type = "text/javascript"), (o.async = !0), (o.src = i + "?sdkid=" + e + "&lib=" + t);
        var a = d.getElementsByTagName("script")[0];
        if (a && a.parentNode) {
          a.parentNode.insertBefore(o, a);
        } else {
          d.head.appendChild(o);
        }
      };
      ttq.load(pixelId);
      ttq.page();
    })(window, document, "ttq");

    isTikTokLoaded = true;
    if (import.meta.env.DEV) {
      console.debug(`[PixelSdkLoader] Loaded TikTok Pixel: ${maskId(pixelId)}`);
    }
    return true;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[PixelSdkLoader] TikTok Pixel load warning:", err);
    }
    return false;
  }
}

export function loadGA4(measurementId?: string): boolean {
  if (!measurementId || typeof window === "undefined" || isGA4Loaded) return false;

  try {
    const win = window as any;
    win.dataLayer = win.dataLayer || [];
    win.gtag =
      win.gtag ||
      function () {
        win.dataLayer.push(arguments);
      };

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);

    win.gtag("js", new Date());
    win.gtag("config", measurementId);

    isGA4Loaded = true;
    if (import.meta.env.DEV) {
      console.debug(`[PixelSdkLoader] Loaded GA4: ${maskId(measurementId)}`);
    }
    return true;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[PixelSdkLoader] GA4 load warning:", err);
    }
    return false;
  }
}

export function loadGTM(containerId?: string): boolean {
  if (!containerId || typeof window === "undefined" || isGTMLoaded) return false;

  try {
    (function (w: any, d: any, s: any, l: any, i: any) {
      w[l] = w[l] || [];
      w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
      var f = d.getElementsByTagName(s)[0],
        j = d.createElement(s),
        dl = l != "dataLayer" ? "&l=" + l : "";
      j.async = true;
      j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
      if (f && f.parentNode) {
        f.parentNode.insertBefore(j, f);
      } else {
        d.head.appendChild(j);
      }
    })(window, document, "script", "dataLayer", containerId);

    isGTMLoaded = true;
    if (import.meta.env.DEV) {
      console.debug(`[PixelSdkLoader] Loaded GTM Container: ${maskId(containerId)}`);
    }
    return true;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[PixelSdkLoader] GTM load warning:", err);
    }
    return false;
  }
}

export function initAdsTracking(): void {
  if (typeof window === "undefined") return;

  // Consent Safety Check
  const consent = localStorage.getItem("ads_tracking_consent");
  if (consent === "denied") {
    if (import.meta.env.DEV) {
      console.debug("[PixelSdkLoader] Ads tracking skipped due to user consent = denied.");
    }
    return;
  }

  const isEnabled = getEnvVar("VITE_ENABLE_ADS_TRACKING") === "true";
  if (!isEnabled) {
    if (import.meta.env?.DEV) {
      console.debug("[PixelSdkLoader] VITE_ENABLE_ADS_TRACKING is false. Skipping SDK injection.");
    }
    return;
  }

  const metaId = getEnvVar("VITE_META_PIXEL_ID");
  const tiktokId = getEnvVar("VITE_TIKTOK_PIXEL_ID");
  const ga4Id = getEnvVar("VITE_GA4_MEASUREMENT_ID");
  const gtmId = getEnvVar("VITE_GTM_CONTAINER_ID");

  if (metaId) loadMetaPixel(metaId);
  if (tiktokId) loadTikTokPixel(tiktokId);
  if (ga4Id) loadGA4(ga4Id);
  if (gtmId) loadGTM(gtmId);
}
