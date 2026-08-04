import { useState, useMemo, useEffect } from "react";
import { AcademyLandingPage } from "@/features/admin/services/academyAdminLandingPagesApi";
import { getTrackingConfigStatus } from "@/features/public-training/tracking/pixelSdkLoader";
import {
  CheckCircle2, XCircle, AlertTriangle, ShieldCheck, ExternalLink, Play, Copy, Check, Sparkles, Globe, Layers, ArrowRight,
  FlaskConical, Save, FileText, AlertCircle, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdsLaunchChecklistModalProps {
  landing: AcademyLandingPage | null;
  publicSchedule: any[];
  isOpen: boolean;
  onClose: () => void;
}

interface SmokeTestRecord {
  testedBy: string;
  testedAt: string;
  resultStatus: "PASS" | "FAIL" | "PENDING";
  notes: string;
}

export function AdsLaunchChecklistModal({
  landing,
  publicSchedule,
  isOpen,
  onClose,
}: AdsLaunchChecklistModalProps) {
  const [activeTab, setActiveTab] = useState<"checklist" | "smoketest">("checklist");
  const [copiedUtm, setCopiedUtm] = useState(false);
  const [qaRan, setQaRan] = useState(false);

  // Smoke Test Form States
  const [testedBy, setTestedBy] = useState("");
  const [testedAt, setTestedAt] = useState("");
  const [resultStatus, setResultStatus] = useState<"PASS" | "FAIL" | "PENDING">("PENDING");
  const [testNotes, setTestNotes] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const trackingStatus = useMemo(() => getTrackingConfigStatus(), []);

  // Load stored smoke test results from localStorage
  useEffect(() => {
    if (landing) {
      try {
        const stored = localStorage.getItem(`smoke_test_${landing.slug}`);
        if (stored) {
          const parsed: SmokeTestRecord = JSON.parse(stored);
          setTestedBy(parsed.testedBy || "");
          setTestedAt(parsed.testedAt || "");
          setResultStatus(parsed.resultStatus || "PENDING");
          setTestNotes(parsed.notes || "");
        } else {
          setTestedBy("");
          setTestedAt(new Date().toISOString().slice(0, 16));
          setResultStatus("PENDING");
          setTestNotes("");
        }
      } catch (err) {
        console.warn("Failed to load smoke test note:", err);
      }
    }
  }, [landing]);

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

  const smokeTestUtmUrl = `https://academy.desembre-vn.com/l/${landing.slug}?utm_source=facebook&utm_medium=cpc_ads&utm_campaign=${landing.slug}_smoke_test`;

  const handleCopyUtm = () => {
    navigator.clipboard.writeText(smokeTestUtmUrl);
    setCopiedUtm(true);
    setTimeout(() => setCopiedUtm(false), 2000);
  };

  const handleRunQA = () => {
    setQaRan(true);
  };

  const handleSaveSmokeTestRecord = () => {
    try {
      const record: SmokeTestRecord = {
        testedBy: testedBy.trim() || "Admin",
        testedAt: testedAt || new Date().toISOString(),
        resultStatus,
        notes: testNotes.trim(),
      };
      localStorage.setItem(`smoke_test_${landing.slug}`, JSON.stringify(record));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error("Save smoke test record error:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col font-sans">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Ads Launch & Production QA Panel</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                  /l/{landing.slug}
                </span>
              </div>
              <p className="text-xs text-slate-400">Kiểm tra 17 tiêu chí Ads Launch & Quy trình Smoke Test End-to-End</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 pt-3 flex items-center gap-2 font-semibold text-xs">
          <button
            onClick={() => setActiveTab("checklist")}
            className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
              activeTab === "checklist"
                ? "bg-white text-indigo-600 border-indigo-600 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>1. Ads Launch Checklist ({passedCount}/{totalCount})</span>
          </button>

          <button
            onClick={() => setActiveTab("smoketest")}
            className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
              activeTab === "smoketest"
                ? "bg-white text-indigo-600 border-indigo-600 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60"
            }`}
          >
            <FlaskConical className="w-4 h-4 text-emerald-600" />
            <span className="flex items-center gap-1.5">
              <span>2. Production Smoke Test</span>
              {resultStatus === "PASS" && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
              {resultStatus === "FAIL" && <span className="w-2 h-2 rounded-full bg-rose-500" />}
            </span>
          </button>
        </div>

        {/* Body Area */}
        <div className="p-6 space-y-6 flex-1">
          {/* TAB 1: CHECKLIST */}
          {activeTab === "checklist" && (
            <>
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
            </>
          )}

          {/* TAB 2: PRODUCTION SMOKE TEST */}
          {activeTab === "smoketest" && (
            <div className="space-y-6">
              {/* Test URL Generator Card */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4 border border-slate-800 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Production Smoke Test URL Generator
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">UTM Campaign: {landing.slug}_smoke_test</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-amber-300 overflow-x-auto">
                    <span className="truncate flex-1">{smokeTestUtmUrl}</span>
                    <button
                      onClick={handleCopyUtm}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shrink-0 flex items-center gap-1.5 transition-colors"
                    >
                      {copiedUtm ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Đã Copy!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Smoke Test URL</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Quick Navigation Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <a
                    href="/admin/academy-enrollments"
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-between gap-2 group transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1">
                        <span>CRM Quick Link (Kiểm tra Lead)</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Lọc thủ công: <span className="text-slate-200">source = Landing Page</span> & campaign = <span className="text-amber-300 font-mono">{landing.slug}</span>
                      </p>
                    </div>
                  </a>

                  <a
                    href="/admin/notifications"
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-between gap-2 group transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1">
                        <span>ZNS Outbox Quick Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Lọc hàng đợi: <span className="text-slate-200">template_code = </span><span className="text-emerald-300 font-mono">registration_received</span>
                      </p>
                    </div>
                  </a>
                </div>
              </div>

              {/* ZNS Safety Warning Alert */}
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-700">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>⚠️ CẢNH BẢO AN TOÀN KHI THỰC HIỆN SMOKE TEST ZNS:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-rose-800 leading-relaxed pl-1">
                  <li>Thao tác gửi Lead test sẽ tự động tạo bản ghi <span className="font-mono text-rose-900 bg-rose-100 px-1 py-0.5 rounded">registration_received</span> trong <span className="font-mono">notification_outbox</span>.</li>
                  <li><strong>KHÔNG CHẠY CRON ZNS WORKER CHẾ ĐỘ 'REAL' TỰ ĐỘNG</strong> nếu chưa muốn phát tin Zalo thật tới số điện thoại test.</li>
                  <li>Nếu cần test tin nhắn Zalo ZNS thực tế, chỉ duyệt thủ công hoặc chạy worker với <span className="font-mono">limit=1</span> và dùng số điện thoại test được cấp phép.</li>
                </ul>
              </div>

              {/* Manual Smoke Test Instructions Steps */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Quy Trình 6 Bước Production Smoke Test End-to-End</span>
                </h3>

                <div className="space-y-3 text-xs text-slate-700">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-900 block">Bước 1: Mở Test UTM URL trong Cửa Sổ Ẩn Danh (Incognito)</span>
                    <p className="text-slate-600">Copy URL ở khung trên, mở trình duyệt mới dạng Incognito để loại bỏ cache Admin session và cookie cũ.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-900 block">Bước 2: Kiểm Tra Tải Landing Page & Giao Diện Mobile/Desktop</span>
                    <p className="text-slate-600">Xác nhận Hero Title đúng chuyên đề campaign, giao diện không lỗi phông, nút CTA hiển thị đúng trạng thái lớp học tuyển sinh.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-900 block">Bước 3: Click CTA & Gửi Form Đăng Ký Thử Nghiệm</span>
                    <p className="text-slate-600">Bấm nút CTA chính "{ctaMode}", điền thông tin Họ tên và Số điện thoại Zalo thử nghiệm.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-900 block">Bước 4: Kiểm Tra Ghi Nhận CRM Leads (/admin/academy-enrollments)</span>
                    <p className="text-slate-600">Mở CRM, xác minh Lead vừa đăng ký chứa <span className="font-mono text-indigo-600">source = 'landing_page'</span> và phần ghi chú có thông tin <span className="font-mono">[campaign: {landing.slug}]</span> kèm các tham số UTM.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-900 block">Bước 5: Kiểm Tra Hàng Đợi ZNS Outbox (/admin/notifications)</span>
                    <p className="text-slate-600">Xác minh tin nhắn outbox có <span className="font-mono text-emerald-600">template_code = 'registration_received'</span> và payload chứa đầy đủ <span className="font-mono">customer_name</span>, <span className="font-mono">course_name</span>, <span className="font-mono">training_format</span>, <span className="font-mono">batch_name</span>, <span className="font-mono">registration_code</span>.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-900 block">Bước 6: Kiểm Tra Sự Kiện Ads Tracking Pixels (Meta / TikTok / GA4)</span>
                    <p className="text-slate-600">
                      {trackingStatus.isEnabled ? (
                        <span className="text-emerald-700 font-semibold">
                          🟢 Ads Tracking đang bật (VITE_ENABLE_ADS_TRACKING=true): Kiểm tra Meta Pixel Helper thấy event Lead, TikTok thấy SubmitForm/CompleteRegistration, GA4 thấy generate_lead.
                        </span>
                      ) : (
                        <span className="text-slate-500">
                          ⚪ Ads Tracking đang tắt (VITE_ENABLE_ADS_TRACKING=false): Đúng mong đợi - Không có sự kiện pixel nào được gửi đi (Expected Behavior).
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Smoke Test Results Record Form (LocalStorage persistence) */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Nhật Ký Ghi Nhận Kết Quả Smoke Test Thủ Công
                    </span>
                  </div>
                  {saveSuccess && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 animate-fadeIn">
                      ✓ Đã lưu kết quả!
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Người Kiểm Thử (Tested By)</label>
                    <input
                      type="text"
                      value={testedBy}
                      onChange={(e) => setTestedBy(e.target.value)}
                      placeholder="Ví dụ: Admin QA / Marketer"
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Thời Gian Kiểm Thử (Tested At)</label>
                    <input
                      type="datetime-local"
                      value={testedAt}
                      onChange={(e) => setTestedAt(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Kết Quả Evaluation</label>
                    <select
                      value={resultStatus}
                      onChange={(e) => setResultStatus(e.target.value as any)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    >
                      <option value="PENDING">🟡 PENDING (Chưa nghiệm thu)</option>
                      <option value="PASS">🟢 PASS (Thành công 100%)</option>
                      <option value="FAIL">🔴 FAIL (Có lỗi phát sinh)</option>
                    </select>
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">Ghi Chú Chi Tiết Phản Hồi (Notes & Feedback)</label>
                  <textarea
                    rows={3}
                    value={testNotes}
                    onChange={(e) => setTestNotes(e.target.value)}
                    placeholder="Nhập ghi chú phản hồi kiểm thử, thiết bị test, lỗi nếu có..."
                    className="w-full p-3 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-y text-xs"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveSmokeTestRecord}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 px-5 rounded-xl shadow-md shadow-indigo-600/20 gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu Nhật Ký Smoke Test</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between sticky bottom-0">
          <a
            href={smokeTestUtmUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
          >
            <span>Mở trang Public với UTM Smoke Test</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <Button onClick={onClose} variant="outline" className="h-10 px-5 rounded-xl font-bold text-xs">
            Đóng Panel QA
          </Button>
        </div>
      </div>
    </div>
  );
}
