export type CourseLevel = "co-ban" | "trung-cap" | "nang-cao";
export type CourseStatus = "available" | "enrolled" | "completed" | "pending";
export type EnrollmentStatus = "pending" | "approved" | "completed" | "rejected";
export type LessonStatus = "not-started" | "in-progress" | "completed" | "locked";

export interface User {
  id: string;
  phone: string;
  fullName: string;
  email?: string;
  avatarUrl?: string;
}

export interface StudentProfile extends User {
  company?: string;
  jobTitle?: string;
  joinedAt: string;
}

export interface Instructor {
  id: string;
  name: string;
  title: string;
  avatarUrl?: string;
  bio: string;
}

export interface CourseCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string; // lucide icon name
  courseCount: number;
}

export interface Lesson {
  id: string;
  title: string;
  duration: number; // minutes
  type: "video" | "reading" | "quiz";
  description: string;
  videoUrl?: string;
  resources?: { name: string; url: string }[];
}

export interface CourseModule {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  level: CourseLevel;
  thumbnailUrl: string;
  instructorId: string;
  durationMinutes: number;
  lessonCount: number;
  moduleCount: number;
  enrolledCount: number;
  rating: number;
  ratingCount: number;
  outcomes: string[];
  audience: string[];
  requirements: string[];
  modules: CourseModule[];
  featured?: boolean;
}

export interface Enrollment {
  id: string;
  courseId: string;
  userId: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  progress: number; // 0-100
  lastAccessedLessonId?: string;
  lastAccessedAt?: string;
}

export interface LessonProgress {
  lessonId: string;
  courseId: string;
  userId: string;
  completed: boolean;
  updatedAt: string;
}
