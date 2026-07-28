import type { CourseOutline } from "../types";

/**
 * Kiểu nhẹ cho SEO meta — canonical source of truth.
 * Được import bởi server/courseMetaFetcher.ts và routes/courses.$slug.tsx.
 * Không chứa modules/lessons/progress/access data.
 */
export type CourseMetaForSeo = {
  title: string;
  slug: string;
  description: string | null;
  marketing: {
    seo_title: string | null;
    seo_description: string | null;
    short_description: string | null;
    thumbnail_url: string | null;
    thumbnail_alt: string | null;
  } | null;
} | null;

/**
 * Tạo array meta objects cho TanStack Router `head()` function.
 * Dùng server-side (SSR) để social crawlers đọc được ngay trong HTML ban đầu.
 * Thumbnail chỉ được inject nếu là https:// URL tuyệt đối.
 */
export function buildCourseHeadMeta(meta: CourseMetaForSeo): Array<Record<string, string>> {
  if (!meta) return [];

  const title = meta.marketing?.seo_title || meta.title || "DESEMBRE Academy";
  const description =
    meta.marketing?.seo_description ||
    meta.marketing?.short_description ||
    meta.description ||
    "";
  const fullTitle = `${title} — DESEMBRE Academy`;

  // Validate thumbnail: chỉ chấp nhận https://
  const thumbUrl = meta.marketing?.thumbnail_url;
  const safeThumbUrl =
    thumbUrl && thumbUrl.startsWith("https://") ? thumbUrl : null;
  const thumbAlt = meta.marketing?.thumbnail_alt || title;

  const tags: Array<Record<string, string>> = [
    { title: fullTitle },
    { name: "title", content: title },
    { property: "og:title", content: title },
    { property: "og:type", content: "website" },
    { name: "twitter:title", content: title },
  ];

  if (description) {
    tags.push(
      { name: "description", content: description },
      { property: "og:description", content: description },
      { name: "twitter:description", content: description }
    );
  }

  if (safeThumbUrl) {
    tags.push(
      { property: "og:image", content: safeThumbUrl },
      { property: "og:image:alt", content: thumbAlt },
      { name: "twitter:image", content: safeThumbUrl },
      { name: "twitter:image:alt", content: thumbAlt },
      { name: "twitter:card", content: "summary_large_image" }
    );
  } else {
    // Fallback twitter card khi không có ảnh
    tags.push({ name: "twitter:card", content: "summary" });
  }

  return tags;
}

/**
 * Client-side fallback: inject/update meta tags vào DOM sau khi React hydrate.
 * Hoạt động đúng vì dùng query existing tag trước khi tạo mới (không duplicate).
 */
export function applyCourseSeoMeta(course: CourseOutline["course"]) {
  const seoTitle = course.marketing?.seo_title || course.title;
  const seoDescription =
    course.marketing?.seo_description ||
    course.marketing?.short_description ||
    course.description ||
    "";

  // Validate thumbnail: chỉ inject nếu https://
  const rawThumb = course.marketing?.thumbnail_url;
  const seoImage =
    rawThumb && rawThumb.startsWith("https://") ? rawThumb : "";
  const seoImageAlt = course.marketing?.thumbnail_alt || seoTitle;

  // Cập nhật title
  document.title = `${seoTitle} — DESEMBRE Academy`;

  // Helper: update existing tag hoặc create mới — không bao giờ duplicate
  const setMeta = (name: string, content: string, isProperty = false) => {
    if (!content) return;
    const attr = isProperty ? "property" : "name";
    let el = document.querySelector(`meta[${attr}="${name}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  };

  // Tiêu đề
  setMeta("title", seoTitle);
  setMeta("og:title", seoTitle, true);
  setMeta("twitter:title", seoTitle);

  // Mô tả
  setMeta("description", seoDescription);
  setMeta("og:description", seoDescription, true);
  setMeta("twitter:description", seoDescription);

  // Ảnh (Thumbnail) - chỉ https://
  if (seoImage) {
    setMeta("og:image", seoImage, true);
    setMeta("og:image:alt", seoImageAlt, true);
    setMeta("twitter:image", seoImage);
    setMeta("twitter:image:alt", seoImageAlt);
    setMeta("twitter:card", "summary_large_image");
  } else {
    // Fallback khi không có ảnh
    setMeta("twitter:card", "summary");
  }
}
