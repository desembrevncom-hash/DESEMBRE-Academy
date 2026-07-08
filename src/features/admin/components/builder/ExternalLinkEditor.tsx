import React, { useState, useEffect } from "react";
import { useBlocker } from "@tanstack/react-router";
import { toast } from "sonner";
import { useSetAcademyExternalLinkContent } from "../../hooks/useAcademyAdminCourses";

interface ExternalLinkEditorProps {
  courseId: string;
  lessonId: string;
  initialUrl: string;
}

export function ExternalLinkEditor({ courseId, lessonId, initialUrl }: ExternalLinkEditorProps) {
  const [url, setUrl] = useState(initialUrl);

  const setExternalLink = useSetAcademyExternalLinkContent(courseId);

  useEffect(() => {
    setUrl(initialUrl);
  }, [lessonId, initialUrl]);

  const isDirty = url !== initialUrl;

  useBlocker({
    shouldBlockFn: () => {
      if (isDirty && !setExternalLink.isPending) {
        return !window.confirm(
          "You have unsaved changes to the external link. Are you sure you want to leave?",
        );
      }
      return false;
    },
  });

  const validateUrl = (testUrl: string): boolean => {
    try {
      const parsed = new URL(testUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateUrl(url)) {
      toast.error("Please enter a valid HTTP or HTTPS URL.");
      return;
    }

    try {
      await setExternalLink.mutateAsync({
        p_lesson_id: lessonId,
        p_url: url,
      });
      toast.success("External link saved successfully");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save external link");
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm("Discard unsaved changes?")) {
        setUrl(initialUrl);
      }
    } else {
      setUrl(initialUrl);
    }
  };

  const isValidUrl = validateUrl(url);

  return (
    <div className="flex flex-col h-full bg-card border rounded-md overflow-hidden p-6">
      <h3 className="text-lg font-medium mb-4">External Link Content</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Provide a link to an external resource for this lesson. Students will be directed to this
        URL when accessing the lesson.
      </p>

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        <div className="space-y-2">
          <label htmlFor="url" className="text-sm font-medium">
            URL
          </label>
          <div className="flex gap-2">
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/resource"
              className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              required
            />
            {isValidUrl && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium border px-4 py-2 hover:bg-muted"
                title="Open link in new tab"
              >
                Test Link
              </a>
            )}
          </div>
          {url && !isValidUrl && (
            <p className="text-sm text-destructive">URL must start with http:// or https://</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!isDirty || !isValidUrl || setExternalLink.isPending}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 disabled:opacity-50"
          >
            {setExternalLink.isPending ? "Saving..." : "Save Link"}
          </button>

          {isDirty && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={setExternalLink.isPending}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium border hover:bg-muted px-4 py-2 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
