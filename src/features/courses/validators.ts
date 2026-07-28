import { z } from "zod";
import type {
  CourseCatalogItem,
  CurrentStudentCourse,
  CourseOutline,
  EnrollmentResult,
  SaveProgressResult,
} from "./types";

const courseCategorySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
});

const requiredTierSchema = z.object({
  code: z.string(),
  name: z.string(),
  rank: z.number(),
});

const courseAccessReasonSchema = z.enum([
  "AVAILABLE",
  "COURSE_UNAVAILABLE",
  "NO_STUDENT_ACCOUNT",
  "ALREADY_ENROLLED",
  "COURSE_PRIVATE",
  "PAYMENT_REQUIRED",
  "ENROLLMENT_CLOSED",
  "ASSIGNMENT_REQUIRED",
  "MEMBERSHIP_REQUIRED",
  "TIER_REQUIRED",
  "ENROLLMENT_APPROVAL_REQUIRED",
  "ACCESS_BLOCKED",
]);

const courseAccessDecisionSchema = z.object({
  can_view: z.boolean(),
  can_enroll: z.boolean(),
  can_learn: z.boolean(),
  reason: courseAccessReasonSchema,
  required_tier: requiredTierSchema.nullable(),
});

const enrollmentStatusSchema = z.enum(["active", "completed", "pending"]);
const progressStatusSchema = z.enum(["not_started", "in_progress", "completed"]);

const courseMarketingMetadataSchema = z.object({
  level: z.enum(["basic", "intermediate", "advanced"]).nullable().optional(),
  short_description: z.string().nullable().optional(),
  estimated_minutes: z.number().nullable().optional(),
  is_featured: z.boolean().optional(),
  featured_order: z.number().optional(),
  audience: z.array(z.string()).optional(),
  outcomes: z.array(z.string()).optional(),
  thumbnail_url: z.string().nullable().optional(),
  thumbnail_alt: z.string().nullable().optional(),
});

const courseBaseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  catalog_visibility: z.string(),
  enrollment_policy: z.string(),
  access_policy: z.string(),
  pricing_model: z.string(),
  category: courseCategorySchema.nullable(),
  marketing: courseMarketingMetadataSchema.nullable().optional(),
});

const enrollmentSummarySchema = z.object({
  status: enrollmentStatusSchema,
  source: z.string(),
  created_at: z.string(),
});

const progressSummarySchema = z.object({
  completed_lessons: z.number(),
  total_lessons: z.number(),
  progress_percent: z.number(),
});

const courseCatalogItemSchema = courseBaseSchema.extend({
  access_decision: courseAccessDecisionSchema,
  current_enrollment_summary: enrollmentSummarySchema.nullable(),
  current_progress_summary: progressSummarySchema.nullable(),
});

export const courseCatalogSchema = z.array(courseCatalogItemSchema);

const currentStudentEnrollmentSchema = z.object({
  id: z.string(),
  status: enrollmentStatusSchema,
  source: z.string(),
  created_at: z.string(),
  expires_at: z.string().nullable(),
});

const currentStudentCourseSchema = z.object({
  course: courseBaseSchema,
  enrollment: currentStudentEnrollmentSchema,
  completed_lessons: z.number(),
  total_lessons: z.number(),
  progress_percent: z.number(),
  last_accessed_lesson: z.string().nullable(),
  access_decision: courseAccessDecisionSchema.optional().nullable(),
  is_blocked: z.boolean().optional().nullable(),
}).transform((data) => ({
  ...data,
  is_blocked: data.is_blocked ?? (data.access_decision?.can_learn === false && data.access_decision?.reason === "ACCESS_BLOCKED"),
}));

export const currentStudentCoursesSchema = z.array(currentStudentCourseSchema);

const lessonProgressSchema = z.object({
  status: progressStatusSchema,
  progress_percent: z.number().min(0).max(100),
  last_position_seconds: z.number().nullable(),
});

const courseLessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  type: z.string().nullable(),
  position: z.number(),
  duration: z.number().nullable(),
  is_preview: z.boolean(),
  is_locked: z.boolean(),
  progress: lessonProgressSchema.nullable().optional(),
});

const courseModuleSchema = z.object({
  id: z.string(),
  title: z.string(),
  position: z.number(),
  lessons: z.array(courseLessonSchema),
});

export const courseOutlineSchema = z.object({
  course: courseBaseSchema,
  access_decision: courseAccessDecisionSchema,
  modules: z.array(courseModuleSchema),
});

export const enrollmentResultSchema = z.object({
  success: z.boolean(),
  enrollment_id: z.string(),
  status: enrollmentStatusSchema,
  message: z.string(),
});

export const saveProgressResultSchema = z.object({
  id: z.string(),
  enrollment_id: z.string(),
  lesson_id: z.string(),
  status: progressStatusSchema,
  progress_percent: z.number().min(0).max(100),
  last_position_seconds: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Helper for parsing
export function validateCatalog(data: unknown): CourseCatalogItem[] {
  return courseCatalogSchema.parse(data);
}

export function validateCurrentCourses(data: unknown): CurrentStudentCourse[] {
  if (!Array.isArray(data)) {
    console.error({
      raw_count: 0,
      parsed_count: 0,
      filter_count: 0,
      parse_error_name: "Not an array",
    });
    throw new Error("INVALID_DATA");
  }

  const parsed: CurrentStudentCourse[] = [];
  let errorName = null;

  for (const item of data) {
    const result = currentStudentCourseSchema.safeParse(item);
    if (result.success) {
      parsed.push(result.data);
    } else {
      if (!errorName) errorName = result.error.name || "ZodError";
      console.error("Course parse error on item:", JSON.stringify(result.error.issues).replace(/"(id|user_id|slug|phone|jwt|token)":"[^"]*"/g, '"$1":"***"'));
    }
  }

  const raw_count = data.length;
  const parsed_count = parsed.length;
  const filter_count = raw_count - parsed_count;

  if (filter_count > 0) {
    console.error({
      raw_count,
      parsed_count,
      filter_count,
      parse_error_name: errorName,
    });
  }

  if (parsed_count === 0 && raw_count > 0) {
    throw new Error("INVALID_DATA");
  }

  return parsed;
}

export function validateCourseOutline(data: unknown): CourseOutline {
  return courseOutlineSchema.parse(data);
}

export function validateEnrollmentResult(data: unknown): EnrollmentResult {
  return enrollmentResultSchema.parse(data);
}

export function validateSaveProgressResult(data: unknown): SaveProgressResult {
  return saveProgressResultSchema.parse(data);
}
