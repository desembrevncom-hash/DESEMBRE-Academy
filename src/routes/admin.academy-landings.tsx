import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  getLandingPages,
  getLandingPageBySlug,
  createLandingPage,
  updateLandingPage,
  deleteLandingPage,
  AcademyLandingPage,
  CreateLandingPagePayload,
  LandingAudienceItem,
  LandingOutcomeItem,
  LandingCurriculumItem,
  LandingTrustItem,
  LandingFaqItem,
} from "@/features/admin/services/academyAdminLandingPagesApi";
import { getPublicTrainingSchedule } from "@/features/public-training/services/publicTrainingApi";
import { getTrackingConfigStatus } from "@/features/public-training/tracking/pixelSdkLoader";
import { academyAdminCoursesApi } from "@/features/admin/services/academyAdminCoursesApi";
import type { AcademyAdminCourseListItem } from "@/features/admin/types";
import {
  Plus, Pencil, Trash2, ExternalLink, Loader2, Globe, Sparkles, CheckCircle2, XCircle, ArrowLeft, Layers, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { AdsLaunchChecklistModal } from "@/features/admin/components/AdsLaunchChecklistModal";

export const Route = createFileRoute("/admin/academy-landings")({
  component: AdminAcademyLandingsPage,
});

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function AdminAcademyLandingsPage() {
  const [landings, setLandings] = useState<AcademyLandingPage[]>([]);
  const [courses, setCourses] = useState<AcademyAdminCourseListItem[]>([]);
  const [publicSchedule, setPublicSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingLanding, setEditingLanding] = useState<AcademyLandingPage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [checklistLanding, setChecklistLanding] = useState<AcademyLandingPage | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      let landingsData: AcademyLandingPage[] = [];
      let coursesData: AcademyAdminCourseListItem[] = [];

      try {
        landingsData = await getLandingPages();
      } catch (err: any) {
        console.error("Failed to load landing pages:", err);
        setError(err.message || "Không thể tải danh sách landing pages từ Supabase.");
      }

      // Ensure default landing pages are listed in Admin table
      const defaultSlugs = [
        "biological-trigger",
        "targeted-modulation",
        "3-phase-biological-peel-demo",
        "premium-glass-skin-program",
      ];

      for (const dSlug of defaultSlugs) {
        if (!landingsData.some((item) => item.slug === dSlug)) {
          const defaultLanding = await getLandingPageBySlug(dSlug);
          if (defaultLanding) {
            landingsData.push(defaultLanding);
          }
        }
      }

      try {
        coursesData = await academyAdminCoursesApi.listCourses();
      } catch (err: any) {
        console.warn("Failed to load courses for dropdown:", err);
      }

      // Fetch public training schedule to match valid public batches for QA Checklist
      let publicBatches: any[] = [];
      try {
        publicBatches = await getPublicTrainingSchedule();
      } catch (err: any) {
        console.warn("Failed to load public training schedule:", err);
      }

      setPublicSchedule(publicBatches);
      setLandings(landingsData);
      setCourses(coursesData);
    } catch (err: any) {
      console.error("loadData error:", err);
      setError(err.message || "Lỗi không xác định khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa landing page "${title}"?`)) return;
    try {
      setDeletingId(id);
      await deleteLandingPage(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Lỗi khi xóa landing page.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublish = async (landingItem: AcademyLandingPage) => {
    try {
      await updateLandingPage(landingItem.id, {
        is_published: !landingItem.is_published,
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || "Không thể thay đổi trạng thái xuất bản.");
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 font-sans antialiased text-slate-900">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>DESEMBRE ACADEMY LANDING PAGES</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Quản Lý Landing Page Chiến Dịch
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Tạo và tùy chỉnh landing page chạy Ads cho từng khóa học & chuyên đề đào tạo.
          </p>
        </div>

        {!isCreating && !editingLanding && (
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-11 px-5 rounded-xl shadow-md shadow-indigo-600/20"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Tạo Landing Page Mới
          </Button>
        )}
      </div>

      {/* Ads Tracking Config Status Widget */}
      {(() => {
        const trackingStatus = getTrackingConfigStatus();
        return (
          <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Cấu Hình Ads Tracking SDK (Meta / TikTok / GA4)
                </span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                trackingStatus.isEnabled ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}>
                {trackingStatus.isEnabled ? "🟢 Ads Tracking: ENABLED" : "⚪ Ads Tracking: DISABLED (Env)"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block text-[10px] font-bold uppercase mb-0.5">Meta Pixel</span>
                <span className={`font-semibold ${trackingStatus.metaPixel.configured ? "text-emerald-400" : "text-slate-500"}`}>
                  {trackingStatus.metaPixel.maskedId}
                </span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block text-[10px] font-bold uppercase mb-0.5">TikTok Pixel</span>
                <span className={`font-semibold ${trackingStatus.tikTokPixel.configured ? "text-emerald-400" : "text-slate-500"}`}>
                  {trackingStatus.tikTokPixel.maskedId}
                </span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block text-[10px] font-bold uppercase mb-0.5">GA4 Measurement</span>
                <span className={`font-semibold ${trackingStatus.ga4.configured ? "text-emerald-400" : "text-slate-500"}`}>
                  {trackingStatus.ga4.maskedId}
                </span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block text-[10px] font-bold uppercase mb-0.5">GTM Container</span>
                <span className={`font-semibold ${trackingStatus.gtm.configured ? "text-emerald-400" : "text-slate-500"}`}>
                  {trackingStatus.gtm.maskedId}
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Form Area */}
      {(isCreating || editingLanding) && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900">
              {isCreating ? "Tạo Landing Page Mới" : `Chỉnh sửa: ${editingLanding?.title}`}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsCreating(false);
                setEditingLanding(null);
              }}
              className="rounded-xl text-slate-500"
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> Quay lại
            </Button>
          </div>

          <LandingForm
            landing={editingLanding}
            courses={courses}
            onDone={() => {
              setIsCreating(false);
              setEditingLanding(null);
              loadData();
            }}
            onCancel={() => {
              setIsCreating(false);
              setEditingLanding(null);
            }}
          />
        </div>
      )}

      {/* Table Area */}
      {!isCreating && !editingLanding && (
        <>
          {loading && (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          )}

          {!loading && error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div>
                <p className="font-bold">Lỗi kết nối / Truy vấn dữ liệu</p>
                <p className="text-xs mt-0.5 text-rose-600 font-mono">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-100 shrink-0 font-semibold"
              >
                Thử lại
              </Button>
            </div>
          )}

          {!loading && !error && landings.length === 0 && (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8 space-y-3">
              <Globe className="h-12 w-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800">Chưa có Landing Page nào</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Tạo landing page đầu tiên để chuẩn bị cho chiến dịch truyền thông của khóa học.
              </p>
              <Button
                onClick={() => setIsCreating(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl mt-2"
              >
                <Plus className="mr-2 h-4 w-4" /> Tạo ngay
              </Button>
            </div>
          )}

          {!loading && landings.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Tiêu đề Landing</th>
                      <th className="px-6 py-3.5">Slug URL</th>
                      <th className="px-6 py-3.5">QA Checklist & Ads Readiness</th>
                      <th className="px-6 py-3.5">Trạng thái</th>
                      <th className="px-6 py-3.5">Cập nhật</th>
                      <th className="px-6 py-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {landings.map((item) => {
                      const hasCourse = !!(item.course_id || item.course);
                      const hasCover = !!item.hero_cover_url;
                      const hasAudience = !!(item.audience && item.audience.length > 0);
                      const hasOutcomes = !!(item.outcomes && item.outcomes.length > 0);
                      const hasFaqs = !!(item.faqs && item.faqs.length > 0);
                      const hasSeo = !!(item.seo_title && item.seo_description);

                      // Check if matching public batch exists for this campaign slug/course
                      const hasPublicBatch = publicSchedule.some((b: any) => {
                        const cSlug = (b.course?.slug || "").toLowerCase().trim();
                        const bSlug = (b.slug || "").toLowerCase().trim();
                        const targetSlug = item.slug.toLowerCase().trim();
                        return cSlug === targetSlug || bSlug === targetSlug || cSlug.includes(targetSlug) || targetSlug.includes(cSlug);
                      });

                      const hasFullContent = hasCover && hasAudience && hasOutcomes && hasFaqs && hasSeo;

                      let readinessBadge = {
                        label: "⚪ Bản nháp (Draft)",
                        cls: "bg-slate-100 text-slate-600 border-slate-200",
                      };

                      if (item.is_published) {
                        if (hasFullContent && hasPublicBatch) {
                          readinessBadge = {
                            label: "🟢 Sẵn sàng chạy Ads",
                            cls: "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold",
                          };
                        } else if (hasFullContent && !hasPublicBatch) {
                          readinessBadge = {
                            label: "🟡 Thiếu Lớp Public (CTA Thông Báo)",
                            cls: "bg-amber-50 text-amber-700 border-amber-300 font-bold",
                          };
                        } else {
                          readinessBadge = {
                            label: "🔵 Cần bổ sung nội dung",
                            cls: "bg-sky-50 text-sky-700 border-sky-300 font-bold",
                          };
                        }
                      }

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{item.title}</div>
                            {item.hero_badge && (
                              <div className="text-xs text-indigo-600 font-medium truncate max-w-xs">
                                {item.hero_badge}
                              </div>
                            )}
                          </td>

                          <td className="px-6 py-4 text-xs font-mono text-slate-600">
                            /l/{item.slug}
                          </td>

                          <td className="px-6 py-4 text-xs space-y-1.5">
                            <div>
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] border ${readinessBadge.cls}`}>
                                {readinessBadge.label}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${hasCourse ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-700"}`}>
                                {hasCourse ? "✓ Khóa" : "! Khóa"}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${hasCover ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-700"}`}>
                                {hasCover ? "✓ Cover" : "! Cover"}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${hasAudience ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-700"}`}>
                                {hasAudience ? "✓ Audience" : "! Audience"}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${hasOutcomes ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-700"}`}>
                                {hasOutcomes ? "✓ Outcomes" : "! Outcomes"}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${hasFaqs ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-700"}`}>
                                {hasFaqs ? "✓ FAQ" : "! FAQ"}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${hasSeo ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-700"}`}>
                                {hasSeo ? "✓ SEO" : "! SEO"}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${hasPublicBatch ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                                {hasPublicBatch ? "✓ Batch" : "! 0 Batch"}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleTogglePublish(item)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                                item.is_published
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                              }`}
                            >
                              {item.is_published ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Đã xuất bản</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Bản nháp</span>
                                </>
                              )}
                            </button>
                          </td>

                          <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                            {format(parseISO(item.updated_at), "dd/MM/yyyy HH:mm")}
                          </td>

                          <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => setChecklistLanding(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                              title="Xem Ads Launch Checklist & QA Audit"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>QA Launch</span>
                            </button>

                            <a
                              href={`/admin/academy-landings/${item.slug}/preview`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                            >
                              <span>Preview</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>

                            <a
                              href={`/l/${item.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                            >
                              <span>Xem public</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingLanding(item)}
                              className="rounded-lg text-slate-600 hover:text-slate-900"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={deletingId === item.id}
                              onClick={() => handleDelete(item.id, item.title)}
                              className="rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            >
                              {deletingId === item.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Ads Launch Checklist Modal */}
      <AdsLaunchChecklistModal
        landing={checklistLanding}
        publicSchedule={publicSchedule}
        isOpen={!!checklistLanding}
        onClose={() => setChecklistLanding(null)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Form Component
// ─────────────────────────────────────────────────────────────────────────────
interface LandingFormProps {
  landing: AcademyLandingPage | null;
  courses: AcademyAdminCourseListItem[];
  onDone: () => void;
  onCancel: () => void;
}

function LandingForm({ landing, courses, onDone, onCancel }: LandingFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Core fields
  const [title, setTitle] = useState(landing?.title || "");
  const [slug, setSlug] = useState(landing?.slug || "");
  const [courseId, setCourseId] = useState(landing?.course_id || "");
  const [isPublished, setIsPublished] = useState(landing?.is_published ?? false);

  // Hero fields
  const [heroBadge, setHeroBadge] = useState(landing?.hero_badge || "");
  const [heroTitle, setHeroTitle] = useState(landing?.hero_title || "");
  const [heroSubtitle, setHeroSubtitle] = useState(landing?.hero_subtitle || "");
  const [heroCoverUrl, setHeroCoverUrl] = useState(landing?.hero_cover_url || "");
  const [primaryCtaLabel, setPrimaryCtaLabel] = useState(landing?.primary_cta_label || "Đăng ký lớp gần nhất");
  const [secondaryCtaLabel, setSecondaryCtaLabel] = useState(landing?.secondary_cta_label || "Nhận tư vấn lộ trình");

  // SEO fields
  const [seoTitle, setSeoTitle] = useState(landing?.seo_title || "");
  const [seoDescription, setSeoDescription] = useState(landing?.seo_description || "");
  const [ogImageUrl, setOgImageUrl] = useState(landing?.og_image_url || "");

  // Dynamic JSON Lists
  const [audience, setAudience] = useState<LandingAudienceItem[]>(landing?.audience || []);
  const [outcomes, setOutcomes] = useState<LandingOutcomeItem[]>(landing?.outcomes || []);
  const [faqs, setFaqs] = useState<LandingFaqItem[]>(landing?.faqs || []);

  const inputCls = "flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500";
  const selectCls = "w-full flex h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500";

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!landing) {
      setSlug(generateSlug(val));
    }
  };

  const handleSave = async (publishTargetState: boolean) => {
    const cleanTitle = title.trim();
    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");

    if (!cleanTitle) {
      setError("Vui lòng nhập tiêu đề landing page.");
      return;
    }
    if (!cleanSlug) {
      setError("Vui lòng nhập slug hợp lệ (chữ thường, gạch nối).");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: CreateLandingPagePayload = {
        title: cleanTitle,
        slug: cleanSlug,
        course_id: courseId || null,
        hero_badge: heroBadge.trim() || null,
        hero_title: heroTitle.trim() || cleanTitle,
        hero_subtitle: heroSubtitle.trim() || null,
        hero_cover_url: heroCoverUrl.trim() || null,
        primary_cta_label: primaryCtaLabel.trim(),
        secondary_cta_label: secondaryCtaLabel.trim(),
        audience,
        outcomes,
        faqs,
        seo_title: seoTitle.trim() || cleanTitle,
        seo_description: seoDescription.trim() || null,
        og_image_url: ogImageUrl.trim() || heroCoverUrl.trim() || null,
        is_published: publishTargetState,
      };

      if (landing) {
        await updateLandingPage(landing.id, payload);
      } else {
        await createLandingPage(payload);
      }

      onDone();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Không thể lưu thông tin landing page.");
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave(isPublished);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 text-slate-800">
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Basic Configuration */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-600" />
          <span>Thông tin chung</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Tên Landing Page *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className={inputCls}
              placeholder="VD: SYNERGISTIC PROTOCOL"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Đường dẫn (Slug URL) *</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className={inputCls}
              placeholder="VD: synergistic-protocol"
              required
            />
            <p className="text-[11px] text-slate-500">Public URL: /l/{slug || "slug"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Khóa học liên kết (Course)</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className={selectCls}
            >
              <option value="">-- Chưa gán khóa học --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.slug})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500">Trang public sẽ lọc lớp (batch) thuộc khóa học này.</p>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              <span className="ml-3 text-xs font-bold text-slate-800">Xuất bản công khai (Is Published)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Hero Section Configuration */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Cấu hình Hero Banner</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Badge trên tiêu đề</label>
            <input
              type="text"
              value={heroBadge}
              onChange={(e) => setHeroBadge(e.target.value)}
              className={inputCls}
              placeholder="VD: DESEMBRE ACADEMY • KHÓA ĐÀO TẠO CHUYÊN SÂU"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Tiêu đề lớn (Hero Title)</label>
            <input
              type="text"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              className={inputCls}
              placeholder="Mặc định lấy Tên Landing Page"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Mô tả phụ (Hero Subtitle)</label>
          <textarea
            value={heroSubtitle}
            onChange={(e) => setHeroSubtitle(e.target.value)}
            className="w-full h-20 rounded-xl border border-slate-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            placeholder="Mô tả hấp dẫn về khóa học giúp tăng tỷ lệ chuyển đổi..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Link Ảnh Hero Cover (URL)</label>
            <input
              type="text"
              value={heroCoverUrl}
              onChange={(e) => setHeroCoverUrl(e.target.value)}
              className={inputCls}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Nút CTA Chính</label>
            <input
              type="text"
              value={primaryCtaLabel}
              onChange={(e) => setPrimaryCtaLabel(e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Nút CTA Phụ</label>
            <input
              type="text"
              value={secondaryCtaLabel}
              onChange={(e) => setSecondaryCtaLabel(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* Audience Cards Builder */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Khóa học dành cho ai? (Audience)</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAudience([...audience, { title: "", description: "" }])}
            className="rounded-xl text-xs font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Thêm đối tượng
          </Button>
        </div>

        {audience.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Chưa thêm đối tượng học viên.</p>
        ) : (
          <div className="space-y-3">
            {audience.map((item, idx) => (
              <div key={idx} className="flex gap-3 items-start p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => {
                      const updated = [...audience];
                      updated[idx].title = e.target.value;
                      setAudience(updated);
                    }}
                    className={inputCls}
                    placeholder="Tiêu đề nhóm đối tượng (VD: Chủ Spa / Clinic)"
                  />
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => {
                      const updated = [...audience];
                      updated[idx].description = e.target.value;
                      setAudience(updated);
                    }}
                    className={inputCls}
                    placeholder="Mô tả lý do phù hợp..."
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAudience(audience.filter((_, i) => i !== idx))}
                  className="text-rose-600 hover:bg-rose-50 rounded-lg shrink-0 mt-1"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Outcome Cards Builder */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Kết quả học được (Outcomes)</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOutcomes([...outcomes, { title: "", description: "" }])}
            className="rounded-xl text-xs font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Thêm kết quả
          </Button>
        </div>

        {outcomes.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Chưa thêm kết quả học tập.</p>
        ) : (
          <div className="space-y-3">
            {outcomes.map((item, idx) => (
              <div key={idx} className="flex gap-3 items-start p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => {
                      const updated = [...outcomes];
                      updated[idx].title = e.target.value;
                      setOutcomes(updated);
                    }}
                    className={inputCls}
                    placeholder="Tên năng lực / giá trị đạt được"
                  />
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => {
                      const updated = [...outcomes];
                      updated[idx].description = e.target.value;
                      setOutcomes(updated);
                    }}
                    className={inputCls}
                    placeholder="Mô tả chi tiết năng lực..."
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setOutcomes(outcomes.filter((_, i) => i !== idx))}
                  className="text-rose-600 hover:bg-rose-50 rounded-lg shrink-0 mt-1"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAQ Builder */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Câu hỏi thường gặp (FAQs)</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setFaqs([...faqs, { q: "", a: "" }])}
            className="rounded-xl text-xs font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Thêm câu hỏi
          </Button>
        </div>

        {faqs.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Chưa thêm câu hỏi thường gặp.</p>
        ) : (
          <div className="space-y-3">
            {faqs.map((item, idx) => (
              <div key={idx} className="flex gap-3 items-start p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={item.q}
                    onChange={(e) => {
                      const updated = [...faqs];
                      updated[idx].q = e.target.value;
                      setFaqs(updated);
                    }}
                    className={inputCls}
                    placeholder="Câu hỏi (VD: Khóa học có hỗ trợ online không?)"
                  />
                  <textarea
                    value={item.a}
                    onChange={(e) => {
                      const updated = [...faqs];
                      updated[idx].a = e.target.value;
                      setFaqs(updated);
                    }}
                    className="w-full h-16 rounded-xl border border-slate-200 bg-white p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="Câu trả lời chi tiết..."
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFaqs(faqs.filter((_, i) => i !== idx))}
                  className="text-rose-600 hover:bg-rose-50 rounded-lg shrink-0 mt-1"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SEO Metadata */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <h3 className="text-base font-bold text-slate-900">SEO & Metadata Social</h3>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Thẻ SEO Title</label>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              className={inputCls}
              placeholder="VD: SYNERGISTIC PROTOCOL | DESEMBRE Academy"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Thẻ SEO Description</label>
            <textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              className="w-full h-16 rounded-xl border border-slate-200 bg-white p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="Mô tả cho Google Search & Social Card..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Link Ảnh Chia Sẻ Social (OG Image URL)</label>
            <input
              type="text"
              value={ogImageUrl}
              onChange={(e) => setOgImageUrl(e.target.value)}
              className={inputCls}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-200">
        <div>
          {slug && (
            <a
              href={`/admin/academy-landings/${slug}/preview`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 h-11 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
            >
              <span>Xem preview admin</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="rounded-xl px-5 h-11 font-semibold"
          >
            Hủy
          </Button>

          <Button
            type="button"
            disabled={submitting}
            onClick={() => handleSave(false)}
            className="rounded-xl px-6 h-11 font-bold bg-slate-800 hover:bg-slate-900 text-white shadow-sm"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu bản nháp
          </Button>

          <Button
            type="button"
            disabled={submitting}
            onClick={() => handleSave(true)}
            className="rounded-xl px-7 h-11 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xuất bản ngay
          </Button>
        </div>
      </div>
    </form>
  );
}
