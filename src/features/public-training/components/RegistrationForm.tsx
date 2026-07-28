import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PublicCourseBatch, submitPublicCourseRegistration } from "../services/publicTrainingApi";
import { X, Loader2, Calendar, MapPin, ShieldCheck, User, Phone, Mail } from "lucide-react";
import { format, parseISO } from "date-fns";

const registrationSchema = z.object({
  fullName: z.string().min(2, "Họ và tên phải có ít nhất 2 ký tự"),
  phone: z
    .string()
    .regex(/^(0[3|5|7|8|9])+([0-9]{8})$/, "Số điện thoại Việt Nam không hợp lệ (VD: 0912345678)"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  notes: z.string().optional(),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

interface RegistrationFormProps {
  batch: PublicCourseBatch;
  onClose: () => void;
  onSuccess: () => void;
}

export function RegistrationForm({ batch, onClose, onSuccess }: RegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      notes: "",
    },
  });

  const onSubmit = async (values: RegistrationFormValues) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await submitPublicCourseRegistration({
        batchId: batch.id,
        fullName: values.fullName,
        phone: values.phone,
        email: values.email || undefined,
        notes: values.notes || undefined,
      });
      onSuccess();
    } catch (err: any) {
      console.error("[Registration Submit Raw Error]:", err);
      // User friendly error message, do not expose raw DB error in production
      setErrorMsg("Không thể gửi đăng ký lúc này. Vui lòng thử lại sau hoặc liên hệ DESEMBRE Academy.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-900 text-white">
          <div>
            <div className="text-xs text-indigo-300 font-semibold uppercase tracking-wider mb-0.5">
              ĐĂNG KÝ KHÓA HỌC
            </div>
            <h2 className="text-lg font-bold">DESEMBRE Academy</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Selected Class Summary Card */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              Lớp đào tạo đã chọn
            </div>
            <h3 className="font-bold text-slate-900 text-base leading-snug">
              {batch.course?.title || batch.title}
            </h3>
            {batch.course?.title && (
              <p className="text-xs text-slate-500">Lớp: {batch.title}</p>
            )}

            <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-600 border-t border-indigo-100/60 mt-2">
              {batch.start_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{format(parseISO(batch.start_date), "dd/MM/yyyy")}</span>
                </div>
              )}
              {batch.training_format && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="capitalize">{batch.training_format}</span>
                </div>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs leading-relaxed">
              {errorMsg}
            </div>
          )}

          <form id="publicRegistrationForm" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  {...register("fullName")}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="VD: Nguyễn Văn A"
                />
              </div>
              {errors.fullName && (
                <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Số điện thoại Zalo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  {...register("phone")}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="0912345678"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Số Zalo để nhận thông báo xác nhận và thông tin chi tiết lớp học.
              </p>
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  {...register("email")}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="example@gmail.com"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Ghi chú / Nhu cầu tư vấn
              </label>
              <div className="relative">
                <textarea
                  {...register("notes")}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  rows={3}
                  placeholder="Ghi rõ thắc mắc hoặc câu hỏi cần tư vấn thêm..."
                />
              </div>
            </div>
          </form>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>Thông tin cá nhân của bạn được bảo mật tuyệt đối theo chính sách DESEMBRE.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button
            type="submit"
            form="publicRegistrationForm"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center min-w-[140px]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>Xác nhận đăng ký</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
