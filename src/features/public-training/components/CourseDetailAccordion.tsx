import { useState, useImperativeHandle, forwardRef } from "react";
import { PublicSessionInfo } from "../services/publicTrainingApi";
import { SessionTimeline } from "./SessionTimeline";
import {
  CalendarDays,
  BookOpen,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  PhoneCall,
  MessageSquare,
  Award,
  Users,
} from "lucide-react";

interface CourseDetailAccordionProps {
  description: string | null;
  sessions: PublicSessionInfo[];
}

export interface CourseDetailAccordionRef {
  openSchedule: () => void;
}

export const CourseDetailAccordion = forwardRef<
  CourseDetailAccordionRef,
  CourseDetailAccordionProps
>(({ description, sessions }, ref) => {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    schedule: false,
    courseInfo: true,
    policy: false,
  });

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useImperativeHandle(ref, () => ({
    openSchedule: () => {
      setOpenItems((prev) => ({ ...prev, schedule: true }));
      const el = document.getElementById("accordion-schedule");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    },
  }));

  return (
    <div className="space-y-4">
      {/* Accordion Item 1: Lịch học chi tiết */}
      <div
        id="accordion-schedule"
        className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-2xs transition-all"
      >
        <button
          onClick={() => toggleItem("schedule")}
          className="w-full p-5 sm:p-6 flex items-center justify-between gap-4 text-left hover:bg-slate-50/80 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold text-slate-900">
                Lịch học chi tiết ({sessions?.length || 0} buổi)
              </h4>
              <p className="text-xs text-slate-500">
                Thời gian, nội dung và hình thức của từng buổi học
              </p>
            </div>
          </div>

          <div
            className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 transition-transform duration-200 ${
              openItems.schedule ? "rotate-180 bg-indigo-100 text-indigo-700" : ""
            }`}
          >
            <ChevronDown className="w-4 h-4" />
          </div>
        </button>

        {openItems.schedule && (
          <div className="px-5 pb-6 sm:px-6 border-t border-slate-100 pt-4">
            <SessionTimeline sessions={sessions} />
          </div>
        )}
      </div>

      {/* Accordion Item 2: Thông tin khóa học */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-2xs transition-all">
        <button
          onClick={() => toggleItem("courseInfo")}
          className="w-full p-5 sm:p-6 flex items-center justify-between gap-4 text-left hover:bg-slate-50/80 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold text-slate-900">
                Thông tin & Giá trị khóa học
              </h4>
              <p className="text-xs text-slate-500">
                Mô tả chi tiết, giá trị nổi bật và đối tượng phù hợp
              </p>
            </div>
          </div>

          <div
            className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 transition-transform duration-200 ${
              openItems.courseInfo ? "rotate-180 bg-indigo-100 text-indigo-700" : ""
            }`}
          >
            <ChevronDown className="w-4 h-4" />
          </div>
        </button>

        {openItems.courseInfo && (
          <div className="px-5 pb-6 sm:px-6 border-t border-slate-100 pt-4 space-y-6">
            {/* Description */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Mô tả khóa học
              </h5>
              {description ? (
                <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                  {description}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Nội dung khóa học được xây dựng chuẩn y khoa Hàn Quốc bởi giảng viên DESEMBRE Academy.
                </p>
              )}
            </div>

            {/* Key Highlights Grid */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Giá trị nổi bật</span>
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
                    <Award className="w-4 h-4 text-indigo-600" />
                    <span>Chuẩn Y Khoa Hàn Quốc</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Giáo trình cập nhật theo tiêu chuẩn thẩm mỹ hàng đầu Châu Á.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Thực hành 80% thời lượng</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Cầm tay chỉ việc trực tiếp dưới sự hướng dẫn của giảng viên.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Hỗ trợ sản phẩm DESEMBRE</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Miễn phí dụng cụ và Dược mỹ phẩm chính hãng trong suốt buổi học.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Cấp chứng nhận hoàn thành</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Tăng uy tín nghề nghiệp và cơ hội nâng cao thu nhập cho học viên.
                  </p>
                </div>
              </div>
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Đối tượng phù hợp
              </h5>
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Kỹ thuật viên Spa/Thẩm mỹ viện muốn nâng cao tay nghề chuẩn chuyên sâu.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Chủ Spa/Salon muốn cập nhật liệu trình mới và chuẩn hóa quy trình chăm sóc khách hàng.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Người mới bắt đầu đam mê ngành thẩm mỹ da liễu.</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Accordion Item 3: Chính sách đăng ký & hỗ trợ */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-2xs transition-all">
        <button
          onClick={() => toggleItem("policy")}
          className="w-full p-5 sm:p-6 flex items-center justify-between gap-4 text-left hover:bg-slate-50/80 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold text-slate-900">
                Chính sách đăng ký & Hỗ trợ học viên
              </h4>
              <p className="text-xs text-slate-500">
                Quy trình xác nhận, kênh tư vấn và quyền lợi học viên
              </p>
            </div>
          </div>

          <div
            className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 transition-transform duration-200 ${
              openItems.policy ? "rotate-180 bg-indigo-100 text-indigo-700" : ""
            }`}
          >
            <ChevronDown className="w-4 h-4" />
          </div>
        </button>

        {openItems.policy && (
          <div className="px-5 pb-6 sm:px-6 border-t border-slate-100 pt-4 space-y-4 text-xs sm:text-sm text-slate-600">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Quy trình xác nhận đăng ký</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-600">
                Sau khi gửi thông tin thành công, chuyên viên tư vấn DESEMBRE Academy sẽ liên hệ trực tiếp qua Zalo/SĐT đã đăng ký trong vòng 24h làm việc để hoàn tất thủ tục xếp lớp.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl border border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">Hỗ trợ Zalo OA</div>
                  <div className="text-[11px] text-slate-500">Nhận thông báo lịch học tự động</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">Hotline Đào tạo</div>
                  <div className="text-[11px] text-slate-500">Tư vấn trực tiếp 24/7</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
