import { z } from "zod";

export const createCourseResponseSchema = z.object({
  id: z.string().uuid(),
});

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const academyAdminCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
});

export const categoryFormSchema = z.object({
  name: z.string().min(2, "Tên danh mục phải có ít nhất 2 ký tự").max(255, "Tên danh mục quá dài").trim(),
  slug: z
    .string()
    .min(2, "Slug phải có ít nhất 2 ký tự")
    .max(255, "Slug quá dài")
    .regex(slugRegex, "Slug chỉ được chứa chữ cái thường, số và dấu gạch ngang"),
  description: z.string().max(2000, "Mô tả quá dài").trim().optional().nullable(),
  status: z.enum(["draft", "published", "archived"]),
});

export type CategoryFormData = z.infer<typeof categoryFormSchema>;

export const createCourseSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title is too long").trim(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(255, "Slug is too long")
    .regex(slugRegex, "Slug must contain only lowercase letters, numbers, and single hyphens"),
  description: z.string().max(2000, "Description is too long").trim().optional().nullable(),
  category_id: z.preprocess((val) => val === "" ? null : val, z.string().uuid("Invalid category").optional().nullable()),
  catalog_visibility: z.enum(["public", "unlisted", "private"]),
  enrollment_policy: z.enum(["open", "approval_required", "closed"]),
  access_policy: z.enum(["free", "paid", "dynamic"]),
  pricing_model: z.enum(["free", "one_time", "subscription", "included"]),
});

export type CreateCourseFormData = z.infer<typeof createCourseSchema>;

export const updateCourseSchema = createCourseSchema.extend({
  // Override defaults to ensure they are required during update
  catalog_visibility: z.enum(["public", "unlisted", "private"]),
  enrollment_policy: z.enum(["open", "approval_required", "closed"]),
  access_policy: z.enum(["free", "paid", "dynamic"]),
  pricing_model: z.enum(["free", "one_time", "subscription", "included"]),
});

export type UpdateCourseFormData = z.infer<typeof updateCourseSchema>;

export const createModuleResponseSchema = z.object({
  id: z.string().uuid(),
  position: z.number(),
});

export const createLessonResponseSchema = z.object({
  id: z.string().uuid(),
  position: z.number(),
});

export const moduleSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title is too long").trim(),
});

export type ModuleFormData = z.infer<typeof moduleSchema>;

export const lessonSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title is too long").trim(),
  type: z.enum(["article", "video", "document", "external_link"]),
  description: z.string().max(2000, "Description is too long").trim().optional().nullable(),
  is_preview: z.boolean().default(false),
});

export type LessonFormData = z.infer<typeof lessonSchema>;

// M6B.3 Response Schemas

export const basicSuccessResponseSchema = z.any().transform(() => ({ success: true }));

export const requestUploadResponseSchema = z
  .object({
    uploadSessionId: z.string().uuid(),
    uploadUrl: z.string().url(),
    expiresIn: z.number().positive(),
    mimeType: z.string(),
    maxSizeBytes: z.number().positive(),
  })
  .strict()
  .refine(
    (data) => {
      const keys = Object.keys(data as Record<string, unknown>);
      const forbidden = [
        "storage_path",
        "storage_bucket",
        "object_path",
        "access_token",
        "refresh_token",
        "service_role",
      ];
      return !forbidden.some((f) => keys.includes(f));
    },
    { message: "Response contains forbidden private fields" },
  );

export const mediaActionResponseSchema = z.any().transform(() => ({ success: true }));

export const safeMediaErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

// M6B.4 Response Schemas
export const courseStatusMutationResponseSchema = z
  .object({
    success: z.literal(true),
  })
  .strict();

export const marketingFormSchema = z.object({
  level: z.enum(['basic', 'intermediate', 'advanced']).nullable().optional(),
  short_description: z.string().max(500, "MA' t ngn khA'ng ?c v>t quA 500 kA t").nullable().optional(),
  estimated_minutes: z.number().positive("Thi l?ng phi lA s dng").nullable().optional(),
  is_featured: z.boolean().default(false),
  featured_order: z.number().int().default(0),
  audience_text: z.string().nullable().optional(),
  outcomes_text: z.string().nullable().optional(),
  thumbnail_url: z.union([z.string().url("URL không hợp lệ"), z.string().length(0)]).nullable().optional(),
  thumbnail_alt: z.string().max(200, "Alt text quá dài").nullable().optional(),
  seo_title: z.string().max(70, "SEO Title tối đa 70 ký tự").nullable().optional(),
  seo_description: z.string().max(170, "SEO Description tối đa 170 ký tự").nullable().optional(),
});

export type MarketingFormData = z.infer<typeof marketingFormSchema>;
