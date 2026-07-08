import { useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  academyAdminMediaUploadApi,
  type RequestUploadInput,
} from "../services/academyAdminMediaUploadApi";
import { academyAdminKeys } from "./useAcademyAdminCourses";

export type UploadState =
  | "idle"
  | "validating"
  | "requesting"
  | "uploading"
  | "finalizing"
  | "success"
  | "canceling"
  | "cancelled"
  | "error";

export function useAcademyMediaUpload(courseId: string) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [uploadSessionId, setUploadSessionId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setState("idle");
    setProgress(0);
    setError(null);
    setUploadSessionId(null);
    abortControllerRef.current = null;
  }, []);

  const uploadFile = useCallback(
    async (input: Omit<RequestUploadInput, "sizeBytes" | "originalFilename"> & { file: File }) => {
      if (state !== "idle" && state !== "error" && state !== "cancelled") {
        return; // prevent duplicate submission
      }

      try {
        setState("validating");
        setError(null);
        setProgress(0);

        const maxBytes = input.contentType === "video" ? 1048576000 : 52428800; // 1GB or 50MB
        if (input.file.size > maxBytes) {
          throw new Error(`File is too large. Maximum size is ${maxBytes / 1024 / 1024}MB.`);
        }
        if (input.file.size === 0) {
          throw new Error("File is empty.");
        }

        setState("requesting");
        const requestRes = await academyAdminMediaUploadApi.requestUpload({
          lessonId: input.lessonId,
          contentType: input.contentType,
          mimeType: input.file.type || input.mimeType,
          sizeBytes: input.file.size,
          originalFilename: input.file.name,
        });

        setUploadSessionId(requestRes.uploadSessionId);

        setState("uploading");

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        await academyAdminMediaUploadApi.uploadBytes(
          requestRes.uploadUrl,
          input.file,
          setProgress,
          abortController.signal,
        );

        setState("finalizing");
        await academyAdminMediaUploadApi.finalizeUpload(requestRes.uploadSessionId);

        setState("success");

        // Invalidate the course editor query so content status updates
        queryClient.invalidateQueries({ queryKey: academyAdminKeys.editor(courseId) });
      } catch (err: unknown) {
        if (err instanceof Error && err.message === "Upload aborted") {
          setState("cancelled");
        } else {
          setState("error");
          setError(err instanceof Error ? err : new Error("An unexpected error occurred."));
        }
      } finally {
        abortControllerRef.current = null;
      }
    },
    [state, courseId, queryClient],
  );

  const cancelUpload = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (uploadSessionId && state !== "finalizing" && state !== "success") {
      setState("canceling");
      try {
        await academyAdminMediaUploadApi.cancelUpload(uploadSessionId);
        setState("cancelled");
        setUploadSessionId(null);
      } catch (err) {
        // Even if cancel API fails, we treat local state as cancelled
        setState("cancelled");
        setUploadSessionId(null);
      }
    } else {
      setState("cancelled");
    }
  }, [uploadSessionId, state]);

  return {
    state,
    progress,
    error,
    uploadFile,
    cancelUpload,
    reset,
  };
}
