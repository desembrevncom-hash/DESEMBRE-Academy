import { Users, Building2, Stethoscope, MessageSquare, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SynergisticAudienceSectionProps {
  onScrollToSchedule: () => void;
  onOpenConsult: () => void;
}

export function SynergisticAudienceSection({ onScrollToSchedule, onOpenConsult }: SynergisticAudienceSectionProps) {
  const audiences = [
    {
      icon: Building2,
      title: "Chủ Spa / Clinic",
      description: "Muốn chuẩn hóa quy trình dịch vụ, xây dựng phác đồ điều trị độc quyền và nâng tầm uy tín cơ sở.",
      color: "bg-blue-50 border-blue-100 text-blue-600",
    },
    {
      icon: Stethoscope,
      title: "Kỹ thuật viên Spa",
      description: "Cần nâng cấp tư duy chỉ định, làm chủ kỹ thuật phối hợp hoạt chất chuẩn Y Khoa và xử lý ca khó.",
      color: "bg-indigo-50 border-indigo-100 text-indigo-600",
    },
    {
      icon: MessageSquare,
      title: "Đội ngũ tư vấn",
      description: "Muốn hiểu rõ cơ chế hoạt chất, giải thích logic phác đồ minh bạch để chốt liệu trình tự tin hơn.",
      color: "bg-amber-50 border-amber-100 text-amber-600",
    },
    {
      icon: Sparkles,
      title: "Đối tác DESEMBRE",
      description: "Muốn tối ưu hóa hiệu quả mỹ phẩm DESEMBRE chính hãng, nâng cao tỷ lệ khách hàng quay lại.",
      color: "bg-emerald-50 border-emerald-100 text-emerald-600",
    },
  ];

  return (
    <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600">
          <Users className="w-4 h-4" />
          <span>Đối tượng học viên</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Khóa học này dành cho ai?
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Chương trình được thiết kế chuyên biệt cho từng nhóm đối tượng làm nghề Spa & Thẩm mỹ da liễu.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {audiences.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-100 transition-all space-y-2 group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${item.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Section CTA Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 text-center sm:text-left">
        <span className="text-xs text-slate-500 font-medium">Bạn thuộc nhóm đối tượng trên?</span>
        <div className="flex flex-wrap items-center justify-center gap-2.5 w-full sm:w-auto">
          <Button
            onClick={onScrollToSchedule}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto h-10 rounded-xl text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <span>Xem lớp đang mở</span>
            <ArrowRight className="ml-1 w-3.5 h-3.5" />
          </Button>
          <Button
            onClick={onOpenConsult}
            size="sm"
            className="w-full sm:w-auto h-10 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          >
            Nhận tư vấn trước
          </Button>
        </div>
      </div>
    </section>
  );
}
