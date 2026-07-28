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
  | "ENROLLMENT_APPROVAL_REQUIRED"
  | "ACCESS_BLOCKED";

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

export interface CourseMarketingMetadata {
  level?: "basic" | "intermediate" | "advanced" | null;
  short_description?: string | null;
  estimated_minutes?: number | null;
  is_featured?: boolean;
  featured_order?: number;
  audience?: string[];
  outcomes?: string[];
  thumbnail_url?: string | null;
  thumbnail_alt?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
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
  marketing?: CourseMarketingMetadata | null;
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
  is_blocked?: boolean;
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
  access_decision?: CourseAccessDecision | null;
  is_blocked?: boolean;
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
  progress?: LessonProgress | null;
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

export type BatchStatus = "draft" | "open" | "closed" | "full" | "cancelled";
export type TrainingFormat = "zoom" | "office" | "studio" | "hybrid";
export type RegistrationState = "AVAILABLE" | "BATCH_FULL" | "REGISTRATION_CLOSED" | "REGISTRATION_NOT_OPEN_YET" | "BATCH_NOT_FOUND";

export interface CourseBatch {
  id: string;
  course_id: string;
  slug: string;
  title: string;
  description: string | null;
  training_format: TrainingFormat;
  status: BatchStatus;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  max_participants: number | null;
  current_participants: number;
  created_at: string;
  course?: CourseBase | null;
}

export interface CourseSession {
  id: string;
  batch_id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  location_type: string;
  location_detail: string | null;
}

export interface BatchRegistrationDecision {
  can_register: boolean;
  state: RegistrationState;
  reason?: string;
}

export interface CourseBatchDetail {
  batch: CourseBatch;
  sessions: CourseSession[];
  registration_decision: BatchRegistrationDecision;
}

export interface CourseRegistrationPayload {
  full_name: string;
  phone: string;
  email?: string;
  company?: string;
  participant_role?: string;
  marketing_source?: string;
}

