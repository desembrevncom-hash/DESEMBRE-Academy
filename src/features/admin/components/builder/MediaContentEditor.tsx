import React, { useState, useRef, useEffect } from "react";
import { useBlocker } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAcademyMediaUpload } from "../../hooks/useAcademyMediaUpload";
import { ContentTypeStatus } from "./ContentTypeStatus";
import { UploadCloud, File as FileIcon, X, AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { useCourseEditorRegistry } from "../../contexts/CourseEditorRegistry";

interface MediaContentEditorProps {
  courseId: string;
  lessonId: string;
  contentType: "video" | "document";
  status: "missing" | "configured" | "ready";
}

export function MediaContentEditor({
  courseId,
  lessonId,
  contentType,
  status,
}: MediaContentEditorProps) {
  const { state, progress, error, uploadFile, cancelUpload, reset } =
    useAcademyMediaUpload(courseId);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { setContentDirty, setActiveMutation, isReadOnly } = useCourseEditorRegistry();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear selected file if lesson changes
  useEffect(() => {
    setSelectedFile(null);
    reset();
  }, [lessonId, reset]);

  const maxBytes = contentType === "video" ? 1048576000 : 52428800;
  const maxSizeFormatted = contentType === "video" ? "1GB" : "50MB";
  const acceptedTypes = contentType === "video" ? "video/mp4,video/webm" : "application/pdf";

  const isUploading = ["validating", "requesting", "uploading", "finalizing", "canceling"].includes(
    state,
  );
  const hasUnsavedChanges = selectedFile !== null && state === "idle";

  useEffect(() => {
    setContentDirty(hasUnsavedChanges);
  }, [hasUnsavedChanges, setContentDirty]);

  useEffect(() => {
    setActiveMutation(isUploading);
  }, [isUploading, setActiveMutation]);

  useBlocker({
    shouldBlockFn: () => {
      if (isReadOnly) return false;
      if (isUploading) {
        return !window.confirm(
          "An upload is currently in progress. If you leave, the upload will be cancelled. Are you sure?",
        );
      }
      if (hasUnsavedChanges) {
        return !window.confirm(
          "You have selected a file but haven't uploaded it. Are you sure you want to leave?",
        );
      }
      return false;
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxBytes) {
      toast.error(`File is too large. Maximum size is ${maxSizeFormatted}.`);
      return;
    }

    // Check MIME type against accepted types roughly
    if (contentType === "video" && !file.type.startsWith("video/")) {
      toast.error("Please select a valid video file.");
      return;
    }
    if (contentType === "document" && file.type !== "application/pdf") {
      toast.error("Please select a valid PDF document.");
      return;
    }

    setSelectedFile(file);
    reset();
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    uploadFile({
      lessonId,
      contentType,
      file: selectedFile,
    });
  };

  const handleCancelFile = () => {
    if (isUploading) {
      cancelUpload();
    } else {
      setSelectedFile(null);
      reset();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="flex flex-col h-full bg-card border rounded-md p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium">Media Content</h3>
          <p className="text-sm text-muted-foreground">Upload the {contentType} for this lesson.</p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-muted px-3 py-1.5 rounded-full">
          <span>Status:</span>
          <ContentTypeStatus type={contentType} status={status} />
          <span className="capitalize">{status}</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Read Only Message */}
        {isReadOnly && (
          <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground border border-dashed">
            <Lock className="h-4 w-4 shrink-0" />
            <p>This course is archived. Media uploads are disabled.</p>
          </div>
        )}

        {/* Upload Area */}
        {(!selectedFile || state === "success" || state === "cancelled") && !isReadOnly && (
          <div className="border-2 border-dashed rounded-lg p-10 text-center hover:bg-muted/50 transition-colors">
            <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
            <div className="mb-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-primary font-medium hover:underline">Choose a file</span>
                <span className="text-muted-foreground"> or drag and drop</span>
                <input
                  id="file-upload"
                  ref={fileInputRef}
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept={acceptedTypes}
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              {contentType === "video" ? "MP4, WebM" : "PDF"} up to {maxSizeFormatted}
            </p>
          </div>
        )}

        {/* Selected File / Upload Progress */}
        {selectedFile && state !== "success" && state !== "cancelled" && (
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0">
                  <FileIcon className="h-6 w-6" />
                </div>
                <div className="truncate">
                  <p className="text-sm font-medium truncate" title={selectedFile.name}>
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</p>
                </div>
              </div>

              {!isUploading && (
                <button
                  onClick={handleCancelFile}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* State indicators */}
            {state === "error" && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error?.message || "Upload failed"}</p>
              </div>
            )}

            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="capitalize">{state}...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-200 ease-in-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              {state === "idle" && (
                <button
                  onClick={handleUpload}
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Start Upload
                </button>
              )}

              {state === "error" && (
                <button
                  onClick={handleUpload}
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Retry Upload
                </button>
              )}

              {isUploading && (
                <button
                  onClick={cancelUpload}
                  disabled={state === "canceling" || state === "finalizing"}
                  className="px-4 py-2 text-sm font-medium border hover:bg-muted rounded-md disabled:opacity-50"
                >
                  {state === "canceling" ? "Canceling..." : "Cancel Upload"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Success State */}
        {state === "success" && (
          <div className="border rounded-lg p-6 text-center space-y-3 bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-600 dark:text-green-500" />
            <h4 className="text-lg font-medium text-green-800 dark:text-green-400">
              Upload Complete
            </h4>
            <p className="text-sm text-green-600 dark:text-green-500/80">
              The media file has been successfully uploaded and processed.
            </p>
            {!isReadOnly && (
              <button
                onClick={() => {
                  reset();
                  setSelectedFile(null);
                }}
                className="mt-4 px-4 py-2 text-sm font-medium border border-green-200 dark:border-green-800 rounded-md hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
              >
                Upload a different file
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
