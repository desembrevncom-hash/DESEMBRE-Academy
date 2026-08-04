import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PublicCourseBatch, submitPublicCourseRegistration } from "../services/publicTrainingApi";
import { formatDateSafe, getFormatConfig } from "../utils/formatters";
import { trackLandingEvent } from "../utils/landingTracking";
import { X, Loader2, Calendar, MapPin, ShieldCheck, User, Phone, Mail, GraduationCap } from "lucide-react";

const registrationSchema = z.object({
  fullName: z.string().min(2, "Họ và tên phải có ít nhất 2 ký tự"),
  phone: z
    .string()
    .regex(/^(0[3|5|7|8|9])+([0-9]{8})$/, "Số điện thoại Việt Nam không hợp lệ (VD: 0912345678)"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  notes: z.string().optional(),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

import { ordersApi, AcademyOrder } from "../services/ordersApi";

interface RegistrationFormProps {
  batch: PublicCourseBatch;
  onClose: () => void;
  onSuccess: (isDuplicate?: boolean, order?: AcademyOrder | null) => void;
  initialNotes?: string;
  source?: string;
  campaignSlug?: string;
}

export function RegistrationForm({
  batch,
  onClose,
  onSuccess,
  initialNotes,
  source,
  campaignSlug,
}: RegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatConfig = getFormatConfig(batch.training_format);

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
      notes: initialNotes || "",
    },
  });

  const onSubmit = async (values: RegistrationFormValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    // Extract UTM parameters silently from URL
    let utm_source: string | undefined;
    let utm_medium: string | undefined;
    let utm_campaign: string | undefined;

    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      utm_source = searchParams.get("utm_source") || undefined;
      utm_medium = searchParams.get("utm_medium") || undefined;
      utm_campaign = searchParams.get("utm_campaign") || undefined;
    }

    const effectiveSource = source || (campaignSlug ? "landing_page" : "public_schedule");
    const effectiveCampaign = campaignSlug || undefined;

    trackLandingEvent("registration_submit_attempt", {
      batch_id: batch.id,
      batch_title: batch.title,
      campaign_slug: effectiveCampaign,
      source: effectiveSource,
      utm_source,
      utm_medium,
      utm_campaign,
    });

    try {
      const res = await submitPublicCourseRegistration({
        batchId: batch.id,
        fullName: values.fullName,
        phone: values.phone,
        email: values.email || undefined,
        notes: values.notes || undefined,
        source: effectiveSource,
        campaign_slug: effectiveCampaign,
        utm_source,
        utm_medium,
        utm_campaign,
      });

      if (res && res.ok !== false) {
        trackLandingEvent("registration_submit_success", {
          batch_id: batch.id,
          batch_title: batch.title,
          campaign_slug: effectiveCampaign,
          source: effectiveSource,
          registration_id: res.registration_id,
          duplicate: !!res.duplicate,
          utm_source,
          utm_medium,
          utm_campaign,
        });

        let createdOrder: AcademyOrder | null = (res.order as AcademyOrder) || null;
        const cObj = (batch.course as any) || {};
        const pricingModel = cObj.pricing_model;
        const depositAmt = Number(cObj.deposit_amount || (batch as any).deposit_amount || 0);
        const priceAmt = Number(cObj.price_amount || (batch as any).amount || (batch as any).price || 0);
        const effectiveAmount = depositAmt > 0 ? depositAmt : priceAmt;
        const isPaidCourse = pricingModel === "paid" || effectiveAmount > 0 || priceAmt > 0;

        if (import.meta.env.DEV) {
          console.log("[P3C.65H DEV Debug]", {
            landingSlug: campaignSlug,
            selectedBatchId: batch.id,
            selectedBatchTitle: batch.title,
            selectedBatchCourseSlug: batch.course?.slug,
            source: effectiveSource,
            campaignSlug: effectiveCampaign,
            pricing_model: pricingModel,
            price_amount: priceAmt,
            deposit_amount: depositAmt,
            effectiveAmount,
            isPaidCourse,
            orderCreated: createdOrder,
          });
        }

        if (isPaidCourse && !createdOrder && res.registration_id) {
          try {
            const orderRes = await ordersApi.createPaidCourseOrder({
              registrationId: res.registration_id,
              courseId: batch.course?.id,
              batchId: batch.id,
              fullName: values.fullName,
              phone: values.phone,
              email: values.email || undefined,
              amount: effectiveAmount > 0 ? effectiveAmount : 1500000,
            });
            if (orderRes.ok && orderRes.order) {
              createdOrder = orderRes.order;
            }
          } catch (e) {
            console.error("[RegistrationForm] createPaidCourseOrder error:", e);
          }
        }

        onSuccess(!!res.duplicate, createdOrder);
      } else {
        const errorText = res?.error || "Không thể gửi đăng ký lúc này. Vui lòng thử lại sau hoặc liên hệ DESEMBRE Training Center.";
        setErrorMsg(errorText);
        trackLandingEvent("registration_submit_error", {
          batch_id: batch.id,
          campaign_slug: effectiveCampaign,
          source: effectiveSource,
          error_message: errorText,
        });
      }
    } catch (err: any) {
      console.error("[PublicRegistration Error]:", err);
      const errorText = "Không thể gửi đăng ký lúc này. Vui lòng thử lại sau hoặc liên hệ DESEMBRE Training Center.";
      setErrorMsg(errorText);
      trackLandingEvent("registration_submit_error", {
        batch_id: batch.id,
        campaign_slug: effectiveCampaign,
        source: effectiveSource,
        error_message: err?.message || errorText,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const instructorName = batch.instructor?.full_name || "Đội ngũ đào tạo DESEMBRE Training Center";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer / Bottom sheet */}
      <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col h-full rounded-t-3xl sm:rounded-none overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-900 text-white">
          <div>
            <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mb-0.5">
              ĐĂNG KÝ KHÓA HỌC
            </div>
            <h2 className="text-lg font-bold">DESEMBRE Training Center</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Summary Box */}
          <div className="bg-indigo-50/70 border border-indigo-100/80 rounded-2xl p-4 space-y-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
              Lớp đào tạo đã chọn
            </div>

            <h3 className="font-extrabold text-slate-900 text-base leading-snug">
              {batch.course?.title || batch.title}
            </h3>

            {batch.course?.title && (
              <p className="text-xs text-slate-600 font-medium">Lớp: {batch.title}</p>
            )}

            <div className="pt-2 flex flex-wrap items-center gap-3.5 text-xs text-slate-600 border-t border-indigo-100/60">
              {batch.start_date && (
                <div className="flex items-center gap-1 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>{formatDateSafe(batch.start_date, "dd/MM/yyyy")}</span>
                </div>
              )}

              <div className="flex items-center gap-1 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>{formatConfig.label}</span>
              </div>

              <div className="flex items-center gap-1 text-slate-600 w-full pt-1">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate font-medium text-slate-800">{instructorName}</span>
              </div>
            </div>
          </div>

          {/* Friendly Error Notice */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs leading-relaxed font-medium">
              {errorMsg}
            </div>
          )}

          <form id="publicRegistrationForm" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  {...register("fullName")}
                  className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  placeholder="VD: Nguyễn Văn A"
                />
              </div>
              {errors.fullName && (
                <p className="text-red-500 text-xs mt-1 font-medium">{errors.fullName.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Số điện thoại Zalo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  {...register("phone")}
                  className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  placeholder="0912345678"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Nhập số Zalo để nhận thông báo xác nhận đăng ký.
              </p>
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1 font-medium">{errors.phone.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  {...register("email")}
                  className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="example@gmail.com"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Nhu cầu tư vấn / Ghi chú
              </label>
              <textarea
                {...register("notes")}
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                rows={3}
                placeholder="Ghi rõ câu hỏi hoặc mong muốn tư vấn thêm..."
              />
            </div>
          </form>

          {/* Privacy Note */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Thông tin cá nhân của bạn được bảo mật tuyệt đối theo chính sách DESEMBRE.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
            disabled={isSubmitting}
          >
            Hủy
          </button>

          <button
            type="submit"
            form="publicRegistrationForm"
            className="flex-1 sm:flex-none h-12 sm:h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm sm:font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center min-w-[150px]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span>Đang gửi đăng ký...</span>
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
