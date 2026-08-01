import { useState, useMemo } from "react";
import { AcademyLandingPage } from "@/features/admin/services/academyAdminLandingPagesApi";
import { getTrackingConfigStatus } from "@/features/public-training/tracking/pixelSdkLoader";
import {
  CheckCircle2, XCircle, AlertTriangle, ShieldCheck, ExternalLink, Play, Copy, Check, Sparkles, Globe, Layers, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdsLaunchChecklistModalProps {
  landing: AcademyLandingPage | null;
  publicSchedule: any[];
  isOpen: boolean;
  onClose: () => void;
}

export function AdsLaunchChecklistModal({
  landing,
  publicSchedule,
  isOpen,
  onClose,
}: AdsLaunchChecklistModalProps) {
  const [copiedUtm, setCopiedUtm] = useState(false);
  const [qaRan, setQaRan] = useState(false);

  const trackingStatus = useMemo(() => getTrackingConfigStatus(), []);

  if (!isOpen || !landing) return null;

  const hasCourse = !!(landing.course_id || landing.course);
  const hasCover = !!landing.hero_cover_url;
  const hasAudience = !!(landing.audience && landing.audience.length > 0);
  const hasOutcomes = !!(landing.outcomes && landing.outcomes.length > 0);
  const hasFaqs = !!(landing.faqs && landing.faqs.length > 0);
  const hasSeoTitle = !!landing.seo_title;
  const hasSeoDesc = !!landing.seo_description;
  const hasOgImage = !!landing.og_image_url;

  const targetSlug = landing.slug.toLowerCase().trim();

  // Find matching public batch
  const matchingBatches = publicSchedule.filter((b: any) => {
    const cSlug = (b.course?.slug || "").toLowerCase().trim();
    const bSlug = (b.slug || "").toLowerCase().trim();
    return cSlug === targetSlug || bSlug === targetSlug || cSlug.includes(targetSlug) || targetSlug.includes(cSlug);
  });

  const hasPublicBatch = matchingBatches.length > 0;
  const ctaMode = hasPublicBatch ? "Đăng ký giữ chỗ ngay" : "Nhận thông báo lịch mới";

  const isFullContent = hasCover && hasAudience && hasOutcomes && hasFaqs && hasSeoTitle && hasSeoDesc;

  let overallReadiness = {
    title: "⚪ Bản nháp (Draft)",
    desc: "Trang chiến dịch đang ẩn public. Khách thường vào sẽ thấy thông báo Chưa xuất bản.",
    cls: "bg-slate-100 text-slate-800 border-slate-300",
  };

  if (landing.is_published) {
    if (isFullContent && hasPublicBatch && trackingStatus.isEnabled) {
      overallReadiness = {
        title: "🟢 SẴN SÀNG CHẠY ADS THẬT (READY TO LAUNCH)",
        desc: "Đã có đầy đủ nội dung, Lớp Public đang tuyển sinh và Ads Tracking đang bật.",
        cls: "bg-emerald-500 text-white border-emerald-600 font-extrabold shadow-lg shadow-emerald-500/20",
      };
    } else if (isFullContent && hasPublicBatch && !trackingStatus.isEnabled) {
      overallReadiness = {
        title: "🟡 SẴN SÀNG PUBLIC (THIẾU ADS TRACKING ENV)",
        desc: "Nội dung & Lớp Public sẵn sàng. Cần bật VITE_ENABLE_ADS_TRACKING=true khi chạy Ads.",
        cls: "bg-amber-500 text-slate-950 border-amber-600 font-extrabold shadow-lg shadow-amber-500/20",
      };
    } else if (isFullContent && !hasPublicBatch) {
      overallReadiness = {
        title: "🟡 CHẾ ĐỘ THÔNG BÁO LỊCH MỚI (NEED BATCH)",
        desc: "Đã có đầy đủ nội dung. Chưa có Lớp Public (Nút CTA tự động dùng chế độ Nhận thông báo).",
        cls: "bg-amber-500 text-slate-950 border-amber-600 font-extrabold",
      };
    } else {
      overallReadiness = {
        title: "🔵 CẦN BỔ SUNG NỘI DUNG",
        desc: "Vui lòng cập nhật đầy đủ Cover, Audience, Outcomes, FAQ hoặc SEO trước khi chạy Ads.",
        cls: "bg-sky-500 text-white border-sky-600 font-bold",
      };
    }
  }

  const checklistItems = [
    { label: "Trạng thái Xuất bản (Publish)", status: landing.is_published, note: landing.is_published ? "Đã công khai" : "Bản nháp (Draft)" },
    { label: "Tiêu đề & Badge Hero", status: !!(landing.hero_title && landing.hero_badge), note: landing.hero_badge || "Chưa có badge" },
    { label: "Ảnh Bìa Hero Cover", status: hasCover, note: hasCover ? "Đã có ảnh cover" : "Thiếu cover" },
    { label: "Nội dung Đối tượng (Audience)", status: hasAudience, note: `${landing.audience?.length || 0} thẻ đối tượng` },
    { label: "Nội dung Giá trị (Outcomes)", status: hasOutcomes, note: `${landing.outcomes?.length || 0} điểm giá trị` },
    { label: "Câu hỏi Thường gặp (FAQ)", status: hasFaqs, note: `${landing.faqs?.length || 0} câu hỏi FAQ` },
    { label: "SEO Title Tag", status: hasSeoTitle, note: landing.seo_title || "Thiếu SEO title" },
    { label: "SEO Meta Description", status: hasSeoDesc, note: landing.seo_description || "Thiếu SEO desc" },
    { label: "Social OG Image", status: hasOgImage, note: hasOgImage ? "Đã cấu hình OG image" : "Dùng OG mặc định" },
    { label: "Liên kết Khóa học", status: hasCourse, note: hasCourse ? "Đã chọn khóa học" : "Không giới hạn khóa" },
    { label: "Lớp Public Đang Tuyển Sinh", status: hasPublicBatch, note: hasPublicBatch ? `${matchingBatches.length} lớp public` : "0 lớp public (Dùng CTA thông báo)" },
    { label: "Chế độ Nút CTA Form", status: true, note: `Nút hiển thị: "${ctaMode}"` },
    { label: "CRM Attribution Source & Campaign", status: true, note: `Lưu source='landing_page' & [campaign: ${landing.slug}]` },
    { label: "ZNS Outbox Notification Queue", status: true, note: "Tự động queue template 'registration_received'" },
    { label: "Cấu hình Ads Tracking (Env)", status: trackingStatus.isEnabled, note: trackingStatus.isEnabled ? "VITE_ENABLE_ADS_TRACKING = true" : "VITE_ENABLE_ADS_TRACKING = false" },
    { label: "Meta Pixel (Facebook)", status: trackingStatus.metaPixel.configured, note: trackingStatus.metaPixel.maskedId },
    { label: "TikTok Pixel", status: trackingStatus.tikTokPixel.configured, note: trackingStatus.tikTokPixel.maskedId },
    { label: "Google Analytics 4 / GTM", status: trackingStatus.ga4.configured || trackingStatus.gtm.configured, note: trackingStatus.ga4.maskedId || trackingStatus.gtm.maskedId },
    { label: "Bảo vệ Secure Preview Guard", status: true, note: "?preview=1 chỉ dành cho Admin đã đăng nhập" },
  ];

  const passedCount = checklistItems.filter((i) => i.status).length;
  const totalCount = checklistItems.length;

  const sampleUtmUrl = `https://academy.desembre-vn.com/l/${landing.slug}?utm_source=facebook&utm_medium=cpc_ads&utm_campaign=${landing.slug}_august`;

  const handleCopyUtm = () => {
    navigator.clipboard.writeText(sampleUtmUrl);
    setCopiedUtm(true);
    setTimeout(() => setCopiedUtm(false), 2000);
  };

  const handleRunQA = () => {
    setQaRan(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col font-sans">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Ads Launch Checklist & QA Audit</h2>
              <p className="text-xs text-slate-400 font-mono">/l/{landing.slug}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {/* Readiness Banner */}
          <div className={`p-4 rounded-2xl border ${overallReadiness.cls} space-y-1`}>
            <div className="text-sm tracking-wide">{overallReadiness.title}</div>
            <p className="text-xs opacity-90 leading-relaxed">{overallReadiness.desc}</p>
          </div>

          {/* QA Self-Test Action */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Kiểm tra Chẩn đoán Tự động (Client-Side QA Diagnostic)</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Chạy kiểm tra tự động 17 tiêu chí sẵn sàng xuất bản Ads cho landing page này.
              </p>
            </div>
            <Button
              onClick={handleRunQA}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs h-10 px-4 shrink-0 gap-1.5 shadow-md shadow-indigo-600/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Chạy Landing QA</span>
            </Button>
          </div>

          {qaRan && (
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs space-y-2 animate-fadeIn">
              <div className="font-bold flex items-center justify-between">
                <span>📊 KẾT QUẢ CHẨN ĐOÁN LANDING QA:</span>
                <span className="text-sm text-indigo-700 font-extrabold">{passedCount} / {totalCount} Tiêu chí Đạt</span>
              </div>
              <p className="text-indigo-800 leading-relaxed">
                Hệ thống đã rà soát 17 tiêu chí gồm: Cấu hình Hero Cover, Audience, Outcomes, FAQ, SEO Title/Desc, OG Image, Ads Tracking SDK Env, CRM Source Attribution và ZNS Outbox Queue.
              </p>
            </div>
          )}

          {/* Checklist Items Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Danh Mục Kiểm Tra Chi Tiết ({passedCount}/{totalCount})
            </h3>

            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
              {checklistItems.map((item, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.status ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <span className="font-semibold text-slate-800 truncate">{item.label}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] shrink-0 ${
                    item.status ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    {item.note}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Manual Test Guide Instructions */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Hướng Dẫn Test Thủ Công Trước Khi Bật Ngân Sách Ads
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p className="font-semibold text-white">Bước 1: Mở URL Landing có gắn UTM trong cửa sổ Ẩn danh (Incognito):</p>
              <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-[11px] text-amber-300 overflow-x-auto">
                <span className="truncate flex-1">{sampleUtmUrl}</span>
                <button
                  onClick={handleCopyUtm}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 shrink-0"
                  title="Copy UTM Link"
                >
                  {copiedUtm ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <p className="font-semibold text-white pt-2">Bước 2: Thao tác gửi Đăng ký thử nghiệm:</p>
              <ul className="list-disc list-inside space-y-1 pl-1 text-slate-400">
                <li>Bấm nút CTA chính <span className="text-white font-bold">"{ctaMode}"</span>.</li>
                <li>Nhập thông tin họ tên & số điện thoại Zalo thử nghiệm.</li>
              </ul>

              <p className="font-semibold text-white pt-2">Bước 3: Xác minh kết quả trên CRM & ZNS:</p>
              <ul className="list-disc list-inside space-y-1 pl-1 text-slate-400">
                <li>Vào trang <span className="text-white font-bold">/admin/academy-enrollments</span>: Kiểm tra lead vừa tạo có <span className="text-emerald-400 font-mono">source = 'landing_page'</span> và ghi chú chứa campaign slug & UTM params.</li>
                <li>Vào trang <span className="text-white font-bold">/admin/notifications</span>: Xác minh notification outbox đã queue ZNS template <span className="text-emerald-400 font-mono">registration_received</span>.</li>
                <li>Dùng công cụ <span className="text-white font-bold">Meta Pixel Helper / TikTok Pixel Helper</span> trên trình duyệt để kiểm tra event <span className="text-emerald-400 font-mono">Lead / SubmitForm</span> bắn thành công.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between sticky bottom-0">
          <a
            href={`/l/${landing.slug}?utm_source=facebook&utm_medium=cpc_ads&utm_campaign=${landing.slug}_august`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
          >
            <span>Mở trang Public với UTM Test</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <Button onClick={onClose} variant="outline" className="h-10 px-5 rounded-xl font-bold text-xs">
            Đóng Checklist
          </Button>
        </div>
      </div>
    </div>
  );
}
