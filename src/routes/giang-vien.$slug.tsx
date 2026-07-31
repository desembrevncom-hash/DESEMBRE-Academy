import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getPublicInstructorBySlug, PublicInstructorProfile } from "@/features/public-training/services/publicCourseDetailApi";
import { PublicCourseBatch } from "@/features/public-training/services/publicTrainingApi";
import { InstructorProfileHero } from "@/features/public-training/components/InstructorProfileHero";
import { TrainingScheduleCard } from "@/features/public-training/components/TrainingScheduleCard";
import { RegistrationForm } from "@/features/public-training/components/RegistrationForm";
import { RegistrationSuccess } from "@/features/public-training/components/RegistrationSuccess";
import { PublicStickyCTA } from "@/components/layout/PublicStickyCTA";
import { PublicEmptyState } from "@/features/public-training/components/PublicEmptyState";
import { Loader2, User, Award, CheckCircle2, Calendar, Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

import { SITE_URL, DEFAULT_OG_IMAGE } from "@/config/site";

export const Route = createFileRoute("/giang-vien/$slug")({
  head: ({ params }) => {
    const slug = params.slug;
    const title = `Giảng viên ${slug.replace(/-/g, ' ').toUpperCase()} | DESEMBRE Training Center`;
    const description = "Chuyên gia đào tạo Da liễu & Thẩm mỹ chuẩn Y Khoa tại DESEMBRE Training Center.";
    const canonicalUrl = `${SITE_URL}/giang-vien/${slug}`;
    const defaultOgImage = DEFAULT_OG_IMAGE;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: defaultOgImage },
        { property: "og:url", content: canonicalUrl },
        { property: "og:type", content: "profile" },
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
  component: PublicInstructorProfilePage,
});

function PublicInstructorProfilePage() {
  const { slug } = Route.useParams();
  const [instructor, setInstructor] = useState<PublicInstructorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [registeringBatch, setRegisteringBatch] = useState<PublicCourseBatch | null>(null);
  const [successBatchTitle, setSuccessBatchTitle] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPublicInstructorBySlug(slug);
      if (!data) {
        setError("INSTRUCTOR_NOT_FOUND");
      } else {
        setInstructor(data);

        if (typeof document !== "undefined") {
          const pageTitle = `Giảng viên ${data.full_name} | DESEMBRE Training Center`;
          const description = data.bio || `Chuyên gia đào tạo Da liễu & Thẩm mỹ chuẩn Y Khoa tại DESEMBRE Training Center.`;
          const rawAvatar = data.avatar_url;
          const ogImage = rawAvatar && (rawAvatar.startsWith("http://") || rawAvatar.startsWith("https://"))
            ? rawAvatar
            : "https://academy.desembre-vn.com/og/academy-home.jpg";
          const canonicalUrl = `https://academy.desembre-vn.com/giang-vien/${slug}`;

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
      console.error("fetchInstructorProfile error:", err);
      setError("Không thể tải hồ sơ giảng viên.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
          <p className="text-sm font-medium text-slate-500">Đang tải hồ sơ giảng viên DESEMBRE Academy...</p>
        </div>
      </div>
    );
  }

  if (error === "INSTRUCTOR_NOT_FOUND" || !instructor) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <PublicEmptyState
          title="Không tìm thấy thông tin giảng viên"
          description="Hồ sơ giảng viên bạn tìm kiếm không tồn tại hoặc đã tạm ngưng hiển thị."
          actionText="Xem tất cả lịch đào tạo"
          actionHref="/lich-khai-giang"
          icon={User}
        />
      </div>
    );
  }

  const batches = instructor.batches || [];
  const highlights = instructor.highlights || [];

  return (
    <div className="min-h-screen bg-slate-50/60 pb-24 font-sans antialiased text-slate-900">
      <SiteHeader />

      {/* Instructor Hero */}
      <InstructorProfileHero instructor={instructor} />

      <main className="container mx-auto px-4 max-w-5xl py-12 space-y-12">
        {/* Bio section */}
        {instructor.bio && (
          <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600">
              <User className="w-4 h-4" />
              <span>Tiểu sử & Kinh nghiệm chuyên môn</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Giới thiệu về giảng viên
            </h2>

            <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-600 whitespace-pre-line">
              {instructor.bio}
            </div>
          </section>
        )}

        {/* Highlights section */}
        {highlights.length > 0 && (
          <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600">
              <Award className="w-4 h-4" />
              <span>Thành tựu nổi bật</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Điểm nổi bật & Chứng chỉ
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {highlights.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 text-xs font-semibold text-slate-800"
                >
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Instructor Batches & Courses */}
        <section id="instructor-courses-section" className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Lớp đào tạo do giảng viên phụ trách ({batches.length})
            </h2>
          </div>

          {batches.length > 0 ? (
            <div className="space-y-6">
              {batches.map((batch) => (
                <TrainingScheduleCard
                  key={batch.id}
                  batch={{
                    ...batch,
                    instructor: {
                      id: instructor.id,
                      full_name: instructor.full_name,
                      title: instructor.title,
                      avatar_url: instructor.avatar_url,
                      expertise: instructor.expertise,
                    },
                  }}
                  onRegister={(b) => setRegisteringBatch(b)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-slate-200/80 rounded-3xl bg-white p-6 shadow-sm space-y-4">
              <Calendar className="h-10 w-10 text-slate-400 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">Hiện chưa có lớp công khai mới do giảng viên phụ trách</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Bạn có thể xem lịch khai giảng chung của viện đào tạo DESEMBRE Academy.
              </p>
              <Button asChild className="rounded-xl px-6 font-semibold bg-indigo-600 hover:bg-indigo-700">
                <Link to="/lich-khai-giang">Xem tất cả lịch khai giảng</Link>
              </Button>
            </div>
          )}
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
            fetchProfile();
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
          primaryLabel="Xem lịch khai giảng"
          onPrimaryClick={() => {
            if (batches.length > 0) {
              setRegisteringBatch(batches[0]);
            } else {
              window.location.href = "/lich-khai-giang";
            }
          }}
        />
      )}
    </div>
  );
}
