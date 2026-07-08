import { z } from "zod";

export const createCourseResponseSchema = z.object({
  id: z.string().uuid(),
});

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createCourseSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title is too long").trim(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(255, "Slug is too long")
    .regex(slugRegex, "Slug must contain only lowercase letters, numbers, and single hyphens"),
  description: z.string().max(2000, "Description is too long").trim().optional().nullable(),
  category_id: z.string().uuid("Invalid category").optional().nullable(),
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
