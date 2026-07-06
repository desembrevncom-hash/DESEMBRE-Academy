import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { lessonContentService } from "./services/lesson-content.service";
import { useAuth } from "@/features/auth/useAuth";

export function useLessonContent({
  courseSlug,
  lessonId,
  enabled,
}: {
  courseSlug: string;
  lessonId: string;
  enabled: boolean;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Clear query cache for this specific lesson when user logs out or changes
  useEffect(() => {
    if (!user) {
      queryClient.removeQueries({ queryKey: ["lesson-content"] });
    }
  }, [user, queryClient]);

  return useQuery({
    queryKey: ["lesson-content", courseSlug, lessonId, user?.id],
    queryFn: () => lessonContentService.getLessonContent(courseSlug, lessonId),
    enabled: !!courseSlug && !!lessonId && !!user && enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
