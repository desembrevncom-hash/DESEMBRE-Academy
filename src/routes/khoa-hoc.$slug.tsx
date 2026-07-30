import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef, useMemo } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getPublicCourseBySlug, PublicCourseDetail } from "@/features/public-training/services/publicCourseDetailApi";
import { PublicCourseBatch } from "@/features/public-training/services/publicTrainingApi";
import { CourseDetailHero } from "@/features/public-training/components/CourseDetailHero";
import { CourseUpcomingBatchSpotlight } from "@/features/public-training/components/CourseUpcomingBatchSpotlight";
import { CourseDetailAccordion, CourseDetailAccordionRef } from "@/features/public-training/components/CourseDetailAccordion";
import { TrainingScheduleCard } from "@/features/public-training/components/TrainingScheduleCard";
import { RegistrationForm } from "@/features/public-training/components/RegistrationForm";
import { RegistrationSuccess } from "@/features/public-training/components/RegistrationSuccess";
import { PublicStickyCTA } from "@/components/layout/PublicStickyCTA";
import { PublicEmptyState } from "@/features/public-training/components/PublicEmptyState";
import { Loader2, BookOpen, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isDemoRecord } from "@/features/admin/utils/demoData";

export const Route = createFileRoute("/khoa-hoc/$slug")({
  head: ({ params }) => {
    const slug = params.slug;
    const title = `Khóa học ${slug.replace(/-/g, ' ').toUpperCase()} | DESEMBRE Training Center`;
    const description = "Khoá đào tạo chuyên sâu chuẩn Y Khoa & Thẩm mỹ cao cấp tại DESEMBRE Training Center.";
    const canonicalUrl = `https://academy.desembre-vn.com/khoa-hoc/${slug}`;
    const defaultOgImage = "https://academy.desembre-vn.com/og/academy-home.jpg";

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: defaultOgImage },
        { property: "og:url", content: canonicalUrl },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: defaultOgImage },
      ],
      links: [
        { rel: "canonical", href: canonicalUrl },
      ],
    };
  },
  component: PublicCourseDetailPage,
});

