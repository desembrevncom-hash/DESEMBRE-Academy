import { courses, getCourseBySlug } from "@/data/courses";
import { categories } from "@/data/categories";
import { instructors } from "@/data/instructors";
import type { Course } from "@/types";

const delay = <T,>(v: T, ms = 200): Promise<T> => new Promise((r) => setTimeout(() => r(v), ms));

export const courseService = {
  getPublishedCourses: () => delay(courses),
  getFeaturedCourses: () => delay(courses.filter((c) => c.featured)),
  getCourseBySlug: (slug: string) => delay(getCourseBySlug(slug)),
  getCategories: () => delay(categories),
  getInstructor: (id: string) => delay(instructors.find((i) => i.id === id)),
  getRelated: (course: Course) =>
    delay(courses.filter((c) => c.categoryId === course.categoryId && c.id !== course.id).slice(0, 3)),
};
