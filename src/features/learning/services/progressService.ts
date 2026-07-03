const delay = <T,>(v: T, ms = 150): Promise<T> => new Promise((r) => setTimeout(() => r(v), ms));

export const progressService = {
  updateLessonProgress: (lessonId: string, completed: boolean) => delay({ lessonId, completed }),
};
