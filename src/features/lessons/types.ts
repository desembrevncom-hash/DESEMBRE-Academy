export type LessonContentState =
  | "NOT_FOUND"
  | "ACCESS_DENIED"
  | "CONTENT_NOT_CONFIGURED"
  | "AVAILABLE";

export type LessonContentKind = "article" | "video" | "document" | "external_link";

export interface BaseLessonContentPayload {
  kind: LessonContentKind;
}

export interface ArticleContentPayload extends BaseLessonContentPayload {
  kind: "article";
  markdown: string;
}

export interface MediaContentPayload extends BaseLessonContentPayload {
  kind: "video" | "document";
  media_ref: string;
  mime_type: string;
  original_filename: string;
}

export interface ExternalLinkContentPayload extends BaseLessonContentPayload {
  kind: "external_link";
  url: string;
}

export type LessonContentPayload =
  | ArticleContentPayload
  | MediaContentPayload
  | ExternalLinkContentPayload;

export type LessonProgressStatus = "not_started" | "in_progress" | "completed";

export interface LessonProgressPayload {
  status: LessonProgressStatus;
  progress_percent: number;
  last_position_seconds: number;
}

export interface AcademyLessonContentResponse {
  state: LessonContentState;
  course: {
    id: string;
    slug: string;
    title: string;
  };
  lesson: {
    id: string;
    title: string;
    description: string | null;
    type: string | null;
    duration: number | null;
    is_preview: boolean;
  };
  access: {
    can_learn: boolean;
    is_preview: boolean;
  };
  content: LessonContentPayload | null;
  progress: LessonProgressPayload | null;
}

export interface EdgeFunctionMediaResponse {
  signed_url: string;
  expires_in: number;
  mime_type: string;
  original_filename: string;
}
