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

export interface AcademyAdminCategory {
  id: string;
  name: string;
  slug: string;
}

export interface AcademyAdminCategoryManagerItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
  course_count: number;
}

export interface CreateAcademyCategoryInput {
  p_name: string;
  p_slug: string;
  p_description?: string | null;
  p_status: "draft" | "published" | "archived";
}

export interface UpdateAcademyCategoryInput {
  p_category_id: string;
  p_name: string;
  p_slug: string;
  p_description?: string | null;
  p_status: "draft" | "published" | "archived";
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
  summary?: string | null;
  cover_url?: string | null;
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

export interface PublishValidationError {
  code: string;
  message: string;
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
  cover_url?: string | null;
  summary?: string | null;
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
  cover_url?: string | null;
  summary?: string | null;
}

export interface CreateAcademyModuleInput {
  p_course_id: string;
  p_title: string;
}

export interface UpdateAcademyModuleInput {
  p_module_id: string;
  p_title: string;
}

export interface ReorderAcademyModulesInput {
  p_course_id: string;
  p_module_ids: string[];
}

export interface CreateAcademyLessonInput {
  p_module_id: string;
  p_title: string;
  p_type: "article" | "video" | "document" | "external_link";
  p_description?: string | null;
  p_is_preview?: boolean;
}

export interface UpdateAcademyLessonInput {
  p_lesson_id: string;
  p_title: string;
  p_description?: string | null;
  p_is_preview: boolean;
}

export interface ReorderAcademyLessonsInput {
  p_module_id: string;
  p_lesson_ids: string[];
}

export interface AcademyCourseMarketingMetadata {
  course_id: string;
  level: 'basic' | 'intermediate' | 'advanced' | null;
  short_description: string | null;
  estimated_minutes: number | null;
  is_featured: boolean;
  featured_order: number;
  audience: string[];
  outcomes: string[];
  thumbnail_url: string | null;
  thumbnail_alt: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpsertAcademyCourseMarketingMetadataInput {
  p_course_id: string;
  p_level: 'basic' | 'intermediate' | 'advanced' | null;
  p_short_description: string | null;
  p_estimated_minutes: number | null;
  p_is_featured: boolean;
  p_featured_order: number;
  p_audience: string[];
  p_outcomes: string[];
  p_thumbnail_url?: string | null;
  p_thumbnail_alt?: string | null;
  p_seo_title?: string | null;
  p_seo_description?: string | null;
}
