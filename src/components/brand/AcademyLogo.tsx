import { cn } from "@/lib/utils";
import { GraduationCap } from "lucide-react";

interface AcademyLogoProps {
  className?: string;
  variant?: "compact" | "normal";
}

export function AcademyLogo({ className, variant = "normal" }: AcademyLogoProps) {
  if (variant === "compact") {
    return (
      <div className={cn("grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground", className)}>
        <GraduationCap className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="grid h-9 w-9 md:h-10 md:w-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
        <GraduationCap className="h-5 w-5 md:h-5 md:w-5" />
      </div>
      <div className="leading-none flex flex-col justify-center">
        <div className="text-[14px] md:text-[15px] font-bold tracking-tight text-slate-900">DESEMBRE</div>
        <div className="text-[9px] md:text-[10px] font-semibold uppercase tracking-[0.12em] text-teal-600/80 mt-0.5">Training Center</div>
      </div>
    </div>
  );
}
