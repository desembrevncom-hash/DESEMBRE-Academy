import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getPublicTrainingSchedule, PublicCourseBatch } from "@/features/public-training/services/publicTrainingApi";
import { SynergisticProtocolHero } from "@/features/public-training/components/SynergisticProtocolHero";
import { SynergisticAudienceSection } from "@/features/public-training/components/SynergisticAudienceSection";
import { SynergisticOutcomeSection } from "@/features/public-training/components/SynergisticOutcomeSection";
import { SynergisticSessionSection } from "@/features/public-training/components/SynergisticSessionSection";
import { SynergisticFaqSection } from "@/features/public-training/components/SynergisticFaqSection";
import { CompactInstructorCard } from "@/features/public-training/components/CompactInstructorCard";
import { TrainingScheduleCard } from "@/features/public-training/components/TrainingScheduleCard";
import { RegistrationForm } from "@/features/public-training/components/RegistrationForm";
import { RegistrationSuccess } from "@/features/public-training/components/RegistrationSuccess";
import { PublicStickyCTA } from "@/components/layout/PublicStickyCTA";
import { Loader2, Calendar, MessageSquare, ArrowRight, AlertCircle, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isDemoRecord } from "@/features/admin/utils/demoData";

export const Route = createFileRoute("/synergistic-protocol")({
  head: () => ({
    meta: [
      { title: "SYNERGISTIC PROTOCOL | Khóa đào tạo protocol chuyên sâu | DESEMBRE Academy" },
      { name: "description", content: "Đăng ký khóa SYNERGISTIC PROTOCOL cùng DESEMBRE Academy. Chương trình giúp chuẩn hóa tư duy phối hợp hoạt chất, xây dựng protocol và ứng dụng thực tế trong spa/clinic." },
      { property: "og:title", content: "SYNERGISTIC PROTOCOL | Khóa đào tạo protocol chuyên sâu | DESEMBRE Academy" },
      { property: "og:description", content: "Đăng ký khóa SYNERGISTIC PROTOCOL cùng DESEMBRE Academy. Chương trình giúp chuẩn hóa tư duy phối hợp hoạt chất, xây dựng protocol và ứng dụng thực tế trong spa/clinic." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: SynergisticProtocolPage,
});

function SynergisticProtocolPage() {
  const [batches, setBatches] = useState<PublicCourseBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [registeringBatch, setRegisteringBatch] = useState<PublicCourseBatch | null>(null);
  const [successBatchTitle, setSuccessBatchTitle] = useState<string | null>(null);
  const [isDuplicateRegistration, setIsDuplicateRegistration] = useState(false);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPublicTrainingSchedule();
      const filtered = data.filter((b) => {
        if (isDemoRecord(b)) return false;
        const status = (b.registration_status || "").toLowerCase().trim();
        if (status !== "open") return false;

        const slugMatch = b.course?.slug === "chuyen-de-synergistic-protocol-online";
        const titleMatch =
          (b.course?.title || "").toLowerCase().includes("synergistic protocol") ||
          (b.title || "").toLowerCase().includes("synergistic protocol");

        return slugMatch || titleMatch;
      });
      setBatches(filtered);
    } catch (err: any) {
      console.error("fetchSchedule error:", err);
      setError("Không thể tải danh sách lớp học.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const coverUrl = useMemo(() => {
    if (batches.length > 0 && batches[0].course?.cover_url) {
      return batches[0].course.cover_url;
    }
    return null;
  }, [batches]);

  const activeSessions = useMemo(() => {
    if (batches.length > 0 && batches[0].sessions) {
      return batches[0].sessions;
    }
    return [];
  }, [batches]);

  const activeInstructor = useMemo(() => {
    if (batches.length > 0 && batches[0].instructor) {
      return batches[0].instructor;
    }
    return null;
  }, [batches]);

  const handleOpenRegister = (batch: PublicCourseBatch) => {
    setRegisteringBatch(batch);
  };

  const handleCloseRegister = () => {
    setRegisteringBatch(null);
  };

  const handleSuccess = (isDuplicate?: boolean) => {
    if (registeringBatch) {
      setSuccessBatchTitle(registeringBatch.course?.title || registeringBatch.title);
    }
    setIsDuplicateRegistration(!!isDuplicate);
    setRegisteringBatch(null);
    fetchSchedule();
  };

  const handleConsult = () => {
    window.open("https://zalo.me", "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-24 font-sans antialiased text-slate-900">
      <SiteHeader />

      {/* Hero Landing */}
      <SynergisticProtocolHero coverUrl={coverUrl} />

      <main className="container mx-auto px-4 max-w-5xl py-10 sm:py-14 space-y-10 sm:space-y-12">
        {/* 1. Audience Section */}
        <SynergisticAudienceSection />

        {/* 2. Outcome Section */}
        <SynergisticOutcomeSection />

        {/* 3. Session Content Section */}
        <SynergisticSessionSection sessions={activeSessions} />

        {/* 4. Instructor Section */}
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
              Đội ngũ chuyên gia Da liễu & Thẩm mỹ giàu kinh nghiệm lâm sàng của DESEMBRE Academy.
            </p>
          </div>

          <div className="pt-2">
            <CompactInstructorCard instructor={activeInstructor} />
          </div>
        </section>

        {/* 5. Open Batches Section */}
        <section id="synergistic-schedule-section" className="space-y-6">
          {/* Loading State */}
          {loading && (
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4 animate-pulse">
                  <div className="h-28 rounded-2xl bg-slate-100" />
                  <div className="h-6 w-1/2 rounded-lg bg-slate-100" />
                  <div className="h-10 rounded-xl bg-slate-100" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="text-center py-16 max-w-md mx-auto bg-white border border-red-100 rounded-3xl p-8 shadow-sm">
              <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Chưa thể kết nối lịch học</h3>
              <p className="text-sm text-slate-500 mb-6">{error}</p>
              <Button onClick={fetchSchedule} variant="outline" className="rounded-xl px-6 font-semibold">
                Thử lại
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && batches.length === 0 && (
            <div className="text-center py-16 border border-slate-200/80 rounded-3xl bg-white p-8 shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Calendar className="h-8 w-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                Chưa có lớp SYNERGISTIC PROTOCOL đang mở
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

                <Button onClick={handleConsult} variant="outline" className="rounded-xl px-6 h-11 font-semibold border-slate-200">
                  <MessageSquare className="mr-2 w-4 h-4 text-indigo-600" />
                  <span>Tư vấn lộ trình</span>
                </Button>
              </div>
            </div>
          )}

          {/* Schedule List */}
          {!loading && !error && batches.length > 0 && (
            <div className="space-y-6">
              <div className="px-1 space-y-1">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Lớp SYNERGISTIC PROTOCOL đang mở đăng ký ({batches.length})
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Chọn lớp phù hợp và gửi thông tin để DESEMBRE Academy xác nhận qua Zalo/điện thoại.
                </p>
              </div>

              {batches.map((batch) => (
                <TrainingScheduleCard
                  key={batch.id}
                  batch={batch}
                  onRegister={handleOpenRegister}
                />
              ))}
            </div>
          )}
        </section>

        {/* 6. FAQ Section */}
        <SynergisticFaqSection />
      </main>

      <SiteFooter />

      {/* Registration Drawer */}
      {registeringBatch && (
        <RegistrationForm
          batch={registeringBatch}
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
              setRegisteringBatch(batches[0]);
            } else {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
        />
      )}
    </div>
  );
}
