import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ArrowRight, PhoneCall, Sparkles, Home, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RegistrationSuccessProps {
  batchTitle: string;
  isDuplicate?: boolean;
  onClose: () => void;
}

export function RegistrationSuccess({ batchTitle, isDuplicate, onClose }: RegistrationSuccessProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-inner ${
          isDuplicate ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
        }`}>
          {isDuplicate ? <Info className="w-10 h-10" /> : <CheckCircle2 className="w-10 h-10" />}
        </div>

        <div className="space-y-2">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            isDuplicate ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isDuplicate ? "Thông tin đăng ký" : "Đăng ký thành công"}</span>
          </div>

          <h3 className="text-2xl font-extrabold text-slate-900 leading-tight">
            {isDuplicate
              ? "Bạn đã đăng ký lớp học này trước đó!"
              : "DESEMBRE Training Center đã nhận thông tin đăng ký của bạn!"}
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
            {isDuplicate ? (
              <>
                Bạn đã đăng ký lớp <span className="font-bold text-slate-900">{batchTitle}</span> rồi. DESEMBRE Training Center sẽ liên hệ xác nhận qua Zalo/điện thoại.
              </>
            ) : (
              <>
                Cảm ơn bạn đã đăng ký tham gia lớp học{" "}
                <span className="font-bold text-slate-900">{batchTitle}</span>.{" "}
                Tư vấn viên DESEMBRE Training Center sẽ liên hệ xác nhận qua Zalo/SĐT trong thời gian sớm nhất.
              </>
            )}
          </p>
        </div>

        {/* Next steps checklist */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-600 space-y-2.5 text-left">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <PhoneCall className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Các bước tiếp theo:</span>
          </div>

          <ol className="list-decimal pl-4 space-y-1.5 text-slate-600">
            <li>Bộ phận tư vấn DESEMBRE Training Center sẽ kiểm tra thông tin.</li>
            <li>Bạn sẽ nhận xác nhận qua Zalo hoặc điện thoại trong thời gian sớm nhất.</li>
            <li>Vui lòng giữ liên lạc để hoàn tất vị trí và nhận tài liệu chuẩn bị.</li>
          </ol>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-2">
          <Button
            onClick={onClose}
            className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-lg shadow-indigo-600/20"
          >
            <span>Quay lại lịch khai giảng</span>
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>

          <Button
            asChild
            variant="ghost"
            className="w-full h-10 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <Link to="/">
              <Home className="mr-1.5 w-3.5 h-3.5" />
              <span>Về trang chủ</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
