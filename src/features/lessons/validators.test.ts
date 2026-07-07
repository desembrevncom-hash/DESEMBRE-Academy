import { test, expect } from "bun:test";
import {
  academyLessonContentResponseSchema,
  edgeFunctionMediaResponseSchema,
  lessonContentPayloadSchema,
} from "./validators";

test("1. Valid Article payload parses", () => {
  const result = lessonContentPayloadSchema.safeParse({
    kind: "article",
    markdown: "# Hello",
  });
  expect(result.success).toBe(true);
});

test("2. Valid Video payload parses", () => {
  const result = lessonContentPayloadSchema.safeParse({
    kind: "video",
    media_ref: "123e4567-e89b-12d3-a456-426614174000",
    mime_type: "video/mp4",
  });
  expect(result.success).toBe(true);
});

test("3. Valid Document payload parses", () => {
  const result = lessonContentPayloadSchema.safeParse({
    kind: "document",
    media_ref: "123e4567-e89b-12d3-a456-426614174000",
    mime_type: "application/pdf",
  });
  expect(result.success).toBe(true);
});

test("4. Valid HTTPS external-link payload parses", () => {
  const result = lessonContentPayloadSchema.safeParse({
    kind: "external_link",
    url: "https://example.com",
  });
  expect(result.success).toBe(true);
});

test("5. Payload containing storage_path is rejected", () => {
  const result = lessonContentPayloadSchema.safeParse({
    kind: "video",
    media_ref: "123e4567-e89b-12d3-a456-426614174000",
    mime_type: "video/mp4",
    storage_path: "secret/path.mp4",
  });
  expect(result.success).toBe(false);
});

test("6. Payload containing storage_bucket is rejected", () => {
  const result = lessonContentPayloadSchema.safeParse({
    kind: "video",
    media_ref: "123e4567-e89b-12d3-a456-426614174000",
    mime_type: "video/mp4",
    storage_bucket: "private-bucket",
  });
  expect(result.success).toBe(false);
});

test("7. Payload containing path or bucket is rejected", () => {
  const result1 = lessonContentPayloadSchema.safeParse({
    kind: "video",
    media_ref: "123e4567-e89b-12d3-a456-426614174000",
    mime_type: "video/mp4",
    path: "secret.mp4",
  });
  expect(result1.success).toBe(false);

  const result2 = lessonContentPayloadSchema.safeParse({
    kind: "video",
    media_ref: "123e4567-e89b-12d3-a456-426614174000",
    mime_type: "video/mp4",
    bucket: "private",
  });
  expect(result2.success).toBe(false);
});

test("8. javascript: external URL is rejected", () => {
  const result = lessonContentPayloadSchema.safeParse({
    kind: "external_link",
    url: "javascript:alert(1)",
  });
  expect(result.success).toBe(false);
});

test("9. Signed-media response with expires_in 300 parses", () => {
  const result = edgeFunctionMediaResponseSchema.safeParse({
    signed_url: "https://example.com/video.mp4",
    expires_in: 300,
    mime_type: "video/mp4",
  });
  expect(result.success).toBe(true);
});

test("10. Signed-media response containing storage_path is rejected", () => {
  const result = edgeFunctionMediaResponseSchema.safeParse({
    signed_url: "https://example.com/video.mp4",
    expires_in: 300,
    mime_type: "video/mp4",
    storage_path: "secret.mp4",
  });
  expect(result.success).toBe(false);
});
