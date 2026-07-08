import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useBlocker } from "@tanstack/react-router";
import { toast } from "sonner";
import { useSetAcademyArticleContent } from "../../hooks/useAcademyAdminCourses";
import { useCourseEditorRegistry } from "../../contexts/CourseEditorRegistry";

interface ArticleContentEditorProps {
  courseId: string;
  lessonId: string;
  initialContent: string;
}

export function ArticleContentEditor({
  courseId,
  lessonId,
  initialContent,
}: ArticleContentEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isPreview, setIsPreview] = useState(false);
  const { setContentDirty, setActiveMutation, isReadOnly } = useCourseEditorRegistry();

  const setArticleContent = useSetAcademyArticleContent(courseId);

  // Reset when lesson changes
  useEffect(() => {
    setContent(initialContent);
    setIsPreview(false);
  }, [lessonId, initialContent]);

  const isDirty = content !== initialContent;

  useEffect(() => {
    setContentDirty(isDirty);
  }, [isDirty, setContentDirty]);

  useEffect(() => {
    setActiveMutation(setArticleContent.isPending);
  }, [setArticleContent.isPending, setActiveMutation]);

  // Read-only override for preview
  useEffect(() => {
    if (isReadOnly) {
      setIsPreview(true);
    }
  }, [isReadOnly]);

  useBlocker({
    shouldBlockFn: () => {
      if (isDirty && !setArticleContent.isPending && !isReadOnly) {
        return !window.confirm("You have unsaved article changes. Are you sure you want to leave?");
      }
      return false;
    },
  });

  const handleSave = async () => {
    try {
      await setArticleContent.mutateAsync({
        p_lesson_id: lessonId,
        p_markdown: content, // preserve intentional whitespace
      });
      toast.success("Article saved successfully");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save article");
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm("Discard unsaved changes?")) {
        setContent(initialContent);
      }
    } else {
      setContent(initialContent);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border rounded-md overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/30">
        <div className="flex items-center gap-2">
          {!isReadOnly && (
            <button
              onClick={() => setIsPreview(false)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                !isPreview
                  ? "bg-background shadow-sm border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Edit
            </button>
          )}
          <button
            onClick={() => setIsPreview(true)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              isPreview
                ? "bg-background shadow-sm border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Preview
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground mr-2">{content.length} chars</span>
          {!isReadOnly && (
            <>
              {isDirty && (
                <button
                  onClick={handleCancel}
                  disabled={setArticleContent.isPending}
                  className="px-3 py-1.5 text-sm font-medium hover:bg-muted rounded-md transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!isDirty || setArticleContent.isPending}
                className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {setArticleContent.isPending ? "Saving..." : "Save Article"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto min-h-[400px]">
        {isPreview ? (
          <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                a: ({ node, ...props }) => {
                  const isJavascript = props.href?.trim().toLowerCase().startsWith("javascript:");
                  if (isJavascript) {
                    return <span className="text-red-500 line-through">Blocked Script Link</span>;
                  }
                  return (
                    <a {...props} target="_blank" rel="noopener noreferrer">
                      {props.children}
                    </a>
                  );
                },
              }}
            >
              {content || "*No content yet*"}
            </ReactMarkdown>
          </div>
        ) : !isReadOnly ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isReadOnly}
            className="w-full h-full min-h-[400px] resize-none border-0 focus:ring-0 p-0 bg-transparent disabled:opacity-50"
            placeholder="Write your article in Markdown..."
          />
        ) : null}
      </div>
    </div>
  );
}
