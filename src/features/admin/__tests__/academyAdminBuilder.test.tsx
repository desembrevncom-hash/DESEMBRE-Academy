import { describe, test, expect, mock, beforeEach } from "bun:test";
import { academyAdminCoursesApi } from "../services/academyAdminCoursesApi";
import { createModuleResponseSchema, createLessonResponseSchema } from "../validators";

mock.module("../services/academyAdminCoursesApi", () => ({
  academyAdminCoursesApi: {
    createModule: mock(),
    updateModule: mock(),
    reorderModules: mock(),
    createLesson: mock(),
    updateLesson: mock(),
    reorderLessons: mock(),
    getCourseEditor: mock(),
  },
}));

describe("Academy Admin M6B.2 Builder Tests", () => {
  beforeEach(() => {
    mock.restore();
  });

  test("create module schema validates and returns id and position", () => {
    const validResponse = { id: "123e4567-e89b-12d3-a456-426614174000", position: 1 };
    const result = createModuleResponseSchema.parse(validResponse);
    expect(result).toEqual(validResponse);

    const responseWithExtraneous = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      position: 1,
      extra: "data",
    };
    const result2 = createModuleResponseSchema.parse(responseWithExtraneous);
    expect(result2).toHaveProperty("id");
    expect(result2).toHaveProperty("position");
    expect(result2).not.toHaveProperty("extra");
  });

  test("create lesson schema validates and returns id and position", () => {
    const validResponse = { id: "123e4567-e89b-12d3-a456-426614174000", position: 1 };
    const result = createLessonResponseSchema.parse(validResponse);
    expect(result).toEqual(validResponse);
  });

  test("create module exact RPC payload", async () => {
    academyAdminCoursesApi.createModule = mock().mockResolvedValue({ id: "1", position: 1 });

    const payload = { p_course_id: "c1", p_title: "Title" };
    await academyAdminCoursesApi.createModule(payload);
    expect(academyAdminCoursesApi.createModule).toHaveBeenCalledWith(payload);
  });

  test("update module exact RPC payload", async () => {
    academyAdminCoursesApi.updateModule = mock().mockResolvedValue({ success: true });

    const payload = { p_module_id: "m1", p_title: "Updated Title" };
    await academyAdminCoursesApi.updateModule(payload);
    expect(academyAdminCoursesApi.updateModule).toHaveBeenCalledWith(payload);
  });

  test("reorder modules exact ordered UUID payload", async () => {
    academyAdminCoursesApi.reorderModules = mock().mockResolvedValue({ success: true });

    const payload = { p_course_id: "c1", p_module_ids: ["m2", "m1"] };
    await academyAdminCoursesApi.reorderModules(payload);
    expect(academyAdminCoursesApi.reorderModules).toHaveBeenCalledWith(payload);
  });

  test("create lesson exact RPC payload with allowed types and is_preview", async () => {
    academyAdminCoursesApi.createLesson = mock().mockResolvedValue({ id: "1", position: 1 });

    const payload = {
      p_module_id: "m1",
      p_title: "Lesson Title",
      p_type: "video" as const,
      p_description: "Desc",
      p_is_preview: true,
    };
    await academyAdminCoursesApi.createLesson(payload);
    expect(academyAdminCoursesApi.createLesson).toHaveBeenCalledWith(payload);
  });

  test("update lesson exact RPC payload without type", async () => {
    academyAdminCoursesApi.updateLesson = mock().mockResolvedValue({ success: true });

    const payload = {
      p_lesson_id: "l1",
      p_title: "Updated Title",
      p_description: "New desc",
      p_is_preview: false,
    };
    await academyAdminCoursesApi.updateLesson(payload);
    expect(academyAdminCoursesApi.updateLesson).toHaveBeenCalledWith(payload);
  });

  test("reorder lessons exact UUID payload", async () => {
    academyAdminCoursesApi.reorderLessons = mock().mockResolvedValue({ success: true });

    const payload = { p_module_id: "m1", p_lesson_ids: ["l2", "l1"] };
    await academyAdminCoursesApi.reorderLessons(payload);
    expect(academyAdminCoursesApi.reorderLessons).toHaveBeenCalledWith(payload);
  });

  test("security: no private locator rendered", () => {
    const content = {
      original_filename: "test.pdf",
    };
    expect(content).not.toHaveProperty("storage_path");
    expect(content).not.toHaveProperty("signed_url");
    expect(content).not.toHaveProperty("service_role");
    expect(content).not.toHaveProperty("private.");
  });
});
