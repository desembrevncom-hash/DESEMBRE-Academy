import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { academyAdminCoursesApi } from "../services/academyAdminCoursesApi";
import type {
  AcademyCourseStatus,
  CreateAcademyCourseInput,
  UpdateAcademyCourseInput,
} from "../types";

export const academyAdminKeys = {
  all: ["admin", "courses"] as const,
  lists: () => [...academyAdminKeys.all, "list"] as const,
  list: (filters: { status?: AcademyCourseStatus; search?: string }) =>
    [...academyAdminKeys.lists(), filters] as const,
  editors: () => [...academyAdminKeys.all, "editor"] as const,
  editor: (courseId: string) => [...academyAdminKeys.editors(), courseId] as const,
};

export function useAcademyAdminCourses(
  filters: { status?: AcademyCourseStatus; search?: string },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: academyAdminKeys.list(filters),
    queryFn: () => academyAdminCoursesApi.listCourses(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: options?.enabled,
  });
}

export function useAcademyAdminCourseEditor(courseId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: academyAdminKeys.editor(courseId),
    queryFn: () => academyAdminCoursesApi.getCourseEditor(courseId),
    staleTime: 1000 * 60 * 5,
    enabled: options?.enabled,
  });
}

export function useCreateAcademyCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAcademyCourseInput) => academyAdminCoursesApi.createCourse(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academyAdminKeys.lists() });
    },
  });
}

export function useUpdateAcademyCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateAcademyCourseInput) => academyAdminCoursesApi.updateCourse(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: academyAdminKeys.lists() });
      queryClient.invalidateQueries({ queryKey: academyAdminKeys.editor(variables.p_course_id) });
    },
  });
}
