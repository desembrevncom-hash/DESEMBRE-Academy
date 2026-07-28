import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PublicEmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  icon?: any;
}

export function PublicEmptyState({
  title,
  description,
  actionText = "Xem lịch khai giảng",
  actionHref = "/lich-khai-giang",
  icon: Icon = Calendar,
}: PublicEmptyStateProps) {
  return (
    <div className="text-center py-20 border border-slate-200/80 rounded-3xl bg-white p-8 shadow-sm space-y-4 max-w-xl mx-auto my-12">
      <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
        <Icon className="h-8 w-8" />
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">{title}</h2>

      <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
        {description}
      </p>

      <div className="pt-2">
        <Button asChild className="rounded-xl px-6 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20">
          <Link to={actionHref as any}>
            <ArrowLeft className="mr-2 w-4 h-4" />
            <span>{actionText}</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
