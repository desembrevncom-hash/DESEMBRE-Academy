import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  requestUploadResponseSchema,
  mediaActionResponseSchema,
  safeMediaErrorResponseSchema,
} from "../validators";

export class AdminMediaApiError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "AdminMediaApiError";
  }
}

export interface RequestUploadInput {
  lessonId: string;
  contentType: "video" | "document";
  mimeType: string;
  sizeBytes: number;
  originalFilename: string;
}

export interface RequestUploadResponse {
  uploadSessionId: string;
  uploadUrl: string;
  expiresIn: number;
  mimeType: string;
  maxSizeBytes: number;
}

export const academyAdminMediaUploadApi = {
  async requestUpload(input: RequestUploadInput): Promise<RequestUploadResponse> {
    const client = getSupabaseBrowserClient();
    if (!client) throw new Error("Supabase client not available");

    const {
      data: { session },
    } = await client.auth.getSession();
    if (!session) throw new AdminMediaApiError("UNAUTHORIZED", "Not authenticated");

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/academy-admin-media-upload`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: "request_upload",
          ...input,
        }),
      },
    );

    if (!response.ok) {
      let errorData;
      try {
        const rawJson = await response.json();
        errorData = safeMediaErrorResponseSchema.parse(rawJson);
      } catch {
        throw new AdminMediaApiError("NETWORK_ERROR", "Failed to request upload");
      }
      throw new AdminMediaApiError(errorData.error.code, errorData.error.message);
    }

    try {
      const rawData = await response.json();
      return requestUploadResponseSchema.parse(rawData);
    } catch {
      throw new AdminMediaApiError(
        "INVALID_RESPONSE",
        "Invalid request upload response from server",
      );
    }
  },

  async finalizeUpload(uploadSessionId: string): Promise<{ success: boolean }> {
    const client = getSupabaseBrowserClient();
    if (!client) throw new Error("Supabase client not available");

    const {
      data: { session },
    } = await client.auth.getSession();
    if (!session) throw new AdminMediaApiError("UNAUTHORIZED", "Not authenticated");

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/academy-admin-media-upload`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: "finalize_upload",
          uploadSessionId,
        }),
      },
    );

    if (!response.ok) {
      let errorData;
      try {
        const rawJson = await response.json();
        errorData = safeMediaErrorResponseSchema.parse(rawJson);
      } catch {
        throw new AdminMediaApiError("NETWORK_ERROR", "Failed to finalize upload");
      }
      throw new AdminMediaApiError(errorData.error.code, errorData.error.message);
    }

    try {
      const rawData = await response.json();
      return mediaActionResponseSchema.parse(rawData);
    } catch {
      throw new AdminMediaApiError("INVALID_RESPONSE", "Invalid finalize upload response");
    }
  },

  async cancelUpload(uploadSessionId: string): Promise<{ success: boolean }> {
    const client = getSupabaseBrowserClient();
    if (!client) throw new Error("Supabase client not available");

    const {
      data: { session },
    } = await client.auth.getSession();
    if (!session) throw new AdminMediaApiError("UNAUTHORIZED", "Not authenticated");

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/academy-admin-media-upload`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: "cancel_upload",
          uploadSessionId,
        }),
      },
    );

    if (!response.ok) {
      let errorData;
      try {
        const rawJson = await response.json();
        errorData = safeMediaErrorResponseSchema.parse(rawJson);
      } catch {
        throw new AdminMediaApiError("NETWORK_ERROR", "Failed to cancel upload");
      }
      throw new AdminMediaApiError(errorData.error.code, errorData.error.message);
    }

    try {
      const rawData = await response.json();
      return mediaActionResponseSchema.parse(rawData);
    } catch {
      throw new AdminMediaApiError("INVALID_RESPONSE", "Invalid cancel upload response");
    }
  },

  async uploadBytes(
    uploadUrl: string,
    file: File,
    onProgress?: (progress: number) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open("PUT", uploadUrl, true);
      // Ensure the content-type matches exactly what was signed, which is the file type.
      xhr.setRequestHeader("Content-Type", file.type);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(
            new AdminMediaApiError("UPLOAD_FAILED", `Upload failed with status ${xhr.status}`),
          );
        }
      };

      xhr.onerror = () =>
        reject(new AdminMediaApiError("NETWORK_ERROR", "Network error during upload"));
      xhr.onabort = () => reject(new AdminMediaApiError("ABORTED", "Upload aborted"));
      xhr.ontimeout = () => reject(new AdminMediaApiError("TIMEOUT", "Upload timed out"));

      if (signal) {
        signal.addEventListener("abort", () => {
          xhr.abort();
        });
      }

      xhr.send(file);
    });
  },
};
