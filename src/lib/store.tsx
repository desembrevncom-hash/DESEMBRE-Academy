import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Enrollment, LessonProgress } from "@/types";
import { courses } from "@/data/courses";
import { mockStudent } from "@/data/student";

interface AppState {
  isAuthed: boolean;
  phone: string | null;
  pendingPhone: string | null;
  enrollments: Enrollment[];
  progress: LessonProgress[];
}

interface AppStore extends AppState {
  requestOtp: (phone: string) => void;
  verifyOtp: (code: string) => boolean;
  logout: () => void;
  enroll: (courseId: string) => Enrollment;
  isEnrolled: (courseId: string) => Enrollment | undefined;
  toggleLesson: (courseId: string, lessonId: string, completed: boolean) => void;
  getCourseProgress: (courseId: string) => number;
  isLessonCompleted: (lessonId: string) => boolean;
  student: typeof mockStudent;
}

const STORAGE_KEY = "desembre-academy-state";

const defaultEnrollments: Enrollment[] = [
  {
    id: "e1",
    courseId: "co5",
    userId: "u1",
    status: "approved",
    enrolledAt: "2024-04-01",
    progress: 65,
    lastAccessedLessonId: "co5-m2-l1",
    lastAccessedAt: "2024-05-20",
  },
  {
    id: "e2",
    courseId: "co1",
    userId: "u1",
    status: "approved",
    enrolledAt: "2024-05-10",
    progress: 20,
    lastAccessedLessonId: "co1-m1-l2",
    lastAccessedAt: "2024-05-22",
  },
  {
    id: "e3",
    courseId: "co3",
    userId: "u1",
    status: "completed",
    enrolledAt: "2024-02-15",
    progress: 100,
    lastAccessedAt: "2024-03-30",
  },
];

const defaultState: AppState = {
  isAuthed: false,
  phone: null,
  pendingPhone: null,
  enrollments: defaultEnrollments,
  progress: [],
};

function loadState(): AppState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) } as AppState;
  } catch {
    return defaultState;
  }
}

const AppContext = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);

  useEffect(() => {
    setState(loadState());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const requestOtp = useCallback((phone: string) => {
    setState((s) => ({ ...s, pendingPhone: phone }));
  }, []);

  const verifyOtp = useCallback((code: string) => {
    if (code !== "123456") return false;
    setState((s) => ({ ...s, isAuthed: true, phone: s.pendingPhone, pendingPhone: null }));
    return true;
  }, []);

  const logout = useCallback(() => {
    setState((s) => ({ ...s, isAuthed: false, phone: null }));
  }, []);

  const enroll = useCallback((courseId: string): Enrollment => {
    const existing = state.enrollments.find((e) => e.courseId === courseId);
    if (existing) return existing;
    const en: Enrollment = {
      id: `e-${Date.now()}`,
      courseId,
      userId: "u1",
      status: "pending",
      enrolledAt: new Date().toISOString(),
      progress: 0,
    };
    setState((s) => ({ ...s, enrollments: [...s.enrollments, en] }));
    return en;
  }, [state.enrollments]);

  const isEnrolled = useCallback(
    (courseId: string) => state.enrollments.find((e) => e.courseId === courseId),
    [state.enrollments],
  );

  const isLessonCompleted = useCallback(
    (lessonId: string) => state.progress.some((p) => p.lessonId === lessonId && p.completed),
    [state.progress],
  );

  const getCourseProgress = useCallback(
    (courseId: string) => {
      const course = courses.find((c) => c.id === courseId);
      if (!course) return 0;
      const total = course.lessonCount;
      const completed = course.modules
        .flatMap((m) => m.lessons)
        .filter((l) => state.progress.some((p) => p.lessonId === l.id && p.completed)).length;
      const enrollmentBase = state.enrollments.find((e) => e.courseId === courseId)?.progress ?? 0;
      if (completed === 0) return enrollmentBase;
      return Math.min(100, Math.round((completed / total) * 100));
    },
    [state.progress, state.enrollments],
  );

  const toggleLesson = useCallback((courseId: string, lessonId: string, completed: boolean) => {
    setState((s) => {
      const others = s.progress.filter((p) => p.lessonId !== lessonId);
      const next = [
        ...others,
        { lessonId, courseId, userId: "u1", completed, updatedAt: new Date().toISOString() },
      ];
      return { ...s, progress: next };
    });
  }, []);

  const value = useMemo<AppStore>(
    () => ({
      ...state,
      requestOtp,
      verifyOtp,
      logout,
      enroll,
      isEnrolled,
      toggleLesson,
      getCourseProgress,
      isLessonCompleted,
      student: mockStudent,
    }),
    [state, requestOtp, verifyOtp, logout, enroll, isEnrolled, toggleLesson, getCourseProgress, isLessonCompleted],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore(): AppStore {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}
