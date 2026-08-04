import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, HelpCircle, Sparkles } from "lucide-react";
import { AcademyLandingPage } from "@/features/admin/services/academyAdminLandingPagesApi";
import { PublicCourseBatch } from "@/features/public-training/services/publicTrainingApi";
import { trackLandingEvent } from "@/features/public-training/utils/landingTracking";
import { RegistrationForm } from "@/features/public-training/components/RegistrationForm";
import { RegistrationSuccess } from "@/features/public-training/components/RegistrationSuccess";
import { LandingHero } from "./LandingHero";
import { LandingAudienceSection } from "./LandingAudienceSection";
import { LandingOutcomesSection } from "./LandingOutcomesSection";
import { LandingAgendaSection } from "./LandingAgendaSection";
import { LandingInstructorSection } from "./LandingInstructorSection";
import { LandingFAQSection } from "./LandingFAQSection";
import { LandingStickyCTA } from "./LandingStickyCTA";
import { AcademyOrder } from "@/features/public-training/services/ordersApi";

interface CampaignLandingTemplateProps {
  slug: string;
  landing?: AcademyLandingPage | null;
  batches: PublicCourseBatch[];
  loading?: boolean;
  isAdmin?: boolean;
  isAdminLoading?: boolean;
  isForceAdminPreview?: boolean;
  onRefreshSchedule?: () => void;
}

