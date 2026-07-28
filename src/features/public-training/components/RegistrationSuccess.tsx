import { CheckCircle2, ArrowRight, PhoneCall, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RegistrationSuccessProps {
  batchTitle: string;
  onClose: () => void;
}

export function RegistrationSuccess({ batchTitle, onClose }: RegistrationSuccessProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gửi đăng ký thành công</span>
          </div>

          <h3 className="text-2xl font-extrabold text-slate-900 leading-tight">
            DESEMBRE Academy đã nhận đăng ký của bạn!
          </h3>

          <p className="text-sm text-slate-600 leading-relaxed pt-2">
            Cảm ơn bạn đã đăng ký tham gia lớp học{" "}
            <span className="font-bold text-slate-900">{batchTitle}</span>.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-500 space-y-2 text-left">
          <div className="font-semibold text-slate-700 flex items-center gap-1.5">
            <PhoneCall className="w-4 h-4 text-indigo-600" />
            <span>Các bước tiếp theo:</span>
          </div>
          <ul className="list-disc pl-4 space-y-1">
            <li>Hệ thống đã tự động lưu thông tin vào danh sách chờ xác nhận.</li>
            <li>Bộ phận tuyển sinh sẽ nhắn tin Zalo / gọi điện để xác nhận vị trí của bạn.</li>
            <li>Bạn sẽ nhận được lịch học chi tiết & tài liệu chuẩn bị.</li>
          </ul>
        </div>

        <Button
          onClick={onClose}
          className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-200"
        >
          <span>Hoàn tất & Đóng</span>
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
