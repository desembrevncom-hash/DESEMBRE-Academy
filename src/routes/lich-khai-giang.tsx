import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Loader2, Calendar, AlertCircle, RotateCcw } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";

import { getPublicTrainingSchedule, PublicCourseBatch } from "@/features/public-training/services/publicTrainingApi";
import { TrainingHero } from "@/features/public-training/components/TrainingHero";
import { TrainingFilters } from "@/features/public-training/components/TrainingFilters";
import { TrainingScheduleCard } from "@/features/public-training/components/TrainingScheduleCard";
import { RegistrationForm } from "@/features/public-training/components/RegistrationForm";
import { RegistrationSuccess } from "@/features/public-training/components/RegistrationSuccess";
import { isDemoRecord } from "@/features/admin/utils/demoData";

export const Route = createFileRoute("/lich-khai-giang")({
  component: PublicCalendarPage,
  head: () => ({
    meta: [
      { title: "Lịch Khai Giảng | DESEMBRE Academy" },
      { name: "description", content: "Lịch khai giảng các khóa đào tạo spa, thẩm mỹ, quản trị kinh doanh spa chuẩn Hàn Quốc mới nhất tại DESEMBRE Academy." }
    ]
  })
});

function PublicCalendarPage() {
  const [batches, setBatches] = useState<PublicCourseBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedFormat, setSelectedFormat] = useState("ALL");
  const [selectedMonth, setSelectedMonth] = useState("ALL");

  const [registeringBatch, setRegisteringBatch] = useState<PublicCourseBatch | null>(null);
  const [successBatchTitle, setSuccessBatchTitle] = useState<string | null>(null);
  const [isDuplicateRegistration, setIsDuplicateRegistration] = useState(false);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPublicTrainingSchedule();
      setBatches(data.filter(b => !isDemoRecord(b)));
    } catch (err: any) {
      console.error("fetchSchedule error:", err);
      setError("Không thể tải lịch khai giảng. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  // Compute available months
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    batches.forEach((b) => {
      let earliest = b.start_date;
      if (!earliest && b.sessions && b.sessions.length > 0) {
        earliest = b.sessions[0].starts_at;
      }
      const monthKey = earliest ? format(parseISO(earliest), "MM/yyyy") : "TBA";
      set.add(monthKey);
    });
    return Array.from(set);
  }, [batches]);

  // Filter batches by format and month
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      // Format filter
      if (selectedFormat !== "ALL") {
        const fmt = (b.training_format || "").toLowerCase();
        if (fmt !== selectedFormat.toLowerCase()) return false;
      }

      // Month filter
      if (selectedMonth !== "ALL") {
        let earliest = b.start_date;
        if (!earliest && b.sessions && b.sessions.length > 0) {
          earliest = b.sessions[0].starts_at;
        }
        const monthKey = earliest ? format(parseISO(earliest), "MM/yyyy") : "TBA";
        if (monthKey !== selectedMonth) return false;
      }

      return true;
    });
  }, [batches, selectedFormat, selectedMonth]);

  const handleResetFilters = () => {
    setSelectedFormat("ALL");
    setSelectedMonth("ALL");
  };

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
    fetchSchedule(); // Refresh counts
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-24 font-sans antialiased text-slate-900">
      <SiteHeader />

      {/* Hero Section */}
      <TrainingHero />

      {/* Main Schedule Container */}
      <main id="schedule-section" className="container mx-auto px-4 max-w-5xl py-10 space-y-8">
        {/* Filters */}
        <TrainingFilters
          selectedFormat={selectedFormat}
          onSelectFormat={setSelectedFormat}
          months={availableMonths}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
          onResetFilters={handleResetFilters}
          totalResults={filteredBatches.length}
        />

        {/* Loading State — Skeleton Cards */}
        {loading && (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4 animate-pulse">
                <div className="flex gap-2">
                  <div className="h-7 w-28 rounded-full bg-slate-100" />
                  <div className="h-7 w-20 rounded-full bg-slate-100" />
                </div>
                <div className="h-8 w-3/4 rounded-xl bg-slate-100" />
                <div className="h-4 w-1/2 rounded-lg bg-slate-100" />
                <div className="h-28 rounded-2xl bg-slate-50 border border-slate-100" />
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
        {!loading && !error && filteredBatches.length === 0 && (
          <div className="text-center py-20 border border-slate-200/80 rounded-3xl bg-white p-8 shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Calendar className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Chưa có lớp phù hợp</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Không tìm thấy lớp khai giảng theo bộ lọc hiện tại. Bạn có thể xóa bộ lọc hoặc xem toàn bộ danh mục khóa học.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {(selectedFormat !== "ALL" || selectedMonth !== "ALL") && (
                <Button onClick={handleResetFilters} variant="outline" className="rounded-xl px-5 font-semibold">
                  <RotateCcw className="mr-2 w-4 h-4 text-indigo-600" />
                  Xóa bộ lọc
                </Button>
              )}
              <Button asChild className="rounded-xl px-6 font-semibold bg-indigo-600 hover:bg-indigo-700">
                <Link to="/courses">Xem tất cả khóa học</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Schedule List */}
        {!loading && !error && filteredBatches.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Các lớp khai giảng sắp tới ({filteredBatches.length})
              </h2>
            </div>

            {filteredBatches.map((batch) => (
              <TrainingScheduleCard
                key={batch.id}
                batch={batch}
                onRegister={handleOpenRegister}
              />
            ))}
          </div>
        )}
      </main>

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
    </div>
  );
}