export function CampaignLandingTemplate({
  slug,
  landing,
  batches,
  loading,
  isAdmin = false,
  isAdminLoading = false,
  isForceAdminPreview = false,
  onRefreshSchedule,
}: CampaignLandingTemplateProps) {
  const [registeringBatch, setRegisteringBatch] = useState<PublicCourseBatch | null>(null);
  const [initialNotes, setInitialNotes] = useState<string | undefined>(undefined);
  const [successBatchTitle, setSuccessBatchTitle] = useState<string | null>(null);
  const [isDuplicateRegistration, setIsDuplicateRegistration] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<AcademyOrder | null>(null);

  const isPreviewRequested = useMemo(() => {
    if (isForceAdminPreview) return true;
    if (typeof window === "undefined") return false;
    const sp = new URLSearchParams(window.location.search);
    return sp.get("preview") === "1" || window.location.pathname.includes("/admin/");
  }, [isForceAdminPreview]);

  const isPublished = landing?.is_published ?? true;
  const isPreviewMode = !isPublished && isPreviewRequested && isAdmin;

  const hasTrackedView = useRef(false);

  useEffect(() => {
    // DO NOT track landing_view if in preview mode or unpublished draft!
    if (!hasTrackedView.current && isPublished && !isPreviewRequested) {
      hasTrackedView.current = true;

      let utm_source: string | undefined;
      let utm_medium: string | undefined;
      let utm_campaign: string | undefined;

      if (typeof window !== "undefined") {
        const sp = new URLSearchParams(window.location.search);
        utm_source = sp.get("utm_source") || undefined;
        utm_medium = sp.get("utm_medium") || undefined;
        utm_campaign = sp.get("utm_campaign") || undefined;
      }

      trackLandingEvent("landing_view", {
        campaign_slug: slug,
        source: "landing_page",
        utm_source,
        utm_medium,
        utm_campaign,
      });
    }
  }, [slug, isPublished, isPreviewRequested]);

  // Dynamically inject noindex, nofollow for Draft / Preview mode
  useEffect(() => {
    if (!isPublished || isPreviewRequested) {
      let metaTag = document.querySelector('meta[name="robots"]');
      if (!metaTag) {
        metaTag = document.createElement("meta");
        metaTag.setAttribute("name", "robots");
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute("content", "noindex, nofollow");
    }
  }, [isPublished, isPreviewRequested]);

  const hasPublicBatch = batches.length > 0;
  const openBatch = hasPublicBatch ? batches[0] : null;

  const title = landing?.hero_title || landing?.title || openBatch?.course?.title || openBatch?.title || `Chuyên đề ${slug}`;
  const subtitle = landing?.hero_subtitle || openBatch?.course?.summary || null;
  const badge = landing?.hero_badge || null;

  const coverUrl = useMemo(() => {
    if (landing?.hero_cover_url) return landing.hero_cover_url;
    if (batches.length > 0 && batches[0].course?.cover_url) return batches[0].course.cover_url;
    return null;
  }, [landing, batches]);

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

  const handleOpenRegister = useCallback(
    (batch?: PublicCourseBatch, notes?: string) => {
      const targetBatch = batch || openBatch;
      if (!targetBatch) return;

      let utm_source: string | undefined;
      let utm_medium: string | undefined;
      let utm_campaign: string | undefined;

      if (typeof window !== "undefined") {
        const sp = new URLSearchParams(window.location.search);
        utm_source = sp.get("utm_source") || undefined;
        utm_medium = sp.get("utm_medium") || undefined;
        utm_campaign = sp.get("utm_campaign") || undefined;
      }

      trackLandingEvent("landing_cta_click", {
        batch_id: targetBatch.id,
        batch_title: targetBatch.title,
        campaign_slug: slug,
        source: isPreviewMode ? "preview" : "landing_page",
        isPreview: isPreviewMode,
        utm_source,
        utm_medium,
        utm_campaign,
      });
      setInitialNotes(notes);
      setRegisteringBatch(targetBatch);
      trackLandingEvent("registration_form_open", {
        batch_id: targetBatch.id,
        batch_title: targetBatch.title,
        campaign_slug: slug,
        source: isPreviewMode ? "preview" : "landing_page",
        isPreview: isPreviewMode,
        utm_source,
        utm_medium,
        utm_campaign,
      });
    },
    [openBatch, slug, isPreviewMode]
  );

  const handleOpenConsult = useCallback(() => {
    trackLandingEvent("landing_cta_click", { campaign_slug: slug, source: isPreviewMode ? "preview" : "landing_page", isPreview: isPreviewMode });
    if (hasPublicBatch && openBatch) {
      handleOpenRegister(openBatch, `Tôi muốn được tư vấn thêm về ${title} trước khi đăng ký.`);
    } else {
      window.open("https://zalo.me", "_blank");
    }
  }, [hasPublicBatch, openBatch, handleOpenRegister, slug, title, isPreviewMode]);

  const handleCloseRegister = () => {
    setRegisteringBatch(null);
    setInitialNotes(undefined);
  };

  const handleSuccess = (isDuplicate?: boolean, order?: AcademyOrder | null) => {
    if (registeringBatch) {
      const bTitle = registeringBatch.course?.title || registeringBatch.title;
      setSuccessBatchTitle(bTitle);
      setCreatedOrder(order || null);
      trackLandingEvent("registration_submit_success", {
        batch_id: registeringBatch.id,
        batch_title: bTitle,
        campaign_slug: slug,
        source: isPreviewMode ? "preview" : "landing_page",
        isPreview: isPreviewMode,
        duplicate: !!isDuplicate,
      });
    }
    setIsDuplicateRegistration(!!isDuplicate);
    setRegisteringBatch(null);
    setInitialNotes(undefined);
    if (onRefreshSchedule) onRefreshSchedule();
  };

  if (loading || (isPreviewRequested && !isPublished && isAdminLoading)) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400" />
      </div>
    );
  }

  // Case A: Landing is Unpublished and request is NOT preview -> Render Public Not Published Card
  if (!isPublished && !isPreviewRequested) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
        <SiteHeader />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full space-y-4 bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20">
              <Calendar className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-white">Trang Chiến Dịch Chưa Xuất Bản</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Trang chiến dịch <span className="text-white font-bold">{slug}</span> hiện đang ở trạng thái bản nháp. Vui lòng tham khảo các lớp khai giảng mới nhất tại Lịch Khai Giảng.
            </p>
            <Link to="/lich-khai-giang">
              <Button className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl mt-2 shadow-lg shadow-indigo-600/30">
                Xem Lịch Khai Giảng Công Khai
              </Button>
            </Link>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  // Case B: Landing is Unpublished and preview requested, but user is NOT ADMIN -> Access Denied Card
  if (!isPublished && isPreviewRequested && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
        <SiteHeader />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full space-y-4 bg-slate-900 border border-rose-900/50 p-8 rounded-3xl shadow-2xl">
            <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20">
              <Sparkles className="w-8 h-8 text-rose-400" />
            </div>
            <h2 className="text-xl font-extrabold text-white">Không Có Quyền Xem Preview</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Chức năng preview bản nháp chỉ dành riêng cho Quản trị viên (Admin). Vui lòng đăng nhập tài khoản admin để truy cập.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link to="/auth/login" className="flex-1">
                <Button className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs">
                  Đăng Nhập Admin
                </Button>
              </Link>
              <Link to="/lich-khai-giang" className="flex-1">
                <Button variant="outline" className="w-full h-11 bg-white/5 border-white/15 text-white font-bold rounded-xl text-xs">
                  Lịch Khai Giảng
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Admin Preview Top Notice Banner */}
      {!isPublished && isPreviewRequested && isAdmin && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-black text-center flex items-center justify-center gap-2 sticky top-0 z-50 shadow-lg uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
          <span>[CHẾ ĐỘ PREVIEW ADMIN] Bạn đang xem bản preview. Trang này chưa được xuất bản công khai.</span>
        </div>
      )}

      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <LandingHero
          title={title}
          subtitle={subtitle}
          badge={badge}
          coverUrl={coverUrl}
          primaryCtaLabel={landing?.primary_cta_label}
          secondaryCtaLabel={landing?.secondary_cta_label}
          hasPublicBatch={hasPublicBatch}
          openBatch={openBatch}
          onOpenRegister={() => handleOpenRegister(openBatch || undefined)}
          onScrollToSchedule={handleScrollToSchedule}
          onOpenConsult={handleOpenConsult}
        />

        {/* Audience Section */}
        <LandingAudienceSection audience={landing?.audience} />

        {/* Outcomes Section */}
        <LandingOutcomesSection outcomes={landing?.outcomes} />

        {/* Schedule / Agenda Section */}
        <LandingAgendaSection
          batches={batches}
          onOpenRegister={(b) => handleOpenRegister(b)}
          onOpenConsult={handleOpenConsult}
        />

        {/* Instructor Section */}
        <LandingInstructorSection instructor={activeInstructor} />

        {/* FAQ Section */}
        <LandingFAQSection faqs={landing?.faqs} />
      </main>

      <SiteFooter />

      {/* Mobile Sticky CTA */}
      <LandingStickyCTA
        title={title}
        hasPublicBatch={hasPublicBatch}
        onOpenRegister={() => handleOpenRegister(openBatch || undefined)}
        onOpenConsult={handleOpenConsult}
      />

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
          courseSlug={slug}
          order={createdOrder}
          onClose={() => {
            setSuccessBatchTitle(null);
            setCreatedOrder(null);
          }}
        />
      )}
    </div>
  );
}
