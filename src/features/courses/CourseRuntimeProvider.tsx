import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { getCatalog, getCurrentStudentCourses, enrollInCourse } from "./services/course.service";
import type { CourseCatalogItem, CurrentStudentCourse, CourseRuntimeErrorKind } from "./types";

export type CourseRuntimeContextType = {
  catalog: CourseCatalogItem[];
  currentCourses: CurrentStudentCourse[];
  catalogLoading: boolean;
  currentCoursesLoading: boolean;
  catalogError: CourseRuntimeErrorKind | null;
  currentCoursesError: CourseRuntimeErrorKind | null;
  initialized: boolean;

  refreshCatalog: () => Promise<void>;
  refreshCurrentCourses: () => Promise<void>;
  refreshAll: () => Promise<void>;

  enroll: (slug: string) => Promise<void>;
  enrollmentPendingSlug: string | null;
  mutationError: CourseRuntimeErrorKind | null;
  clearMutationError: () => void;
};

export const CourseRuntimeContext = createContext<CourseRuntimeContextType | undefined>(undefined);

export function CourseRuntimeProvider({ children }: { children: ReactNode }) {
  const { session, initialized: authInitialized } = useAuth();

  const [catalog, setCatalog] = useState<CourseCatalogItem[]>([]);
  const [currentCourses, setCurrentCourses] = useState<CurrentStudentCourse[]>([]);

  const [catalogLoading, setCatalogLoading] = useState(false);
  const [currentCoursesLoading, setCurrentCoursesLoading] = useState(false);

  const [catalogError, setCatalogError] = useState<CourseRuntimeErrorKind | null>(null);
  const [currentCoursesError, setCurrentCoursesError] = useState<CourseRuntimeErrorKind | null>(
    null,
  );

  const [initialized, setInitialized] = useState(false);

  const [enrollmentPendingSlug, setEnrollmentPendingSlug] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<CourseRuntimeErrorKind | null>(null);

  const resetState = useCallback(() => {
    setCatalog([]);
    setCurrentCourses([]);
    setCatalogError(null);
    setCurrentCoursesError(null);
    setMutationError(null);
    setEnrollmentPendingSlug(null);
  }, []);

  const refreshCatalog = useCallback(async () => {
    if (!session) return;
    try {
      setCatalogLoading(true);
      setCatalogError(null);
      const data = await getCatalog();
      setCatalog(data);
    } catch (err: Error | unknown) {
      setCatalogError(err as CourseRuntimeErrorKind);
    } finally {
      setCatalogLoading(false);
    }
  }, [session]);

  const refreshCurrentCourses = useCallback(async () => {
    if (!session) return;
    try {
      setCurrentCoursesLoading(true);
      setCurrentCoursesError(null);
      const data = await getCurrentStudentCourses();
      setCurrentCourses(data);
    } catch (err: Error | unknown) {
      setCurrentCoursesError(err as CourseRuntimeErrorKind);
    } finally {
      setCurrentCoursesLoading(false);
    }
  }, [session]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshCatalog(), refreshCurrentCourses()]);
  }, [refreshCatalog, refreshCurrentCourses]);

  useEffect(() => {
    let mounted = true;

    if (!authInitialized) {
      if (mounted) {
        resetState();
      }
      return;
    }

    if (!session) {
      if (mounted) {
        resetState();
        setInitialized(true);
      }
      return;
    }

    if (mounted) {
      // deduplicate simultaneous initial refreshes conceptually handled by promise.all
      setInitialized(false);
      Promise.all([refreshCatalog(), refreshCurrentCourses()]).then(() => {
        if (mounted) {
          setInitialized(true);
        }
      });
    }

    return () => {
      mounted = false;
    };
  }, [authInitialized, session, refreshCatalog, refreshCurrentCourses, resetState]);

  const enroll = useCallback(
    async (slug: string) => {
      if (!session) return;
      if (enrollmentPendingSlug) return; // Prevent double submission

      try {
        setEnrollmentPendingSlug(slug);
        setMutationError(null);
        await enrollInCourse(slug);
        await refreshAll();
      } catch (err: Error | unknown) {
        setMutationError(err as CourseRuntimeErrorKind);
        throw err;
      } finally {
        setEnrollmentPendingSlug(null);
      }
    },
    [session, enrollmentPendingSlug, refreshAll],
  );

  const clearMutationError = useCallback(() => {
    setMutationError(null);
  }, []);

  return (
    <CourseRuntimeContext.Provider
      value={{
        catalog,
        currentCourses,
        catalogLoading,
        currentCoursesLoading,
        catalogError,
        currentCoursesError,
        initialized,
        refreshCatalog,
        refreshCurrentCourses,
        refreshAll,
        enroll,
        enrollmentPendingSlug,
        mutationError,
        clearMutationError,
      }}
    >
      {children}
    </CourseRuntimeContext.Provider>
  );
}
