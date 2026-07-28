import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { academyAdminCoursesApi } from "../services/academyAdminCoursesApi";
import type {
  AcademyCourseStatus,
  CreateAcademyCourseInput,
  UpdateAcademyCourseInput,
  CreateAcademyModuleInput,
  UpdateAcademyModuleInput,
  ReorderAcademyModulesInput,
  CreateAcademyLessonInput,
  UpdateAcademyLessonInput,
  ReorderAcademyLessonsInput,
  CreateAcademyCategoryInput,
  UpdateAcademyCategoryInput,
} from "../types";
import {
  SetAcademyArticleContentInput,
  SetAcademyExternalLinkContentInput,
  getCourseMarketingMetadata,
  upsertCourseMarketingMetadata,
} from "../services/academyAdminCoursesApi";
import type {
  UpsertAcademyCourseMarketingMetadataInput,
} from "../types";

export const academyAdminKeys = {
  all: ["admin", "courses"] as const,
  lists: () => [...academyAdminKeys.all, "list"] as const,
  list: (filters: { status?: AcademyCourseStatus; search?: string }) =>
    [...academyAdminKeys.lists(), filters] as const,
  editors: () => [...academyAdminKeys.all, "editor"] as const,
  editor: (courseId: string) => [...academyAdminKeys.editors(), courseId] as const,
  marketingMetadata: (courseId: string) => [...academyAdminKeys.all, "marketing-metadata", courseId] as const,
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

export function useAcademyAdminCategories() {
  return useQuery({
    queryKey: [...academyAdminKeys.all, "categories"] as const,
    queryFn: () => academyAdminCoursesApi.listCategories(),
    staleTime: 1000 * 60 * 60, // 1 hour for categories
  });
}

export function useAcademyAdminCategoryManager() {
  return useQuery({
    queryKey: [...academyAdminKeys.all, "categoryManager"] as const,
    queryFn: () => academyAdminCoursesApi.listCategoryManager(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateAcademyCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAcademyCategoryInput) => academyAdminCoursesApi.createCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...academyAdminKeys.all, "categories"] });
      queryClient.invalidateQueries({ queryKey: [...academyAdminKeys.all, "categoryManager"] });
      queryClient.invalidateQueries({ queryKey: academyAdminKeys.editors() });
    },
  });
}

export function useUpdateAcademyCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateAcademyCategoryInput) => academyAdminCoursesApi.updateCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...academyAdminKeys.all, "categories"] });
      queryClient.invalidateQueries({ queryKey: [...academyAdminKeys.all, "categoryManager"] });
      queryClient.invalidateQueries({ queryKey: academyAdminKeys.editors() });
      queryClient.invalidateQueries({ queryKey: academyAdminKeys.lists() });
    },
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

export function useCreateAcademyModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAcademyModuleInput) => academyAdminCoursesApi.createModule(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: academyAdminKeys.editor(variables.p_course_id) });
    },
  });
}

export function useUpdateAcademyModule(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateAcademyModuleInput) => academyAdminCoursesApi.updateModule(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academyAdminKeys.editor(courseId) });
    },
  });
}

export function useReorderAcademyModules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReorderAcademyModulesInput) => academyAdminCoursesApi.reorderModules(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: academyAdminKeys.editor(variables.p_course_id) });
    },
  });
}

export function useCreateAcademyLesson(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAcademyLessonInput) => academyAdminCoursesApi.createLesson(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academyAdminKeys.editor(courseId) });
    },
  });
}

export function useUpdateAcademyLesson(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateAcademyLessonInput) => academyAdminCoursesApi.updateLesson(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academyAdminKeys.editor(courseId) });
    },
  });
}

export function useReorderAcademyLessons(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReorderAcademyLessonsInput) => academyAdminCoursesApi.reorderLessons(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academyAdminKeys.editor(courseId) });
    },
  });
}

export function useSetAcademyArticleContent(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SetAcademyArticleContentInput) =>
      academyAdminCoursesApi.setArticleContent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academyAdminKeys.editor(courseId) });
    },
  });
}

export function useSetAcademyExternalLinkContent(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SetAcademyExternalLinkContentInput) =>
      academyAdminCoursesApi.setExternalLinkContent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academyAdminKeys.editor(courseId) });
    },
  });
}

export function usePublishAcademyCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => academyAdminCoursesApi.publishCourse(courseId),
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: academyAdminKeys.lists() });
      queryClient.invalidateQueries({ queryKey: academyAdminKeys.editor(courseId) });
    },
  });
}

export function useUnpublishAcademyCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => academyAdminCoursesApi.unpublishCourse(courseId),
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: academyAdminKeys.lists() });
      queryClient.invalidateQueries({ queryKey: academyAdminKeys.editor(courseId) });
    },
  });
}

export function useArchiveAcademyCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => academyAdminCoursesApi.archiveCourse(courseId),
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: academyAdminKeys.lists() });
      queryClient.invalidateQueries({ queryKey: academyAdminKeys.editor(courseId) });
    },
  });
}

export function useAcademyCourseMarketingMetadata(courseId: string) {
  return useQuery({
    queryKey: academyAdminKeys.marketingMetadata(courseId),
    queryFn: () => getCourseMarketingMetadata(courseId),
    enabled: !!courseId,
  });
}

export function useUpsertAcademyCourseMarketingMetadata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpsertAcademyCourseMarketingMetadataInput) => upsertCourseMarketingMetadata(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: academyAdminKeys.marketingMetadata(variables.p_course_id),
      });
      // Optionally invalidate public catalog keys if used globally
      queryClient.invalidateQueries({
        queryKey: ["public", "academy"],
      });
      queryClient.invalidateQueries({
        queryKey: academyAdminKeys.editors(),
      });
    },
  });
}
