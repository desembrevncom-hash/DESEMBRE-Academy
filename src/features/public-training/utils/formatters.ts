import { format, parseISO } from "date-fns";
import { Video, MapPin, MonitorPlay, Calendar } from "lucide-react";

export interface FormatBadgeConfig {
  label: string;
  icon: any;
  cls: string;
}

export function getFormatConfig(type: string | null): FormatBadgeConfig {
  const configs: Record<string, FormatBadgeConfig> = {
    zoom: {
      label: "Zoom Online",
      icon: Video,
      cls: "bg-sky-50 text-sky-700 border-sky-200/80",
    },
    office: {
      label: "Văn phòng (Offline)",
      icon: MapPin,
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    },
    hybrid: {
      label: "Hybrid",
      icon: MonitorPlay,
      cls: "bg-purple-50 text-purple-700 border-purple-200/80",
    },
    external_seminar: {
      label: "Seminar ngoài",
      icon: Calendar,
      cls: "bg-amber-50 text-amber-700 border-amber-200/80",
    },
  };

  const key = (type || "").toLowerCase();
  return configs[key] || {
    label: type || "Offline",
    icon: Calendar,
    cls: "bg-slate-100 text-slate-700 border-slate-200",
  };
}

export function formatDateSafe(dateStr: string | null, formatPattern: string = "dd/MM/yyyy"): string {
  if (!dateStr) return "Chưa xác định";
  try {
    return format(parseISO(dateStr), formatPattern);
  } catch (e) {
    return dateStr;
  }
}

export function formatDateTimeSafe(dateStr: string | null): string {
  return formatDateSafe(dateStr, "dd/MM/yyyy HH:mm");
}

export function formatTimeRange(startsAt: string | null, endsAt: string | null): string {
  if (!startsAt) return "";
  try {
    const start = format(parseISO(startsAt), "HH:mm");
    const end = endsAt ? format(parseISO(endsAt), "HH:mm") : "";
    return end ? `${start} – ${end}` : start;
  } catch (e) {
    return "";
  }
}

export function getInitials(fullName: string): string {
  if (!fullName) return "DA";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
