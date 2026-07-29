import { ShieldCheck, CheckCircle2, Headphones, Sparkles } from "lucide-react";

export function SynergisticTrustSection() {
  const trustPoints = [
    {
      icon: CheckCircle2,
      title: "Chuẩn hóa tư vấn & chỉ định",
      description: "Tự tin giải thích cơ chế phối hợp hoạt chất, giúp khách hàng hiểu rõ giá trị liệu trình và an tâm trị liệu.",
      badge: "Chuẩn Y Khoa",
    },
    {
      icon: ShieldCheck,
      title: "Tối ưu hiệu quả liệu trình",
      description: "Áp dụng phác đồ chuẩn Hàn Quốc giúp rút ngắn thời gian điều trị và nâng cao tỷ lệ hài lòng của khách hàng.",
      badge: "Nâng tầm Spa",
    },
    {
      icon: Headphones,
      title: "Đồng hành & Hỗ trợ triển khai",
      description: "Được hỗ trợ trực tiếp bởi chuyên gia đào tạo DESEMBRE Academy trong việc chuyển giao quy trình cho nhân sự.",
      badge: "Hỗ trợ 24/7",
    },
  ];

  return (
    <section className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Cam kết chất lượng</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          Thiết kế cho ứng dụng thực tế tại Spa / Clinic
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Chương trình không chỉ dừng ở lý thuyết mà tập trung chuyển giao giải pháp vận hành dịch vụ thực tế.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {trustPoints.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/40 transition-all space-y-3 flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-400/20">
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
