import { Video, MapPin, Users, Calendar, Award } from "lucide-react";

export interface TrainingFormatMeta {
  label: string;
  shortLabel: string;
  colorClass: string;
  cardBorderClass: string;
  badgeClass: string;
  dateBoxClass: string;
  icon: any;
}

export function getTrainingFormatMeta(formatInput: string | null | undefined): TrainingFormatMeta {
  const fmt = (formatInput || "").toLowerCase().trim();

  if (fmt.includes("zoom") || fmt.includes("online")) {
    return {
      label: "ONLINE ZOOM",
      shortLabel: "Zoom",
      colorClass: "sky",
      cardBorderClass: "border-l-4 border-l-sky-500 hover:border-l-sky-600",
      badgeClass: "bg-sky-600 text-white border-sky-600 shadow-xs font-extrabold uppercase tracking-wider",
      dateBoxClass: "bg-gradient-to-b from-sky-500 to-sky-600 text-white border-sky-600 shadow-sm",
      icon: Video,
    };
  }

  if (fmt.includes("office") || fmt.includes("offline") || fmt.includes("person") || fmt.includes("hands")) {
    return {
      label: "HỌC TẠI VĂN PHÒNG",
      shortLabel: "Offline",
      colorClass: "amber",
      cardBorderClass: "border-l-4 border-l-amber-500 hover:border-l-amber-600",
      badgeClass: "bg-amber-600 text-white border-amber-600 shadow-xs font-extrabold uppercase tracking-wider",
      dateBoxClass: "bg-gradient-to-b from-amber-500 to-amber-600 text-white border-amber-600 shadow-sm",
      icon: MapPin,
    };
  }

  if (fmt.includes("hybrid")) {
    return {
      label: "HYBRID (ZOOM + OFFLINE)",
      shortLabel: "Hybrid",
      colorClass: "purple",
      cardBorderClass: "border-l-4 border-l-purple-500 hover:border-l-purple-600",
      badgeClass: "bg-purple-600 text-white border-purple-600 shadow-xs font-extrabold uppercase tracking-wider",
      dateBoxClass: "bg-gradient-to-b from-purple-500 to-purple-600 text-white border-purple-600 shadow-sm",
      icon: Users,
    };
  }

  if (fmt.includes("seminar")) {
    return {
      label: "SEMINAR NGOÀI",
      shortLabel: "Seminar",
      colorClass: "emerald",
      cardBorderClass: "border-l-4 border-l-emerald-500 hover:border-l-emerald-600",
      badgeClass: "bg-emerald-600 text-white border-emerald-600 shadow-xs font-extrabold uppercase tracking-wider",
      dateBoxClass: "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white border-emerald-600 shadow-sm",
      icon: Calendar,
    };
  }

  return {
    label: "ĐÀO TẠO CHUYÊN SÂU",
    shortLabel: "Khóa học",
    colorClass: "indigo",
    cardBorderClass: "border-l-4 border-l-indigo-500 hover:border-l-indigo-600",
    badgeClass: "bg-indigo-600 text-white border-indigo-600 shadow-xs font-extrabold uppercase tracking-wider",
    dateBoxClass: "bg-gradient-to-b from-indigo-600 to-indigo-700 text-white border-indigo-700 shadow-sm",
    icon: Award,
  };
}

/**
 * Smart batch title display helper.
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
    return startDateStr ? `Lớp khai giảng ngày ${startDateStr}` : "Lớp khai giảng mới";
  }

  return bTitle;
}
