import { useState, useEffect } from "react";
import { Loader2, CalendarDays, X, CheckCircle2, AlertCircle, Clock, MapPin, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminCreateSession } from "@/features/admin/services/academyAdminSessionsApi";
import { isOneSessionCourseType } from "@/features/admin/constants";

interface AddSessionModalProps {
  isOpen: boolean;
  batch: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddSessionModal({ isOpen, batch, onClose, onSuccess }: AddSessionModalProps) {
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [locationType, setLocationType] = useState("online");
  const [locationDetail, setLocationDetail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (batch) {
      const rawCourseTitle = batch.course?.title || batch.title || "Buổi học";
      const cleanTitle = rawCourseTitle.replace(/^\s*Chuyên\s+đề\s*:\s*/i, "");
      setTitle(batch.title || `Buổi học - ${cleanTitle}`);

      // Auto-fill dates based on batch.start_date
      let baseDate = new Date();
      if (batch.start_date) {
        try {
          const d = new Date(batch.start_date);
          if (!isNaN(d.getTime())) baseDate = d;
        } catch (_) {}
      } else {
        baseDate.setDate(baseDate.getDate() + 1); // default tomorrow
      }

      const year = baseDate.getFullYear();
      const month = String(baseDate.getMonth() + 1).padStart(2, "0");
      const day = String(baseDate.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      setStartsAt(`${dateStr}T14:00`);
      setEndsAt(`${dateStr}T16:00`);

      const fmt = (batch.training_format || "online").toLowerCase();
      setLocationType(fmt.includes("offline") ? "office" : "online");
      setLocationDetail(fmt.includes("offline") ? "Phòng Đào Tạo DESEMBRE Center" : "Zoom Online");
      setErrorMessage(null);
      setToastMessage(null);
    }
  }, [batch]);

  if (!isOpen || !batch) return null;

  const catSlug = batch.course?.category_slug || batch.course?.category?.slug;
  const isOneSession = isOneSessionCourseType(catSlug);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage("Vui lòng nhập tên buổi học.");
      return;
    }
    if (!startsAt) {
      setErrorMessage("Vui lòng chọn thời gian bắt đầu.");
      return;
    }
    if (!endsAt) {
      setErrorMessage("Vui lòng chọn thời gian kết thúc.");
      return;
    }

    const startMs = new Date(startsAt).getTime();
    const endMs = new Date(endsAt).getTime();

    if (isNaN(startMs) || isNaN(endMs)) {
      setErrorMessage("Thời gian không hợp lệ.");
      return;
    }

    if (endMs <= startMs) {
      setErrorMessage("Thời gian kết thúc phải sau thời gian bắt đầu.");
      return;
    }

    try {
      setIsSubmitting(true);
      await adminCreateSession({
        batch_id: batch.id,
        title: title.trim(),
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        location_type: locationType,
        location_detail: locationDetail.trim() || null,
        order_index: (batch.sessions_count || 0) + 1,
      });

      setToastMessage("Đã thêm buổi học thành công!");
      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess();
        onClose();
      }, 600);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || "Không thể tạo buổi học. Vui lòng thử lại.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <CalendarDays className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 leading-tight">Thêm Buổi Học Mới</h3>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-xs">{batch.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form id="addSessionForm" onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Helper alert */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100/80 flex items-start gap-2.5 text-xs text-indigo-900">
            <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              {isOneSession ? (
                <span>
                  <strong>Khóa 1 buổi:</strong> Lớp 1 buổi cần tạo đúng 1 buổi học để hiện public lên lịch khai giảng và tự động gửi ZNS nhắc lịch học viên.
                </span>
              ) : (
                <span>
                  <strong>Chương trình nhiều buổi:</strong> Cần tạo đầy đủ các buổi học trước khi mở đăng ký để học viên xem chi tiết lịch học.
                </span>
              )}
            </div>
          </div>

          {/* Success Toast Banner */}
          {toastMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs font-bold text-emerald-800 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs font-bold text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tên buổi học <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Buổi 1 - Biological Trigger Overview"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-900 bg-white"
            />
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bắt đầu (Ngày & Giờ) <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kết thúc (Ngày & Giờ) <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-900 bg-white"
              />
            </div>
          </div>

          {/* Location Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Hình thức học</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLocationType("online")}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  locationType === "online"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Video className="w-4 h-4 text-blue-500" />
                <span>Online (Zoom)</span>
              </button>
              <button
                type="button"
                onClick={() => setLocationType("office")}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  locationType === "office"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Offline (Thực hành)</span>
              </button>
            </div>
          </div>

          {/* Location Detail */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Chi tiết địa điểm / Link học</label>
            <input
              type="text"
              value={locationDetail}
              onChange={(e) => setLocationDetail(e.target.value)}
              placeholder={locationType === "online" ? "Link Zoom / Meeting ID" : "Địa chỉ phòng tập / chi nhánh"}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium text-slate-900 bg-white"
            />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="rounded-xl font-semibold text-xs">
            Hủy
          </Button>
          <Button
            type="submit"
            form="addSessionForm"
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 px-5 min-w-[120px]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-4 h-4 animate-spin" /> Đang tạo...
              </span>
            ) : (
              <span>Xác nhận thêm buổi</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
