import React from "react";
import { FileText, Video, File, Link2, AlertCircle, CheckCircle2 } from "lucide-react";

interface ContentTypeStatusProps {
  type: "article" | "video" | "document" | "external_link";
  status: "missing" | "configured" | "ready";
}

export function ContentTypeStatus({ type, status }: ContentTypeStatusProps) {
  let Icon = FileText;
  let label = "Article";

  if (type === "video") {
    Icon = Video;
    label = "Video";
  } else if (type === "document") {
    Icon = File;
    label = "Document";
  } else if (type === "external_link") {
    Icon = Link2;
    label = "External Link";
  }

  let StatusIcon = AlertCircle;
  let statusColor = "text-yellow-500";
  let statusText = "Action Required";

  if (status === "ready") {
    StatusIcon = CheckCircle2;
    statusColor = "text-green-500";
    statusText = "Ready";
  } else if (status === "configured") {
    StatusIcon = CheckCircle2;
    statusColor = "text-blue-500";
    statusText = "Configured";
  } else if (status === "missing") {
    StatusIcon = AlertCircle;
    statusColor = "text-destructive";
    statusText = "Missing Content";
  }

  return (
    <div className="flex items-center gap-4 text-sm border rounded-md p-3 bg-muted/50">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium">{label}</span>
      </div>
      <div className={`flex items-center gap-1.5 ml-auto ${statusColor}`}>
        <StatusIcon className="w-4 h-4" />
        <span className="text-xs font-semibold">{statusText}</span>
      </div>
    </div>
  );
}
