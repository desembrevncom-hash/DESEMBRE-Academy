import { Video, MapPin, Users, Calendar, Award } from "lucide-react";

export interface TrainingFormatMeta {
  label: string;
  shortLabel: string;
  colorClass: string;
  badgeClass: string;
  icon: any;
}

export function getTrainingFormatMeta(formatInput: string | null | undefined): TrainingFormatMeta {
  const fmt = (formatInput || "").toLowerCase().trim();

  if (fmt.includes("zoom") || fmt.includes("online")) {
    return {
      label: "Online Zoom",
      shortLabel: "Zoom",
      colorClass: "sky",
      badgeClass: "bg-sky-50 text-sky-800 border-sky-200/90 font-bold",
      icon: Video,
    };
  }

  if (fmt.includes("office") || fmt.includes("offline") || fmt.includes("person") || fmt.includes("hands")) {
    return {
      label: "Học tại văn phòng",
      shortLabel: "Offline",
      colorClass: "amber",
      badgeClass: "bg-amber-50 text-amber-900 border-amber-200/90 font-bold",
      icon: MapPin,
    };
  }

  if (fmt.includes("hybrid")) {
    return {
      label: "Đào tạo Hybrid",
      shortLabel: "Hybrid",
      colorClass: "purple",
      badgeClass: "bg-purple-50 text-purple-900 border-purple-200/90 font-bold",
      icon: Users,
    };
  }

  if (fmt.includes("seminar")) {
    return {
      label: "Seminar ngoài",
      shortLabel: "Seminar",
      colorClass: "emerald",
      badgeClass: "bg-emerald-50 text-emerald-900 border-emerald-200/90 font-bold",
      icon: Calendar,
    };
  }

  return {
    label: "Đào tạo Chuyên sâu",
    shortLabel: "Khóa học",
    colorClass: "slate",
    badgeClass: "bg-slate-50 text-slate-800 border-slate-200 font-bold",
    icon: Award,
  };
}

/**
 * Smart batch title display helper (Requirement 3).
 * De-duplicates batch title if it repeats course title or is an auto-generated redundant string.
 */
export function getCleanBatchDisplayTitle(
  batchTitle: string | undefined | null,
  courseTitle: string | undefined | null,
  startDateStr?: string | null
): string {
  if (!batchTitle) return "";
  
  const bTitle = batchTitle.trim();
  const cTitle = (courseTitle || "").trim();

  // Extract core course keyword if available
  const coreKeyword = cTitle.replace(/^(chuyên đề|khóa học|chương trình)[:\s]*/i, "").trim();

  // Check if batchTitle contains courseTitle or coreKeyword
  const isRedundant = cTitle && (
    bTitle.toLowerCase().includes(cTitle.toLowerCase()) ||
    (coreKeyword.length > 3 && bTitle.toLowerCase().includes(coreKeyword.toLowerCase()))
  );

  if (isRedundant || bTitle.length > 40) {
    return startDateStr ? `Khóa khai giảng ngày ${startDateStr}` : "Lớp khai giảng chuẩn Y Khoa";
  }

  return bTitle;
}
