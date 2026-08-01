import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LandingStickyCTAProps {
  title: string;
  hasPublicBatch: boolean;
  onOpenRegister: () => void;
  onOpenConsult: () => void;
}

export function LandingStickyCTA({
  title,
  hasPublicBatch,
  onOpenRegister,
  onOpenConsult,
}: LandingStickyCTAProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md border-t border-white/10 shadow-2xl sm:hidden">
      <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block truncate">
            {hasPublicBatch ? "Đang mở đăng ký" : "Thông báo lịch mới"}
          </span>
          <h4 className="text-xs font-bold text-white truncate">{title}</h4>
        </div>

        <Button
          onClick={hasPublicBatch ? onOpenRegister : onOpenConsult}
          className="h-11 px-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/30 gap-1.5 shrink-0"
        >
          <span>{hasPublicBatch ? "Đăng ký ngay" : "Nhận thông báo"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
