const delay = <T>(v: T, ms = 300): Promise<T> => new Promise((r) => setTimeout(() => r(v), ms));

export const enrollmentService = {
  requestEnrollment: (courseId: string) => delay({ courseId, status: "pending" as const }),
};
