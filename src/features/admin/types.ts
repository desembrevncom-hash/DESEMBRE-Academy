export type AcademyCourseStatus = "draft" | "published" | "archived";
export type AcademyCatalogVisibility = "public" | "unlisted" | "private";
export type AcademyEnrollmentPolicy = "open" | "approval_required" | "closed";
export type AcademyAccessPolicy = "free" | "paid" | "dynamic";
export type AcademyPricingModel = "free" | "one_time" | "subscription" | "included";

export interface AcademyAdminCourseListItem {
  id: string;
  title: string;
  slug: string;
  status: AcademyCourseStatus;
  catalog_visibility: AcademyCatalogVisibility;
  created_at: string;
  updated_at: string;
}

export interface AcademyAdminCourseCategory {
  id: string;
  name: string;
}

export interface AcademyAdminCourseDetails {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: AcademyCourseStatus;
  catalog_visibility: AcademyCatalogVisibility;
  enrollment_policy: AcademyEnrollmentPolicy;
  access_policy: AcademyAccessPolicy;
  pricing_model: AcademyPricingModel;
  category: AcademyAdminCourseCategory | null;
}

export interface AcademyAdminLessonContent {
  markdown?: string;
  url?: string;
  original_filename?: string;
}

export interface AcademyAdminLesson {
  id: string;
  title: string;
  description: string | null;
  type: "article" | "video" | "document" | "external_link";
  position: number;
  is_preview: boolean;
  content_status: "missing" | "configured" | "ready";
  content: AcademyAdminLessonContent | null;
}

export interface AcademyAdminModule {
  id: string;
  title: string;
  position: number;
  lessons: AcademyAdminLesson[];
}

export interface AcademyPublishValidation {
  can_publish: boolean;
  errors: unknown[];
}

export interface AcademyAdminCourseEditor {
  course: AcademyAdminCourseDetails;
  modules: AcademyAdminModule[];
  publish_validation: AcademyPublishValidation;
}

export interface CreateAcademyCourseInput {
  p_title: string;
  p_slug: string;
  p_description?: string | null;
  p_category_id?: string | null;
  p_catalog_visibility?: AcademyCatalogVisibility;
  p_enrollment_policy?: AcademyEnrollmentPolicy;
  p_access_policy?: AcademyAccessPolicy;
  p_pricing_model?: AcademyPricingModel;
}

export interface UpdateAcademyCourseInput {
  p_course_id: string;
  p_title: string;
  p_slug: string;
  p_description?: string | null;
  p_category_id?: string | null;
  p_catalog_visibility: AcademyCatalogVisibility;
  p_enrollment_policy: AcademyEnrollmentPolicy;
  p_access_policy: AcademyAccessPolicy;
  p_pricing_model: AcademyPricingModel;
}
