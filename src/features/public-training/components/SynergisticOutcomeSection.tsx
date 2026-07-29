import { CheckCircle2, Award, Zap, ShieldAlert, TrendingUp, ThumbsUp, Layers } from "lucide-react";

export function SynergisticOutcomeSection() {
  const outcomes = [
    {
      icon: Zap,
      title: "Hiểu logic phối hợp hoạt chất",
      description: "Nắm vững cơ chế cộng hưởng (synergy) giữa các nhóm dược mỹ phẩm trị liệu.",
    },
    {
      icon: Layers,
      title: "Xây dựng protocol chuẩn hóa",
      description: "Tự thiết kế phác đồ linh hoạt theo từng vấn đề da: sắc tố, mụn, lão hóa, phục hồi.",
    },
    {
      icon: ShieldAlert,
      title: "Tránh kích ứng & tác dụng phụ",
      description: "Nhận biết các cặp hoạt chất xung đột để phòng tránh bùng mụn hoặc tổn thương hàng rào da.",
    },
    {
      icon: TrendingUp,
      title: "Tối ưu hóa hiệu quả liệu trình",
      description: "Rút ngắn thời gian điều trị cho khách hàng và tăng tỷ lệ cải thiện lâm sàng.",
    },
    {
      icon: ThumbsUp,
      title: "Tư vấn khách hàng tự tin",
      description: "Giải thích cơ chế liệu trình chuyên nghiệp, tăng niềm tin và sự hài lòng của khách.",
    },
    {
      icon: Award,
      title: "Ứng dụng ngay vào Spa / Clinic",
      description: "Chuyển giao và triển khai ngay vào bảng menu dịch vụ để bứt phá doanh thu.",
    },
  ];

  return (
    <section className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/20 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-300">
          <Award className="w-4 h-4 text-amber-300" />
          <span>Giá trị thực tiễn</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          Bạn sẽ học được gì sau khóa học?
        </h2>
        <p className="text-xs sm:text-sm text-indigo-200/80">
          6 năng lực cốt lõi giúp bạn chuẩn hóa tay nghề và phát triển dịch vụ chuyên nghiệp.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {outcomes.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm space-y-2 hover:bg-white/15 transition-colors"
            >
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-indigo-300" />
                </div>
                <span>{item.title}</span>
              </div>
              <p className="text-xs text-indigo-200/70 leading-relaxed pl-9">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
