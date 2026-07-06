import { z } from "zod";
import { LessonContentState, LessonContentKind, LessonProgressStatus } from "./types";

export const lessonContentStateSchema = z.enum([
  "NOT_FOUND",
  "ACCESS_DENIED",
  "CONTENT_NOT_CONFIGURED",
  "AVAILABLE",
]);

export const lessonContentKindSchema = z.enum(["article", "video", "document", "external_link"]);

export const articleContentSchema = z
  .object({
    kind: z.literal("article"),
    markdown: z.string(),
  })
  .strict();

export const mediaContentSchema = z
  .object({
    kind: z.enum(["video", "document"]),
    media_ref: z.string().uuid(),
    mime_type: z.string(),
    original_filename: z.string().nullable().optional(),
  })
  .strict()
  .refine(
    (data: Record<string, unknown>) => {
      return (
        !("bucket" in data) &&
        !("path" in data) &&
        !("storage_bucket" in data) &&
        !("storage_path" in data) &&
        !("service_role" in data) &&
        !("service_role_key" in data)
      );
    },
    { message: "Payload contains protected storage attributes" },
  );

export const externalLinkContentSchema = z
  .object({
    kind: z.literal("external_link"),
    url: z
      .string()
      .url()
      .refine((val) => val.startsWith("https://"), {
        message: "External link must be HTTPS",
      }),
  })
  .strict();

export const lessonContentPayloadSchema = z.discriminatedUnion("kind", [
  articleContentSchema,
  mediaContentSchema,
  externalLinkContentSchema,
]);

export const lessonProgressStatusSchema = z.enum(["not_started", "in_progress", "completed"]);

export const lessonProgressPayloadSchema = z
  .object({
    status: lessonProgressStatusSchema,
    progress_percent: z.number().min(0).max(100),
    last_position_seconds: z.number().min(0),
  })
  .strict();

export const academyLessonContentResponseSchema = z
  .object({
    state: lessonContentStateSchema,
    course: z
      .object({
        id: z.string().uuid(),
        slug: z.string(),
        title: z.string(),
      })
      .strict(),
    lesson: z
      .object({
        id: z.string().uuid(),
        title: z.string(),
        description: z.string().nullable(),
        type: z.string().nullable(),
        duration: z.number().nullable(),
        is_preview: z.boolean(),
      })
      .strict(),
    access: z
      .object({
        can_learn: z.boolean(),
        is_preview: z.boolean(),
      })
      .strict(),
    content: lessonContentPayloadSchema.nullable(),
    progress: lessonProgressPayloadSchema.nullable(),
  })
  .strict();

export const edgeFunctionMediaResponseSchema = z
  .object({
    signed_url: z.string().url(),
    expires_in: z.number().refine((val) => val === 300, {
      message: "Expires in must be exactly 300",
    }),
    mime_type: z.string(),
    original_filename: z.string().nullable().optional(),
  })
  .strict()
  .refine(
    (data: Record<string, unknown>) => {
      return (
        !("bucket" in data) &&
        !("path" in data) &&
        !("storage_bucket" in data) &&
        !("storage_path" in data) &&
        !("service_role" in data) &&
        !("service_role_key" in data)
      );
    },
    { message: "Edge function response leaked bucket or path" },
  );
