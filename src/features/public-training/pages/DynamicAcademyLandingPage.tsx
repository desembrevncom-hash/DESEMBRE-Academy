import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import {
  getPublicTrainingSchedule,
  PublicCourseBatch,
} from "@/features/public-training/services/publicTrainingApi";
import {
  getLandingPageBySlug,
  AcademyLandingPage,
} from "@/features/admin/services/academyAdminLandingPagesApi";
import { SynergisticProtocolHero } from "@/features/public-training/components/SynergisticProtocolHero";
import { SynergisticAudienceSection } from "@/features/public-training/components/SynergisticAudienceSection";
import { SynergisticOutcomeSection } from "@/features/public-training/components/SynergisticOutcomeSection";
import { SynergisticSessionSection } from "@/features/public-training/components/SynergisticSessionSection";
import { SynergisticTrustSection } from "@/features/public-training/components/SynergisticTrustSection";
import { SynergisticFaqSection } from "@/features/public-training/components/SynergisticFaqSection";
import { CompactInstructorCard } from "@/features/public-training/components/CompactInstructorCard";
import { TrainingScheduleCard } from "@/features/public-training/components/TrainingScheduleCard";
import { RegistrationForm } from "@/features/public-training/components/RegistrationForm";
import { RegistrationSuccess } from "@/features/public-training/components/RegistrationSuccess";
import { PublicStickyCTA } from "@/components/layout/PublicStickyCTA";
import { trackLandingEvent } from "@/features/public-training/utils/landingTracking";
import { Loader2, Calendar, MessageSquare, ArrowRight, AlertCircle, UserCheck, Layers, Award, Users, Building2, Stethoscope, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isDemoRecord } from "@/features/admin/utils/demoData";

interface DynamicAcademyLandingPageProps {
  slug: string;
  canonicalPath?: string;
}

