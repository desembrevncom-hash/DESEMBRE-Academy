import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getPublicCourseBySlug, PublicCourseDetail } from "@/features/public-training/services/publicCourseDetailApi";
import { PublicCourseBatch } from "@/features/public-training/services/publicTrainingApi";
import { CourseDetailHero } from "@/features/public-training/components/CourseDetailHero";
import { PublicInstructorCard } from "@/features/public-training/components/PublicInstructorCard";
import { TrainingScheduleCard } from "@/features/public-training/components/TrainingScheduleCard";
import { RegistrationForm } from "@/features/public-training/components/RegistrationForm";
import { RegistrationSuccess } from "@/features/public-training/components/RegistrationSuccess";
import { PublicEmptyState } from "@/features/public-training/components/PublicEmptyState";
import { Loader2, BookOpen, CheckCircle2, Sparkles, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isDemoRecord } from "@/features/admin/utils/demoData";

export const Route = createFileRoute("/khoa-hoc/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} | DESEMBRE Academy` },
      { name: "description", content: "Khoá đào tạo chuyên sâu chuẩn Y Khoa & Thẩm mỹ cao cấp tại DESEMBRE Academy." },
    ],
  }),
  component: PublicCourseDetailPage,
});

function PublicCourseDetailPage() {
  const { slug } = Route.useParams();
  const [course, setCourse] = useState<PublicCourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [registeringBatch, setRegisteringBatch] = useState<PublicCourseBatch | null>(null);
  const [successBatchTitle, setSuccessBatchTitle] = useState<string | null>(null);

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

  const batches = course.batches || [];
  const primaryInstructor = batches.find((b) => b.instructor != null)?.instructor || null;

  return (
    <div className="min-h-screen bg-slate-50/60 pb-24 font-sans antialiased text-slate-900">
      <SiteHeader />

      {/* Hero Section */}
      <CourseDetailHero
        title={course.title}
        summary={course.summary}
        coverUrl={course.cover_url}
        batchCount={batches.length}
      />

      <main className="container mx-auto px-4 max-w-5xl py-12 space-y-12">
        {/* Overview: Bạn sẽ học được gì? */}
        <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600">
            <Sparkles className="w-4 h-4" />
            <span>Nội dung chương trình</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Giá trị nổi bật của khóa học
          </h2>

          {course.description ? (
            <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-600 whitespace-pre-line">
              {course.description}
            </div>
          ) : (
            <p className="text-sm text-slate-500 leading-relaxed italic">
              Nội dung chi tiết chương trình đào tạo sẽ được đội ngũ DESEMBRE Academy tư vấn theo đúng nhu cầu tay nghề của học viên.
            </p>
          )}
        </section>

        {/* Instructor Preview Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 px-1">
            Giảng viên hướng dẫn
          </h2>
          <PublicInstructorCard instructor={primaryInstructor} />
        </section>

        {/* Upcoming Batches Section */}
        <section id="batches-section" className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Các lớp khai giảng sắp tới ({batches.length})
            </h2>
          </div>

          {batches.length > 0 ? (
            <div className="space-y-6">
              {batches.map((batch) => (
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
          ) : (
            <div className="text-center py-12 border border-slate-200/80 rounded-3xl bg-white p-6 shadow-sm space-y-4">
              <Calendar className="h-10 w-10 text-slate-400 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">Chưa có lịch khai giảng mới cho khóa học này</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Vui lòng xem thêm các khóa học khác hoặc đăng ký để nhận tư vấn khi có lớp mới.
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
    </div>
  );
}
