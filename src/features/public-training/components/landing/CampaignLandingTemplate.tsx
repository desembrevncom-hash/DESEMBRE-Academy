import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, HelpCircle } from "lucide-react";
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

interface CampaignLandingTemplateProps {
  slug: string;
  landing?: AcademyLandingPage | null;
  batches: PublicCourseBatch[];
  loading?: boolean;
  onRefreshSchedule?: () => void;
}

export function CampaignLandingTemplate({
  slug,
  landing,
  batches,
  loading,
  onRefreshSchedule,
}: CampaignLandingTemplateProps) {
  const [registeringBatch, setRegisteringBatch] = useState<PublicCourseBatch | null>(null);
  const [initialNotes, setInitialNotes] = useState<string | undefined>(undefined);
  const [successBatchTitle, setSuccessBatchTitle] = useState<string | null>(null);
  const [isDuplicateRegistration, setIsDuplicateRegistration] = useState(false);

  const hasTrackedView = useRef(false);

  useEffect(() => {
    if (!hasTrackedView.current) {
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
  }, [slug]);

  const hasPublicBatch = batches.length > 0;
  const openBatch = hasPublicBatch ? batches[0] : null;

  const title = landing?.title || openBatch?.course?.title || openBatch?.title || `Chuyên đề ${slug}`;
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
        source: "landing_page",
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
        source: "landing_page",
        utm_source,
        utm_medium,
        utm_campaign,
      });
    },
    [openBatch, slug]
  );

  const handleOpenConsult = useCallback(() => {
    trackLandingEvent("landing_cta_click", { campaign_slug: slug, source: "landing_page" });
    if (hasPublicBatch && openBatch) {
      handleOpenRegister(openBatch, `Tôi muốn được tư vấn thêm về ${title} trước khi đăng ký.`);
    } else {
      window.open("https://zalo.me", "_blank");
    }
  }, [hasPublicBatch, openBatch, handleOpenRegister, slug, title]);

  const handleCloseRegister = () => {
    setRegisteringBatch(null);
    setInitialNotes(undefined);
  };

  const handleSuccess = (isDuplicate?: boolean) => {
    if (registeringBatch) {
      const bTitle = registeringBatch.course?.title || registeringBatch.title;
      setSuccessBatchTitle(bTitle);
      trackLandingEvent("registration_submit_success", {
        batch_id: registeringBatch.id,
        batch_title: bTitle,
        campaign_slug: slug,
        source: "landing_page",
        duplicate: !!isDuplicate,
      });
    }
    setIsDuplicateRegistration(!!isDuplicate);
    setRegisteringBatch(null);
    setInitialNotes(undefined);
    if (onRefreshSchedule) onRefreshSchedule();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 font-sans antialiased selection:bg-indigo-500 selection:text-white">
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
          onClose={() => setSuccessBatchTitle(null)}
        />
      )}
    </div>
  );
}
