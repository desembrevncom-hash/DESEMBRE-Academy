import { Video, MapPin, MonitorPlay, Calendar } from "lucide-react";

export const FORMAT_OPTIONS = [
  { id: "ALL", label: "Tất cả hình thức", icon: Calendar },
  { id: "office", label: "Văn phòng (Offline)", icon: MapPin },
  { id: "zoom", label: "Zoom Online", icon: Video },
  { id: "hybrid", label: "Hybrid", icon: MonitorPlay },
  { id: "external_seminar", label: "Seminar ngoài", icon: Calendar },
];
