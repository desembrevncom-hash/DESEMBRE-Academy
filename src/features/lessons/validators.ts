import { z } from "zod";

export const lessonContentStateSchema = z.enum([
  "NOT_FOUND",
  "ACCESS_DENIED",
  "CONTENT_NOT_CONFIGURED",
  "AVAILABLE",
]);

export const lessonContentKindSchema = z.enum(["article", "video", "document", "external_link"]);

const httpsUrlSchema = z
  .string()
  .url()
  .refine((val) => val.startsWith("https://"), {
    message: "External link must be HTTPS",
  });

export const articleContentSchema = z
  .object({
    kind: z.literal("article"),
    markdown: z.string().optional(),
    body: z.string().optional(),
  })
  .strict();

export const videoContentSchema = z
  .object({
    kind: z.literal("video"),
    media_ref: z.string().uuid(),
    mime_type: z.string().min(1),
    original_filename: z.string().nullable().optional(),
  })
  .strict();

export const documentContentSchema = z
  .object({
    kind: z.literal("document"),
    media_ref: z.string().uuid(),
    mime_type: z.string().min(1),
    original_filename: z.string().nullable().optional(),
  })
  .strict();

export const externalLinkContentSchema = z
  .object({
    kind: z.literal("external_link"),
    url: httpsUrlSchema,
  })
  .strict();

export const lessonContentPayloadSchema = z.discriminatedUnion("kind", [
  articleContentSchema,
  videoContentSchema,
  documentContentSchema,
  externalLinkContentSchema,
]).transform((val) => {
  if (val.kind === "article") {
    return {
      kind: "article" as const,
      markdown: (val as any).body || (val as any).markdown || "",
    };
  }
  return val;
});

export const lessonProgressStatusSchema = z.enum(["not_started", "in_progress", "completed"]);

export const lessonProgressPayloadSchema = z
  .object({
    status: lessonProgressStatusSchema,
    progress_percent: z.number().min(0).max(100).optional(),
    percent: z.number().min(0).max(100).optional(),
    last_position_seconds: z.number().min(0).nullable().optional(),
    last_position: z.number().min(0).nullable().optional(),
  })
  .transform((val) => ({
    status: val.status,
    progress_percent: val.progress_percent ?? val.percent ?? 0,
    last_position_seconds: val.last_position_seconds ?? val.last_position ?? null,
  }));

const baseResponseSchema = z.object({
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
  progress: lessonProgressPayloadSchema.nullable(),
});

export const academyLessonContentResponseSchema = z.discriminatedUnion("state", [
  z.object({
    state: z.literal("NOT_FOUND"),
  }).passthrough(),
  z.object({
    state: z.literal("ACCESS_DENIED"),
  }).passthrough(),
  baseResponseSchema
    .extend({
      state: z.literal("CONTENT_NOT_CONFIGURED"),
      content: z.null(),
    })
    .strict(),
  baseResponseSchema
    .extend({
      state: z.literal("AVAILABLE"),
      content: lessonContentPayloadSchema.nullable(),
    })
    .strict(),
]);

export const edgeFunctionMediaResponseSchema = z
  .object({
    signed_url: httpsUrlSchema,
    expires_in: z.number().int().positive(),
    mime_type: z.string().min(1),
    original_filename: z.string().nullable().optional(),
  })
  .strict();
