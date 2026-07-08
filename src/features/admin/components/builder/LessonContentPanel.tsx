import React from "react";
import type { AcademyAdminCourseEditor, AcademyAdminLesson } from "../../types";
import { ArticleContentEditor } from "./ArticleContentEditor";
import { ExternalLinkEditor } from "./ExternalLinkEditor";
import { MediaContentEditor } from "./MediaContentEditor";

interface LessonContentPanelProps {
  courseEditor: AcademyAdminCourseEditor;
  lessonId: string;
}

export function LessonContentPanel({ courseEditor, lessonId }: LessonContentPanelProps) {
  let activeLesson: AcademyAdminLesson | undefined;

  // Find the lesson in the course editor
  for (const module of courseEditor.modules) {
    const lesson = module.lessons.find((l) => l.id === lessonId);
    if (lesson) {
      activeLesson = lesson;
      break;
    }
  }

  if (!activeLesson) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-card border rounded-md">
        <h3 className="text-lg font-medium">Lesson not found</h3>
        <p className="text-sm text-muted-foreground mt-2">
          The selected lesson could not be found or may have been deleted.
        </p>
      </div>
    );
  }

  // Common properties
  const status = activeLesson.content_status || "missing";
  const courseId = courseEditor.course.id;

  switch (activeLesson.type) {
    case "article":
      return (
        <ArticleContentEditor
          courseId={courseId}
          lessonId={lessonId}
          initialContent={activeLesson.content?.markdown || ""}
        />
      );
    case "external_link":
      return (
        <ExternalLinkEditor
          courseId={courseId}
          lessonId={lessonId}
          initialUrl={activeLesson.content?.url || ""}
        />
      );
    case "video":
    case "document":
      return (
        <MediaContentEditor
          courseId={courseId}
          lessonId={lessonId}
          contentType={activeLesson.type}
          status={status}
        />
      );
    default:
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-card border rounded-md">
          <h3 className="text-lg font-medium text-destructive">Unsupported Lesson Type</h3>
          <p className="text-sm text-muted-foreground mt-2">
            The lesson type "{activeLesson.type}" is not supported in this version of the Content
            Studio.
          </p>
        </div>
      );
  }
}
