import { useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";

export function SynergisticFaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "Khóa học phù hợp với người mới bắt đầu không?",
      a: "Khóa học được thiết kế có hệ thống từ tư duy nền tảng đến ứng dụng nâng cao, do đó cả người mới vào nghề lẫn KTV/Chủ Spa lâu năm đều dễ dàng tiếp thu và chuẩn hóa phác đồ.",
    },
    {
      q: "Có bắt buộc phải đang sử dụng mỹ phẩm DESEMBRE tại Spa không?",
      a: "Không bắt buộc. Tư duy phối hợp hoạt chất (Synergistic Protocol) mang tính ứng dụng tổng quan trong da liễu thẩm mỹ. Tuy nhiên, việc áp dụng trên dòng sản phẩm DESEMBRE chính hãng sẽ giúp tối ưu hóa hiệu quả thực tế nhanh nhất.",
    },
    {
      q: "Học theo hình thức Online có được cấp tài liệu chuẩn không?",
      a: "Có. Tất cả học viên đăng ký tham gia đều được cấp bộ tài liệu bài giảng e-book và file sơ đồ phác đồ chuẩn hóa do DESEMBRE Academy biên soạn.",
    },
    {
      q: "Sau khi gửi đăng ký trên website, bao lâu sẽ nhận được xác nhận?",
      a: "Tư vấn viên của DESEMBRE Academy sẽ liên hệ trực tiếp qua Zalo / Số điện thoại trong vòng 24 giờ làm việc để xác nhận thông tin và hướng dẫn xếp lớp.",
    },
    {
      q: "Sau khóa học có được hỗ trợ tư vấn phác đồ khi gặp ca khó không?",
      a: "Có. Học viên sẽ được tham gia nhóm Zalo hỗ trợ chuyên môn trực tiếp cùng đội ngũ giảng viên và chuyên gia đào tạo DESEMBRE Academy.",
    },
  ];

  return (
    <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600">
          <HelpCircle className="w-4 h-4" />
          <span>Giải đáp thắc mắc</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Câu hỏi thường gặp (FAQ)
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Giải đáp các câu hỏi phổ biến trước khi đăng ký tham gia khóa đào tạo.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="border border-slate-200/80 rounded-2xl overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors font-bold text-sm sm:text-base text-slate-900"
              >
                <span>{faq.q}</span>
                <div
                  className={`w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180 bg-indigo-100 text-indigo-700" : ""
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 border-t border-slate-100 pt-3 text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/50">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
