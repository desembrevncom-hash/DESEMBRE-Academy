import { Link } from "@tanstack/react-router";
import { CheckCircle2, ArrowRight, PhoneCall, Sparkles, Home, Info, CreditCard, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AcademyOrder } from "../services/ordersApi";
import { getPaymentConfig } from "@/config/payment";
import { useState } from "react";

interface RegistrationSuccessProps {
  batchTitle: string;
  isDuplicate?: boolean;
  courseSlug?: string;
  order?: AcademyOrder | null;
  onClose: () => void;
}

export function RegistrationSuccess({ batchTitle, isDuplicate, courseSlug, order, onClose }: RegistrationSuccessProps) {
  const paymentConfig = getPaymentConfig();
  const [copied, setCopied] = useState(false);

  const handleCopyContent = () => {
    if (order?.bank_transfer_content) {
      navigator.clipboard.writeText(order.bank_transfer_content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto shadow-inner ${
          isDuplicate ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
        }`}>
          {isDuplicate ? <Info className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
        </div>

        <div className="space-y-1.5">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            isDuplicate ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isDuplicate ? "Thông tin đăng ký" : order ? "Ghi nhận đơn đăng ký khóa học" : "Đã nhận đăng ký giữ chỗ"}</span>
          </div>

          <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
            {isDuplicate
              ? "Bạn đã đăng ký lớp học này trước đó!"
              : order
              ? "Đăng ký thành công! Vui lòng hoàn tất thanh toán"
              : "Đã nhận đăng ký giữ chỗ thành công!"}
          </h3>

          <p className="text-xs text-slate-600 leading-relaxed">
            {isDuplicate ? (
              <>
                Bạn đã đăng ký giữ chỗ lớp <span className="font-bold text-slate-900">{batchTitle}</span> trước đó. DESEMBRE Training Center sẽ liên hệ xác nhận qua Zalo/SĐT.
              </>
            ) : order ? (
              <>
                Vui lòng chuyển khoản theo hướng dẫn bên dưới để bộ phận Admin xác nhận đơn hàng và kích hoạt quyền học viên cho số điện thoại của bạn.
              </>
            ) : (
              <>
                Cảm ơn bạn đã đăng ký tham gia lớp <span className="font-bold text-slate-900">{batchTitle}</span>. DESEMBRE Training Center sẽ liên hệ xác nhận qua Zalo/điện thoại.
              </>
            )}
          </p>
        </div>

        {/* Payment Instruction Box for Orders */}
        {order && (
          <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-left text-xs space-y-3 text-indigo-950">
            <div className="font-bold text-indigo-900 flex items-center gap-1.5 border-b border-indigo-200/80 pb-2">
              <CreditCard className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>HƯỚNG DẪN CHUYỂN KHOẢN KÍCH HOẠT QUYỀN HỌC</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Số tiền:</span>
                <span className="font-extrabold text-indigo-700 text-sm">{order.amount.toLocaleString("vi-VN")} VNĐ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ngân hàng:</span>
                <span className="font-bold text-slate-900">{paymentConfig.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số tài khoản:</span>
                <span className="font-bold text-slate-900 font-mono text-sm">{paymentConfig.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Chủ tài khoản:</span>
                <span className="font-bold text-slate-900">{paymentConfig.accountName}</span>
              </div>
              
              <div className="pt-2 border-t border-indigo-200/80">
                <span className="text-slate-500 block mb-1">Nội dung chuyển khoản:</span>
                <div className="p-2.5 rounded-xl bg-white border border-indigo-200 flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-indigo-700 text-sm">{order.bank_transfer_content}</span>
                  <button
                    type="button"
                    onClick={handleCopyContent}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors shrink-0 flex items-center gap-1"
                  >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Đã chép" : "Sao chép"}</span>
                  </button>
                </div>
              </div>
            </div>

            <a
              href={paymentConfig.supportZalo}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs gap-1.5 shadow-sm transition-colors"
            >
              <span>Gửi ảnh biên lai qua Zalo Hỗ Trợ</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Standard Next Steps if not paid order */}
        {!order && (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-600 space-y-2 text-left">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Các bước tiếp theo:</span>
            </div>
            <ol className="list-decimal pl-4 space-y-1 text-slate-600">
              <li>Bộ phận tư vấn DESEMBRE Training Center sẽ kiểm tra thông tin.</li>
              <li>Bạn sẽ nhận xác nhận qua Zalo hoặc điện thoại trong thời gian sớm nhất.</li>
              <li>Vui lòng giữ liên lạc để nhận thông tin lớp học.</li>
            </ol>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <Button
            asChild
            className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20"
          >
            <Link to="/lich-khai-giang" onClick={onClose}>
              <span>Xem lịch khai giảng khác</span>
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>

          {courseSlug ? (
            <Button
              asChild
              variant="outline"
              className="w-full h-10 rounded-xl text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-50"
            >
              <Link to="/khoa-hoc/$slug" params={{ slug: courseSlug }} onClick={onClose}>
                <span>Quay lại trang khóa học</span>
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              variant="ghost"
              className="w-full h-10 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              <Link to="/" onClick={onClose}>
                <Home className="mr-1.5 w-3.5 h-3.5" />
                <span>Về trang chủ</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