function PublicCourseDetailPage() {
  const { slug } = Route.useParams();
  const [course, setCourse] = useState<PublicCourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [registeringBatch, setRegisteringBatch] = useState<PublicCourseBatch | null>(null);
  const [successBatchTitle, setSuccessBatchTitle] = useState<string | null>(null);

  const accordionRef = useRef<CourseDetailAccordionRef>(null);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPublicCourseBySlug(slug);
      if (!data || isDemoRecord(data)) {
        setError("COURSE_NOT_FOUND");
      } else {
        if (data.batches) {
          data.batches = data.batches.filter((b) => !isDemoRecord(b));
        }
        setCourse(data);

        if (typeof document !== "undefined") {
          const pageTitle = `${data.title} | DESEMBRE Training Center`;
          const description = data.summary || "Khoá đào tạo chuyên sâu chuẩn Y Khoa & Thẩm mỹ cao cấp tại DESEMBRE Training Center.";
          const rawCover = data.cover_url;
          const ogImage = rawCover && (rawCover.startsWith("http://") || rawCover.startsWith("https://"))
            ? rawCover
            : "https://academy.desembre-vn.com/og/academy-home.jpg";
          const canonicalUrl = `https://academy.desembre-vn.com/khoa-hoc/${slug}`;

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
      }
    } catch (err: any) {
      console.error("fetchCourseDetail error:", err);
      setError("Không thể tải thông tin khóa học.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [slug]);

  // Compute spotlight batch based on rules:
  // 1. Prioritize open batches
  // 2. Pick nearest start_date
  // 3. Fallback to nearest draft/closed batch if no open batch
  const spotlightBatch = useMemo(() => {
    if (!course || !course.batches || course.batches.length === 0) return null;

    const openBatches = course.batches.filter(
      (b) => (b.registration_status || "").toLowerCase() === "open"
    );

    const sortFn = (a: PublicCourseBatch, b: PublicCourseBatch) => {
      if (!a.start_date) return 1;
      if (!b.start_date) return -1;
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
    };

    if (openBatches.length > 0) {
      return [...openBatches].sort(sortFn)[0];
    }

    return [...course.batches].sort(sortFn)[0];
  }, [course]);

  // Aggregate sessions for accordion:
  const spotlightSessions = useMemo(() => {
    if (spotlightBatch?.sessions && spotlightBatch.sessions.length > 0) {
      return spotlightBatch.sessions;
    }
    // Fallback: collect any sessions from other batches
    if (course?.batches) {
      for (const b of course.batches) {
        if (b.sessions && b.sessions.length > 0) {
          return b.sessions;
        }
      }
    }
    return [];
  }, [spotlightBatch, course]);

  const otherOpenBatches = useMemo(() => {
    if (!course || !course.batches) return [];
    return course.batches.filter(
      (b) =>
        b.id !== spotlightBatch?.id &&
        (b.registration_status || "").toLowerCase() === "open"
    );
  }, [course, spotlightBatch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
          <p className="text-sm font-medium text-slate-500">Đang tải chi tiết khóa học DESEMBRE Academy...</p>
        </div>
      </div>
    );
  }

  if (error === "COURSE_NOT_FOUND" || !course) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <PublicEmptyState
          title="Không tìm thấy khóa học"
          description="Khoá học bạn đang tìm kiếm không tồn tại hoặc đã tạm dừng tuyển sinh."
          actionText="Xem lịch khai giảng"
          actionHref="/lich-khai-giang"
          icon={BookOpen}
        />
      </div>
    );
  }

  const navigate = useNavigate();

  const handleRegisterUpcoming = () => {
    const isSpotlightOpen = spotlightBatch && (spotlightBatch.registration_status || "").toLowerCase() === "open";
    if (isSpotlightOpen) {
      setRegisteringBatch(spotlightBatch);
    } else {
      navigate({ to: "/lich-khai-giang" });
    }
  };

  const handleViewScheduleDetails = () => {
    if (accordionRef.current) {
      accordionRef.current.openSchedule();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-24 font-sans antialiased text-slate-900">
      <SiteHeader />

      {/* Hero Section */}
      <CourseDetailHero
        title={course.title}
        summary={course.summary}
        coverUrl={course.cover_url}
        onRegisterUpcoming={handleRegisterUpcoming}
      />

      <main className="container mx-auto px-4 max-w-4xl py-8 sm:py-12 space-y-8 sm:space-y-10">
        {/* Spotlight Section: Lớp khai giảng gần nhất */}
        <section className="space-y-4">
          <CourseUpcomingBatchSpotlight
            batch={
              spotlightBatch
                ? {
                    ...spotlightBatch,
                    course: {
                      id: course.id,
                      title: course.title,
                      slug: course.slug,
                      cover_url: course.cover_url,
                      summary: course.summary,
                    },
                  }
                : null
            }
            onRegister={(b) => setRegisteringBatch(b)}
            onViewScheduleDetails={handleViewScheduleDetails}
          />
        </section>

        {/* Progressive Disclosure Section: Accordions */}
        <section className="space-y-4">
          <CourseDetailAccordion
            ref={accordionRef}
            description={course.description}
            sessions={spotlightSessions}
          />
        </section>

        {/* Other Open Batches Section (if multiple open batches exist) */}
        {otherOpenBatches.length > 0 && (
          <section className="space-y-6 pt-4">
            <h3 className="text-xl font-bold text-slate-900 px-1">
              Các lớp khai giảng khác ({otherOpenBatches.length})
            </h3>
            <div className="space-y-6">
              {otherOpenBatches.map((batch) => (
                <TrainingScheduleCard
                  key={batch.id}
                  batch={{
                    ...batch,
                    course: {
                      id: course.id,
                      title: course.title,
                      slug: course.slug,
                      cover_url: course.cover_url,
                      summary: course.summary,
                    },
                  }}
                  onRegister={(b) => setRegisteringBatch(b)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Bottom Quick CTA Banner */}
        <section className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-lg sm:text-xl font-bold">
              Cần tư vấn thêm về khóa học {course.title}?
            </h4>
            <p className="text-xs sm:text-sm text-indigo-200/80">
              Chuyên viên đào tạo DESEMBRE sẵn sàng giải đáp thắc mắc lộ trình và học phí.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              onClick={handleRegisterUpcoming}
              className="w-full sm:w-auto h-12 px-6 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Đăng ký giữ chỗ</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </section>
      </main>

      {/* Registration Drawer */}
      {registeringBatch && (
        <RegistrationForm
          batch={registeringBatch}
          onClose={() => setRegisteringBatch(null)}
          onSuccess={() => {
            setSuccessBatchTitle(registeringBatch.course?.title || registeringBatch.title);
            setRegisteringBatch(null);
            fetchDetail();
          }}
        />
      )}

      {/* Registration Success Modal */}
      {successBatchTitle && (
        <RegistrationSuccess
          batchTitle={successBatchTitle}
          onClose={() => setSuccessBatchTitle(null)}
        />
      )}

      {/* Mobile Sticky CTA */}
      {!registeringBatch && (
        <PublicStickyCTA
          primaryLabel={
            spotlightBatch && (spotlightBatch.registration_status || "").toLowerCase() === "open"
              ? "Đăng ký học"
              : "Xem lịch khai giảng"
          }
          onPrimaryClick={handleRegisterUpcoming}
        />
      )}
    </div>
  );
}
