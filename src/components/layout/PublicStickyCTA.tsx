import { MessageSquare, ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PublicStickyCTAProps {
  primaryLabel?: string;
  onPrimaryClick: () => void;
  onConsultClick?: () => void;
}

export function PublicStickyCTA({
  primaryLabel = "Đăng ký học",
  onPrimaryClick,
  onConsultClick,
}: PublicStickyCTAProps) {
  const handleConsult = () => {
    if (onConsultClick) {
      onConsultClick();
    } else {
      // Default open Zalo / hotline link
      window.open("https://zalo.me", "_blank");
    }
  };

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-2xl flex items-center gap-2.5 antialiased">
      <Button
        onClick={handleConsult}
        variant="outline"
        className="h-12 px-4 rounded-xl text-xs font-bold border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 flex items-center justify-center gap-1.5 shrink-0"
      >
        <MessageSquare className="w-4 h-4 text-indigo-600" />
        <span>Tư vấn</span>
      </Button>

      <Button
        onClick={onPrimaryClick}
        className="flex-1 h-12 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
      >
        <span>{primaryLabel}</span>
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
