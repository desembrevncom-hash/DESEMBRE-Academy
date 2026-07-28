import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  getAllCourseRegistrations,
  updateRegistrationStatus,
  getLeadInsights,
  exportRegistrationsToCsv,
  BatchRegistrationLead,
  RegistrationStatus,
  LeadInsightData,
} from "@/features/admin/services/academyAdminLeadPipelineApi";
import {
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  PhoneCall,
  Download,
  Filter,
  X,
  History,
  Send,
  User,
  Calendar,
  MessageSquare,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/academy-enrollments")({
  component: AcademyRegistrationsCrmAdmin,
});

const STATUS_MAP: Record<RegistrationStatus, { label: string; bg: string; text: string; border: string }> = {
  pending: { label: "Mới đăng ký", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  contacted: { label: "Đã liên hệ", bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
  confirmed: { label: "Đã xác nhận", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  rejected: { label: "Đã từ chối", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  cancelled: { label: "Đã hủy", bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" },
};

function StatusBadge({ status }: { status: RegistrationStatus }) {
  const cfg = STATUS_MAP[status] || STATUS_MAP.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

function AcademyRegistrationsCrmAdmin() {
  const [registrations, setRegistrations] = useState<BatchRegistrationLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const [selectedLead, setSelectedLead] = useState<BatchRegistrationLead | null>(null);
  const [leadInsights, setLeadInsights] = useState<LeadInsightData | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const [adminNote, setAdminNote] = useState("");
  const [submittingStatus, setSubmittingStatus] = useState(false);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const data = await getAllCourseRegistrations({
        status: statusFilter,
        search,
        source: sourceFilter,
      });
      setRegistrations(data);
    } catch (error: any) {
      console.error("fetchRegistrations error:", error);
      toast.error("Không thể tải danh sách đăng ký. Vui lòng kiểm tra kết nối.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [statusFilter, sourceFilter]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      fetchRegistrations();
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const loadLeadDetails = async (lead: BatchRegistrationLead) => {
    setSelectedLead(lead);
    setAdminNote(lead.admin_note || lead.note || "");
    setLoadingInsights(true);
    try {
      const insights = await getLeadInsights(lead.id);
      setLeadInsights(insights);
    } catch (e) {
      console.error("loadLeadDetails error:", e);
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleUpdateStatus = async (newStatus: RegistrationStatus) => {
    if (!selectedLead) return;

    if (newStatus === "confirmed") {
      const ok = window.confirm(
        "Xác nhận đăng ký này? Hệ thống sẽ tạo thông báo ZNS xác nhận gửi cho khách hàng."
      );
      if (!ok) return;
    }

    let noteToSave = adminNote;
    if (newStatus === "cancelled") {
      const reason = window.prompt("Nhập lý do hủy đăng ký (không bắt buộc):");
      if (reason === null) return; // User cancelled prompt
      if (reason) noteToSave = reason;
    }

    setSubmittingStatus(true);
    try {
      await updateRegistrationStatus(selectedLead.id, newStatus, noteToSave);
      toast.success(
        newStatus === "confirmed"
          ? "Đã xác nhận đăng ký! Đã queue thông báo ZNS."
          : `Đã chuyển trạng thái sang "${STATUS_MAP[newStatus]?.label || newStatus}".`
      );

      // Refresh lead details and list
      fetchRegistrations();
      loadLeadDetails({ ...selectedLead, status: newStatus, admin_note: noteToSave });
    } catch (err: any) {
      console.error("handleUpdateStatus error:", err);
      toast.error(err.message || "Cập nhật trạng thái thất bại.");
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleExportCsv = () => {
    exportRegistrationsToCsv(registrations, "tat-ca-dang-ky");
    toast.success("Đã xuất danh sách thành file CSV.");
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 font-sans antialiased text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>DESEMBRE ACADEMY CRM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Đăng ký khóa học
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Quản lý thông tin khách đăng ký từ lịch khai giảng và các landing page.
          </p>
        </div>

        <Button
          onClick={handleExportCsv}
          variant="outline"
          className="rounded-xl border-slate-200 font-semibold text-xs h-11 px-4 shadow-xs"
        >
          <Download className="mr-2 h-4 w-4 text-slate-600" />
          Xuất file CSV
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, SĐT Zalo, email hoặc tên khóa học..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Mới đăng ký (Pending)</option>
            <option value="contacted">Đã liên hệ (Contacted)</option>
            <option value="confirmed">Đã xác nhận (Confirmed)</option>
            <option value="cancelled">Đã hủy (Cancelled)</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">Tất cả nguồn</option>
            <option value="public_website">Public Website</option>
            <option value="batch_landing">Batch Landing</option>
            <option value="manual">Nhập tay</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-5 py-4">Khách hàng</th>
                <th className="px-5 py-4">Khóa học / Lớp mở</th>
                <th className="px-5 py-4">Nguồn</th>
                <th className="px-5 py-4">Trạng thái</th>
                <th className="px-5 py-4">Ngày đăng ký</th>
                <th className="px-5 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
                    Đang tải danh sách đăng ký...
                  </td>
                </tr>
              ) : registrations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400 space-y-2">
                    <User className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="font-bold text-slate-700">Chưa có đăng ký nào</p>
                    <p className="text-xs text-slate-400">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                  </td>
                </tr>
              ) : (
                registrations.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{lead.full_name}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-semibold text-slate-700">{lead.phone}</span>
                        {lead.email && <span className="text-slate-400">· {lead.email}</span>}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 max-w-xs truncate">
                        {lead.course_title || "Khóa đào tạo DESEMBRE"}
                      </div>
                      <div className="text-xs text-indigo-600 font-medium">
                        Lớp: {lead.batch_title || lead.batch_id}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        {lead.source || "public_website"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={lead.status} />
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {format(parseISO(lead.created_at), "dd/MM/yyyy HH:mm")}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Button
                        onClick={() => loadLeadDetails(lead)}
                        variant="outline"
                        size="sm"
                        className="rounded-xl text-xs font-semibold text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                      >
                        Chi tiết / Xử lý
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Detail Drawer */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedLead(null)}
          />

          {/* Drawer Body */}
          <div className="relative w-full max-w-xl bg-white shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mb-0.5">
                  CHI TIẾT ĐĂNG KÝ # {selectedLead.id.slice(0, 8)}
                </div>
                <h3 className="text-lg font-bold">{selectedLead.full_name}</h3>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status Header */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Trạng thái hiện tại
                  </div>
                  <StatusBadge status={selectedLead.status} />
                </div>

                <div className="text-right text-xs text-slate-500">
                  <span>Đăng ký lúc: </span>
                  <span className="font-semibold text-slate-800">
                    {format(parseISO(selectedLead.created_at), "dd/MM/yyyy HH:mm")}
                  </span>
                </div>
              </div>

              {/* Customer Info Box */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Thông tin khách hàng</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Họ và tên</span>
                    <span className="font-bold text-slate-900">{selectedLead.full_name}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Số điện thoại Zalo</span>
                    <span className="font-bold text-indigo-600 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {selectedLead.phone}
                    </span>
                  </div>

                  {selectedLead.email && (
                    <div>
                      <span className="text-slate-400 block text-[10px]">Email</span>
                      <span className="font-medium text-slate-800">{selectedLead.email}</span>
                    </div>
                  )}

                  <div>
                    <span className="text-slate-400 block text-[10px]">Nguồn đăng ký</span>
                    <span className="font-medium text-slate-800">{selectedLead.source || "public_website"}</span>
                  </div>
                </div>

                {(selectedLead.note || selectedLead.notes) && (
                  <div className="pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-400 block text-[10px] mb-0.5">Nhu cầu tư vấn / Ghi chú của khách</span>
                    <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-700 italic">
                      "{selectedLead.note || selectedLead.notes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Class Info Box */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Lớp đào tạo đăng ký</span>
                </h4>

                <div className="space-y-1.5 text-xs">
                  <div className="font-bold text-slate-900 text-sm">
                    {selectedLead.course_title || "Chương trình đào tạo DESEMBRE Academy"}
                  </div>
                  <div className="text-slate-600 font-medium">
                    Lớp: <span className="text-indigo-600">{selectedLead.batch_title || selectedLead.batch_id}</span>
                  </div>

                  {selectedLead.start_date && (
                    <div className="text-slate-500">
                      Khai giảng: {format(parseISO(selectedLead.start_date), "dd/MM/yyyy")}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Timeline & ZNS Outbox History */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Lịch sử xử lý & Thông báo ZNS</span>
                </h4>

                {loadingInsights ? (
                  <div className="py-4 text-center">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" />
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    {/* History logs */}
                    {leadInsights?.history && leadInsights.history.length > 0 ? (
                      <div className="space-y-2 border-l-2 border-indigo-200 pl-3">
                        {leadInsights.history.map((h) => (
                          <div key={h.id} className="text-slate-600">
                            <div className="font-semibold text-slate-800">
                              Chuyển trạng thái: <span className="text-indigo-600">{h.new_status}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {format(parseISO(h.created_at), "dd/MM/yyyy HH:mm")}{" "}
                              {h.actor_email && `bởi ${h.actor_email}`}
                            </div>
                            {h.note && <p className="italic text-slate-500">"{h.note}"</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">Chưa có lịch sử thay đổi.</p>
                    )}

                    {/* ZNS Outbox Jobs */}
                    {leadInsights?.outbox && leadInsights.outbox.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Lịch sử gửi ZNS
                        </div>
                        {leadInsights.outbox.map((o) => (
                          <div key={o.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg text-[11px]">
                            <span>ZNS Queue: {o.status}</span>
                            <span className="text-slate-400">{format(parseISO(o.created_at), "HH:mm dd/MM")}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Admin Notes Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Ghi chú Admin (Nội bộ)
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={2}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Ghi chú về trao đổi với khách, thắc mắc..."
                />
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                {selectedLead.status !== "contacted" && (
                  <Button
                    onClick={() => handleUpdateStatus("contacted")}
                    disabled={submittingStatus}
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-xs font-semibold text-sky-700 border-sky-200 bg-sky-50 hover:bg-sky-100"
                  >
                    Đã liên hệ
                  </Button>
                )}

                {selectedLead.status !== "confirmed" && (
                  <Button
                    onClick={() => handleUpdateStatus("confirmed")}
                    disabled={submittingStatus}
                    size="sm"
                    className="rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Xác nhận (Queue ZNS)
                  </Button>
                )}

                {selectedLead.status !== "cancelled" && (
                  <Button
                    onClick={() => handleUpdateStatus("cancelled")}
                    disabled={submittingStatus}
                    size="sm"
                    variant="ghost"
                    className="rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    Hủy đăng ký
                  </Button>
                )}

                {selectedLead.status === "cancelled" && (
                  <Button
                    onClick={() => handleUpdateStatus("pending")}
                    disabled={submittingStatus}
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-xs font-semibold"
                  >
                    Mở lại (Pending)
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