export function DynamicAcademyLandingPage({ slug, canonicalPath }: DynamicAcademyLandingPageProps) {
  const [landing, setLanding] = useState<AcademyLandingPage | null>(null);
  const [batches, setBatches] = useState<PublicCourseBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [registeringBatch, setRegisteringBatch] = useState<PublicCourseBatch | null>(null);
  const [initialNotes, setInitialNotes] = useState<string | undefined>(undefined);
  const [successBatchTitle, setSuccessBatchTitle] = useState<string | null>(null);
  const [isDuplicateRegistration, setIsDuplicateRegistration] = useState(false);

  const loadLandingData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Landing Page Configuration from DB
      const landingData = await getLandingPageBySlug(slug);
      if (!landingData || (!landingData.is_published && typeof window !== "undefined")) {
        setLanding(null);
        setLoading(false);
        return;
      }
      setLanding(landingData);

      // 2. Set Page Title & Meta Tags dynamically
      if (typeof document !== "undefined") {
        const rawTitle = landingData.seo_title || landingData.title || "DESEMBRE Training Center";
        const pageTitle = rawTitle.includes("DESEMBRE") ? rawTitle : `${rawTitle} | DESEMBRE Training Center`;
        const description = landingData.seo_description || landingData.hero_subtitle || "Trung tâm đào tạo chuyên sâu dành cho khách hàng, đối tác và đội ngũ DESEMBRE.";
        const rawCover = landingData.hero_cover_url;
        const ogImage = rawCover && (rawCover.startsWith("http://") || rawCover.startsWith("https://"))
          ? rawCover
          : "https://academy.desembre-vn.com/og/academy-home.jpg";
        const targetCanonicalPath = canonicalPath || (slug === "synergistic-protocol" ? "/synergistic-protocol" : `/l/${slug}`);
        const canonicalUrl = `https://academy.desembre-vn.com${targetCanonicalPath}`;

        document.title = pageTitle;

        const setMetaTag = (attr: string, key: string, content: string) => {
          let el = document.querySelector(`meta[${attr}="${key}"]`);
          if (!el) {
            el = document.createElement("meta");
            el.setAttribute(attr, key);
            document.head.appendChild(el);
          }
          el.setAttribute("content", content);
        };

        setMetaTag("name", "description", description);
        setMetaTag("property", "og:title", pageTitle);
        setMetaTag("property", "og:description", description);
        setMetaTag("property", "og:image", ogImage);
        setMetaTag("property", "og:url", canonicalUrl);
        setMetaTag("name", "twitter:title", pageTitle);
        setMetaTag("name", "twitter:description", description);
        setMetaTag("name", "twitter:image", ogImage);

        let linkEl = document.querySelector('link[rel="canonical"]');
        if (!linkEl) {
          linkEl = document.createElement("link");
          linkEl.setAttribute("rel", "canonical");
          document.head.appendChild(linkEl);
        }
        linkEl.setAttribute("href", canonicalUrl);
      }

      // 3. Fetch Public Batches & Filter by Course ID or fallback title/slug
      const allBatches = await getPublicTrainingSchedule();
      const filtered = allBatches.filter((b) => {
        if (isDemoRecord(b)) return false;
        const status = (b.registration_status || "").toLowerCase().trim();
        if (status !== "open") return false;

        if (landingData.course_id) {
          return b.course?.id === landingData.course_id;
        }

        // Fallback match by slug or title
        const slugMatch = b.course?.slug === landingData.slug;
        const titleMatch =
          (b.course?.title || "").toLowerCase().includes(landingData.title.toLowerCase()) ||
          (b.title || "").toLowerCase().includes(landingData.title.toLowerCase());

        return slugMatch || titleMatch;
      });

      setBatches(filtered);
    } catch (err: any) {
      console.error("loadLandingData error:", err);
      setError("Không thể tải thông tin landing page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLandingData();
    trackLandingEvent("campaign_landing_view", { slug, canonical_path: canonicalPath || `/l/${slug}` });
  }, [slug, canonicalPath]);

  const coverUrl = useMemo(() => {
    if (landing?.hero_cover_url) return landing.hero_cover_url;
    if (batches.length > 0 && batches[0].course?.cover_url) return batches[0].course.cover_url;
    return null;
  }, [landing, batches]);

  const activeSessions = useMemo(() => {
    if (batches.length > 0 && batches[0].sessions) return batches[0].sessions;
    return [];
  }, [batches]);

  const activeInstructor = useMemo(() => {
    if (batches.length > 0 && batches[0].instructor) return batches[0].instructor;
    return null;
  }, [batches]);

  const handleScrollToSchedule = useCallback(() => {
    const el = document.getElementById("campaign-schedule-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const handleOpenRegister = useCallback((batch: PublicCourseBatch, notes?: string) => {
    trackLandingEvent("campaign_primary_cta_click", { batch_id: batch.id, batch_title: batch.title, slug });
    setInitialNotes(notes);
    setRegisteringBatch(batch);
    trackLandingEvent("campaign_registration_open", { batch_id: batch.id, slug });
  }, [slug]);

  const handleOpenConsult = useCallback(() => {
    trackLandingEvent("campaign_consult_cta_click", { slug });
    if (batches.length > 0) {
      handleOpenRegister(batches[0], `Tôi muốn được tư vấn thêm về khóa ${landing?.title || ""} trước khi đăng ký.`);
    } else {
      window.open("https://zalo.me", "_blank");
    }
  }, [batches, landing, handleOpenRegister, slug]);

  const handleCloseRegister = () => {
    setRegisteringBatch(null);
    setInitialNotes(undefined);
  };

  const handleSuccess = (isDuplicate?: boolean) => {
    if (registeringBatch) {
      const title = registeringBatch.course?.title || registeringBatch.title;
      setSuccessBatchTitle(title);
      if (isDuplicate) {
        trackLandingEvent("campaign_duplicate_registration", { batch_title: title, slug });
      } else {
        trackLandingEvent("campaign_registration_success", { batch_title: title, slug });
      }
    }
    setIsDuplicateRegistration(!!isDuplicate);
    setRegisteringBatch(null);
    setInitialNotes(undefined);
    loadLandingData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Unpublished or missing landing page -> Friendly 404
  if (!landing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
        <SiteHeader />
        <main className="container mx-auto px-4 max-w-md py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Trang chưa được xuất bản</h1>
          <p className="text-sm text-slate-500">
            Landing page này hiện chưa sẵn sàng hoặc đường dẫn không đúng. Vui lòng quay lại lịch khai giảng.
          </p>
          <Button asChild className="rounded-xl px-6 bg-indigo-600 hover:bg-indigo-700">
            <Link to="/lich-khai-giang">Xem lịch khai giảng</Link>
          </Button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-24 font-sans antialiased text-slate-900">
      <SiteHeader />

      {/* Hero Landing */}
      <SynergisticProtocolHero
        title={landing.hero_title || landing.title}
        subtitle={landing.hero_subtitle}
        badge={landing.hero_badge}
        primaryCtaLabel={landing.primary_cta_label}
        secondaryCtaLabel={landing.secondary_cta_label}
        coverUrl={coverUrl}
        onScrollToSchedule={handleScrollToSchedule}
        onConsult={handleOpenConsult}
      />

      <main className="container mx-auto px-4 max-w-5xl py-10 sm:py-14 space-y-10 sm:space-y-12">
        {/* 1. Audience Section */}
        {landing.audience && landing.audience.length > 0 ? (
          <DynamicAudienceSection
            audience={landing.audience}
            onScrollToSchedule={handleScrollToSchedule}
            onOpenConsult={handleOpenConsult}
          />
        ) : (
          <SynergisticAudienceSection
            onScrollToSchedule={handleScrollToSchedule}
            onOpenConsult={handleOpenConsult}
          />
        )}

        {/* 2. Outcome Section */}
        {landing.outcomes && landing.outcomes.length > 0 ? (
          <DynamicOutcomeSection
            outcomes={landing.outcomes}
            onScrollToSchedule={handleScrollToSchedule}
            onOpenConsult={handleOpenConsult}
          />
        ) : (
          <SynergisticOutcomeSection
            onScrollToSchedule={handleScrollToSchedule}
            onOpenConsult={handleOpenConsult}
          />
        )}

        {/* 3. Session Content Section */}
        <SynergisticSessionSection
          sessions={activeSessions}
          onScrollToSchedule={handleScrollToSchedule}
          onOpenConsult={handleOpenConsult}
        />

        {/* 4. Trust Section */}
        <SynergisticTrustSection />

        {/* 5. Instructor Section */}
        <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600">
              <UserCheck className="w-4 h-4" />
              <span>Chuyên gia giảng dạy</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Giảng viên phụ trách
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Đội ngũ chuyên gia Da liễu & Thẩm mỹ giàu kinh nghiệm lâm sàng của DESEMBRE Training Center.
            </p>
          </div>

          <div className="pt-2">
            <CompactInstructorCard instructor={activeInstructor} />
          </div>
        </section>

        {/* 6. Open Batches Section */}
        <section id="campaign-schedule-section" className="space-y-6">
          {error && (
            <div className="text-center py-12 max-w-md mx-auto bg-white border border-red-100 rounded-3xl p-6 shadow-sm">
              <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-2" />
              <p className="text-sm text-slate-500 mb-4">{error}</p>
              <Button onClick={loadLandingData} variant="outline" className="rounded-xl px-6">
                Thử lại
              </Button>
            </div>
          )}

          {!error && batches.length === 0 && (
            <div className="text-center py-16 border border-slate-200/80 rounded-3xl bg-white p-8 shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Calendar className="h-8 w-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                Chưa có lớp {landing.title} đang mở
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                Bạn có thể để lại thông tin tư vấn hoặc quay lại lịch khai giảng để xem các lớp khác.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                <Button asChild className="rounded-xl px-6 h-11 font-semibold bg-indigo-600 hover:bg-indigo-700">
                  <Link to="/lich-khai-giang" className="flex items-center gap-2">
                    <span>Xem lịch khai giảng</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>

                <Button onClick={handleOpenConsult} variant="outline" className="rounded-xl px-6 h-11 font-semibold border-slate-200">
                  <MessageSquare className="mr-2 w-4 h-4 text-indigo-600" />
                  <span>Nhận tư vấn lộ trình</span>
                </Button>
              </div>
            </div>
          )}

          {!error && batches.length > 0 && (
            <div className="space-y-6">
              <div className="px-1 space-y-1">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Lớp {landing.title} đang mở đăng ký ({batches.length})
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Chọn lớp phù hợp và gửi thông tin để DESEMBRE Training Center xác nhận qua Zalo/điện thoại.
                </p>
              </div>

              {batches.map((batch) => (
                <TrainingScheduleCard
                  key={batch.id}
                  batch={batch}
                  onRegister={(b) => handleOpenRegister(b)}
                />
              ))}
            </div>
          )}
        </section>

        {/* 7. FAQ Section */}
        {landing.faqs && landing.faqs.length > 0 ? (
          <SynergisticFaqSection
            onScrollToSchedule={handleScrollToSchedule}
            onOpenConsult={handleOpenConsult}
          />
        ) : (
          <SynergisticFaqSection
            onScrollToSchedule={handleScrollToSchedule}
            onOpenConsult={handleOpenConsult}
          />
        )}
      </main>

      <SiteFooter />

      {/* Registration Drawer */}
      {registeringBatch && (
        <RegistrationForm
          batch={registeringBatch}
          initialNotes={initialNotes}
          source="landing_page"
          campaignSlug={slug}
          onClose={handleCloseRegister}
          onSuccess={handleSuccess}
        />
      )}

      {/* Registration Success Modal */}
      {successBatchTitle && (
        <RegistrationSuccess
          batchTitle={successBatchTitle}
          isDuplicate={isDuplicateRegistration}
          onClose={() => setSuccessBatchTitle(null)}
        />
      )}

      {/* Mobile Sticky CTA */}
      {!registeringBatch && (
        <PublicStickyCTA
          primaryLabel="Đăng ký học"
          onPrimaryClick={() => {
            if (batches.length > 0) {
              handleOpenRegister(batches[0]);
            } else {
              handleScrollToSchedule();
            }
          }}
          onConsultClick={handleOpenConsult}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Sub-components
// ─────────────────────────────────────────────────────────────────────────────
function DynamicAudienceSection({
  audience,
  onScrollToSchedule,
  onOpenConsult,
}: {
  audience: { title: string; description: string }[];
  onScrollToSchedule: () => void;
  onOpenConsult: () => void;
}) {
  const icons = [Building2, Stethoscope, MessageSquare, Sparkles];

  return (
    <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600">
          <Users className="w-4 h-4" />
          <span>Đối tượng học viên</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Khóa học này dành cho ai?
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {audience.map((item, idx) => {
          const Icon = icons[idx % icons.length];
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-100 transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 bg-indigo-50 border-indigo-100 text-indigo-600">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 text-center sm:text-left">
        <span className="text-xs text-slate-500 font-medium">Bạn thuộc nhóm đối tượng trên?</span>
        <div className="flex flex-wrap items-center justify-center gap-2.5 w-full sm:w-auto">
          <Button
            onClick={onScrollToSchedule}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto h-10 rounded-xl text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <span>Xem lớp đang mở</span>
            <ArrowRight className="ml-1 w-3.5 h-3.5" />
          </Button>
          <Button
            onClick={onOpenConsult}
            size="sm"
            className="w-full sm:w-auto h-10 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          >
            Nhận tư vấn trước
          </Button>
        </div>
      </div>
    </section>
  );
}

function DynamicOutcomeSection({
  outcomes,
  onScrollToSchedule,
  onOpenConsult,
}: {
  outcomes: { title: string; description: string }[];
  onScrollToSchedule: () => void;
  onOpenConsult: () => void;
}) {
  return (
    <section className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/20 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-300">
          <Award className="w-4 h-4 text-amber-300" />
          <span>Giá trị thực tiễn</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          Bạn sẽ học được gì sau khóa học?
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {outcomes.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm space-y-2 hover:bg-white/15 transition-colors"
          >
            <div className="flex items-center gap-2 font-bold text-sm text-white">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4 text-indigo-300" />
              </div>
              <span>{item.title}</span>
            </div>
            <p className="text-xs text-indigo-200/70 leading-relaxed pl-9">
              {item.description}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10 text-center sm:text-left">
        <span className="text-xs text-indigo-200/80 font-medium">Sẵn sàng nâng cao kỹ năng ứng dụng?</span>
        <div className="flex flex-wrap items-center justify-center gap-2.5 w-full sm:w-auto">
          <Button
            onClick={onScrollToSchedule}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto h-10 rounded-xl text-xs font-bold bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <span>Xem lớp đang mở</span>
            <ArrowRight className="ml-1 w-3.5 h-3.5" />
          </Button>
          <Button
            onClick={onOpenConsult}
            size="sm"
            className="w-full sm:w-auto h-10 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30"
          >
            Nhận tư vấn trước
          </Button>
        </div>
      </div>
    </section>
  );
}
