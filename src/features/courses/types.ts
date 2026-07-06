export type CourseRuntimeErrorKind =
  | "UNAUTHENTICATED"
  | "NETWORK"
  | "PERMISSION_DENIED"
  | "INVALID_DATA"
  | "COURSE_NOT_FOUND"
  | "ACCESS_DENIED"
  | "ENROLLMENT_REJECTED"
  | "PROGRESS_REJECTED"
  | "UNKNOWN";

export type CourseAccessReason =
  | "AVAILABLE"
  | "COURSE_UNAVAILABLE"
  | "NO_STUDENT_ACCOUNT"
  | "ALREADY_ENROLLED"
  | "COURSE_PRIVATE"
  | "PAYMENT_REQUIRED"
  | "ENROLLMENT_CLOSED"
  | "ASSIGNMENT_REQUIRED"
  | "MEMBERSHIP_REQUIRED"
  | "TIER_REQUIRED"
  | "ENROLLMENT_APPROVAL_REQUIRED";

export type EnrollmentStatus = "active" | "completed" | "pending";
export type ProgressStatus = "not_started" | "in_progress" | "completed";

export interface CourseCategory {
  id: string;
  slug: string;
  name: string;
}

export interface RequiredTier {
  code: string;
  name: string;
  rank: number;
}

export interface CourseAccessDecision {
  can_view: boolean;
  can_enroll: boolean;
  can_learn: boolean;
  reason: CourseAccessReason;
  required_tier: RequiredTier | null;
}

export interface CourseBase {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: string;
  catalog_visibility: string;
  enrollment_policy: string;
  access_policy: string;
  pricing_model: string;
  category: CourseCategory | null;
}

export interface EnrollmentSummary {
  status: EnrollmentStatus;
  source: string;
  created_at: string;
}

export interface ProgressSummary {
  completed_lessons: number;
  total_lessons: number;
  progress_percent: number;
}

export interface CourseCatalogItem extends CourseBase {
  access_decision: CourseAccessDecision;
  current_enrollment_summary: EnrollmentSummary | null;
  current_progress_summary: ProgressSummary | null;
}

export interface CurrentStudentEnrollment {
  id: string;
  status: EnrollmentStatus;
  source: string;
  created_at: string;
  expires_at: string | null;
}

export interface CurrentStudentCourse {
  course: CourseBase;
  enrollment: CurrentStudentEnrollment;
  completed_lessons: number;
  total_lessons: number;
  progress_percent: number;
  last_accessed_lesson: string | null;
}

export interface LessonProgress {
  status: ProgressStatus;
  progress_percent: number;
  last_position_seconds: number | null;
}

export interface CourseLesson {
  id: string;
  title: string;
  description: string | null;
  type: string | null;
  position: number;
  duration: number | null;
  is_preview: boolean;
  is_locked: boolean;
  progress: LessonProgress | null;
}

export interface CourseModule {
  id: string;
  title: string;
  position: number;
  lessons: CourseLesson[];
}

export interface CourseOutline {
  course: CourseBase;
  access_decision: CourseAccessDecision;
  modules: CourseModule[];
}

export interface EnrollmentResult {
  success: boolean;
  enrollment_id: string;
  status: EnrollmentStatus;
  message: string;
}

export interface SaveProgressResult {
  id: string;
  enrollment_id: string;
  lesson_id: string;
  status: ProgressStatus;
  progress_percent: number;
  last_position_seconds: number | null;
  created_at: string;
  updated_at: string;
}
