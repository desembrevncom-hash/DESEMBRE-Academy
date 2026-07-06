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
});

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
  progress: lessonProgressSchema.nullable(),
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
  return currentStudentCoursesSchema.parse(data);
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
