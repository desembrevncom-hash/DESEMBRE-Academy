import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  getAllCourseRegistrations,
  updateRegistrationStatus,
  updateRegistrationFollowUp,
  getLeadInsights,
  getRegistrationsByPhone,
  exportRegistrationsToCsv,
  BatchRegistrationLead,
  RegistrationStatus,
  FollowUpStatus,
  LeadQuality,
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
  Users,
  AlertTriangle,
  Flame,
  Sun,
  Snowflake,
  Clock,
  UserCheck,
  Save,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, isToday, isBefore, startOfDay, endOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { ordersApi, AcademyOrder } from "@/features/public-training/services/ordersApi";

export const Route = createFileRoute("/admin/academy-enrollments")({
  component: AcademyRegistrationsCrmAdmin,
});

const REGISTRATION_STATUS_MAP: Record<RegistrationStatus, { label: string; bg: string; text: string; border: string }> = {
  pending: { label: "Mới đăng ký", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  contacted: { label: "Đã liên hệ", bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
  confirmed: { label: "Đã xác nhận", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  rejected: { label: "Đã từ chối", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  cancelled: { label: "Đã hủy", bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" },
};

const FOLLOW_UP_MAP: Record<string, { label: string; bg: string; text: string }> = {
  new: { label: "Mới", bg: "bg-slate-100", text: "text-slate-700" },
  need_call: { label: "Cần gọi", bg: "bg-amber-100", text: "text-amber-800" },
  contacted: { label: "Đã liên hệ", bg: "bg-blue-100", text: "text-blue-800" },
  callback_scheduled: { label: "Hẹn gọi lại", bg: "bg-purple-100", text: "text-purple-800" },
  no_answer: { label: "Không nghe máy", bg: "bg-rose-100", text: "text-rose-800" },
  qualified: { label: "Tiềm năng", bg: "bg-indigo-100", text: "text-indigo-800" },
  unqualified: { label: "Kém tiềm năng", bg: "bg-slate-200", text: "text-slate-600" },
  won: { label: "Chốt đăng ký", bg: "bg-emerald-100", text: "text-emerald-800" },
  lost: { label: "Thất bại", bg: "bg-red-100", text: "text-red-700" },
};

const LEAD_QUALITY_MAP: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  hot: { label: "Hot Lead", bg: "bg-rose-100", text: "text-rose-700", icon: Flame },
  warm: { label: "Warm", bg: "bg-amber-100", text: "text-amber-700", icon: Sun },
  cold: { label: "Cold", bg: "bg-blue-100", text: "text-blue-700", icon: Snowflake },
  unknown: { label: "Chưa loại", bg: "bg-slate-100", text: "text-slate-500", icon: Clock },
};

function StatusBadge({ status }: { status: RegistrationStatus }) {
  const cfg = REGISTRATION_STATUS_MAP[status] || REGISTRATION_STATUS_MAP.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

function FollowUpBadge({ status }: { status?: string | null }) {
  const s = status || "new";
  const cfg = FOLLOW_UP_MAP[s] || FOLLOW_UP_MAP.new;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function QualityBadge({ quality }: { quality?: string | null }) {
  const q = quality || "unknown";
  const cfg = LEAD_QUALITY_MAP[q] || LEAD_QUALITY_MAP.unknown;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${cfg.bg} ${cfg.text}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function toDateTimeLocal(isoStr?: string | null) {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

function fromDateTimeLocal(val: string) {
  if (!val) return null;
  return new Date(val).toISOString();
}

function parseAttributionFromNotes(notesText?: string | null) {
  if (!notesText) {
    return { cleanNotes: "", campaign: null, utmSource: null, utmMedium: null, utmCampaign: null };
  }

  let campaign: string | null = null;
  let utmSource: string | null = null;
  let utmMedium: string | null = null;
  let utmCampaign: string | null = null;

  const cleanNotes = notesText
    .replace(/\[campaign:\s*([^\]]+)\]/gi, (_, val) => {
      campaign = val.trim();
      return "";
    })
    .replace(/\[utm_source:\s*([^\]]+)\]/gi, (_, val) => {
      utmSource = val.trim();
      return "";
    })
    .replace(/\[utm_medium:\s*([^\]]+)\]/gi, (_, val) => {
      utmMedium = val.trim();
      return "";
    })
    .replace(/\[utm_campaign:\s*([^\]]+)\]/gi, (_, val) => {
      utmCampaign = val.trim();
      return "";
    })
    .trim();

  return { cleanNotes, campaign, utmSource, utmMedium, utmCampaign };
}

function AcademyRegistrationsCrmAdmin() {
  const [registrations, setRegistrations] = useState<BatchRegistrationLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [quickFilter, setQuickFilter] = useState<string>("all"); // 'all' | 'today' | 'overdue' | 'unassigned' | 'hot' | 'confirmed' | 'landing_campaign'

  const [selectedLead, setSelectedLead] = useState<BatchRegistrationLead | null>(null);
  const [leadInsights, setLeadInsights] = useState<LeadInsightData | null>(null);
  const [phoneHistory, setPhoneHistory] = useState<BatchRegistrationLead[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Follow-up form state inside drawer
  const [followUpStatus, setFollowUpStatus] = useState("new");
  const [leadQuality, setLeadQuality] = useState("unknown");
  const [nextFollowUpAt, setNextFollowUpAt] = useState("");
  const [assignedToEmail, setAssignedToEmail] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [lostReason, setLostReason] = useState("");
  const [savingFollowUp, setSavingFollowUp] = useState(false);

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

  // Phone frequency map across current dataset
  const phoneCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    registrations.forEach((r) => {
      const clean = (r.phone || "").replace(/[^0-9]/g, "");
      if (clean) {
        counts[clean] = (counts[clean] || 0) + 1;
      }
    });
    return counts;
  }, [registrations]);

  // List of unique campaign slugs found in dataset for filter dropdown
  const availableCampaignSlugs = useMemo(() => {
    const slugs = new Set<string>();
    registrations.forEach((r) => {
      const parsed = parseAttributionFromNotes(r.notes || r.note);
      if (parsed.campaign) slugs.add(parsed.campaign);
    });
    return Array.from(slugs);
  }, [registrations]);

  // Quick & Campaign filtering
  const filteredRegistrations = useMemo(() => {
    const now = new Date();
    return registrations.filter((r) => {
      const parsed = parseAttributionFromNotes(r.notes || r.note);

      if (campaignFilter !== "all") {
        if (parsed.campaign !== campaignFilter) return false;
      }

      if (quickFilter === "landing_campaign") {
        return r.source === "landing_page" || Boolean(parsed.campaign);
      }

      if (quickFilter === "today") {
        if (!r.next_follow_up_at) return false;
        try {
          const d = parseISO(r.next_follow_up_at);
          return isToday(d);
        } catch { return false; }
      }
      if (quickFilter === "overdue") {
        if (!r.next_follow_up_at) return false;
        try {
          const d = parseISO(r.next_follow_up_at);
          return isBefore(d, startOfDay(now));
        } catch { return false; }
      }
      if (quickFilter === "unassigned") {
        return !r.assigned_to_email;
      }
      if (quickFilter === "hot") {
        return r.lead_quality === "hot";
      }
      if (quickFilter === "confirmed") {
        return r.status === "confirmed";
      }
      return true;
    });
  }, [registrations, quickFilter, campaignFilter]);

  const [leadOrder, setLeadOrder] = useState<AcademyOrder | null>(null);
  const [processingOrder, setProcessingOrder] = useState(false);

  const loadLeadDetails = async (lead: BatchRegistrationLead) => {
    setSelectedLead(lead);
    setFollowUpStatus(lead.follow_up_status || "new");
    setLeadQuality(lead.lead_quality || "unknown");
    setNextFollowUpAt(toDateTimeLocal(lead.next_follow_up_at));
    setAssignedToEmail(lead.assigned_to_email || "");
    setInternalNote(lead.internal_note || lead.note || lead.notes || "");
    setLostReason(lead.lost_reason || "");

    setPhoneHistory([]);
    setLeadOrder(null);
    setLoadingInsights(true);
    try {
      const [insights, phoneRegs, existingOrder] = await Promise.all([
        getLeadInsights(lead.id).catch(() => null),
        getRegistrationsByPhone(lead.phone).catch(() => []),
        ordersApi.getOrderByRegistrationId(lead.id).catch(() => null),
      ]);
      setLeadInsights(insights);
      setPhoneHistory(phoneRegs || []);
      setLeadOrder(existingOrder);
    } catch (e) {
      console.error("loadLeadDetails error:", e);
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleAdminConfirmPayment = async () => {
    if (!selectedLead) return;
    setProcessingOrder(true);
    try {
      const courseId = (selectedLead as any).course_id || "course-default-id";
      const res = await ordersApi.adminConfirmPayment({
        orderId: leadOrder?.id,
        registrationId: selectedLead.id,
        courseId: courseId,
        batchId: selectedLead.batch_id,
        phone: selectedLead.phone,
        fullName: selectedLead.full_name,
      });
      if (res.ok) {
        toast.success("Đã xác nhận thanh toán & mở quyền học viên thành công!");
        fetchRegistrations();
        loadLeadDetails({ ...selectedLead, status: "paid" as any });
      } else {
        toast.error(res.message || "Không thể xác nhận thanh toán.");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi xác nhận thanh toán.");
    } finally {
      setProcessingOrder(false);
    }
  };

  const handleAdminCreateOrder = async () => {
    if (!selectedLead) return;
    const inputAmount = window.prompt("Nhập số tiền đơn hàng (VNĐ):", "1500000");
    if (!inputAmount) return;
    const amount = parseFloat(inputAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Số tiền không hợp lệ.");
      return;
    }

    setProcessingOrder(true);
    try {
      const res = await ordersApi.createPaidCourseOrder({
        registrationId: selectedLead.id,
        courseId: (selectedLead as any).course_id,
        batchId: selectedLead.batch_id,
        fullName: selectedLead.full_name,
        phone: selectedLead.phone,
        email: selectedLead.email || undefined,
        amount: amount,
      });
      if (res.ok && res.order) {
        toast.success("Đã tạo đơn thanh toán mới thành công!");
        setLeadOrder(res.order);
      } else {
        toast.error(res.message || "Không thể tạo đơn thanh toán.");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi tạo đơn thanh toán.");
    } finally {
      setProcessingOrder(false);
    }
  };

  const handleAdminCancelOrder = async () => {
    if (!leadOrder) return;
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn thanh toán này?")) return;
    setProcessingOrder(true);
    try {
      await ordersApi.adminCancelOrder(leadOrder.id);
      toast.success("Đã hủy đơn thanh toán.");
      setLeadOrder({ ...leadOrder, payment_status: "cancelled" });
    } catch (err: any) {
      toast.error(err.message || "Lỗi hủy đơn thanh toán.");
    } finally {
      setProcessingOrder(false);
    }
  };

  const handleUpdateRegistrationStatus = async (newStatus: RegistrationStatus) => {
    if (!selectedLead) return;

    if (newStatus === "confirmed") {
      const ok = window.confirm(
        "Xác nhận đăng ký này? Hệ thống sẽ tạo thông báo ZNS xác nhận gửi cho khách hàng."
      );
      if (!ok) return;
    }

    let noteToSave = internalNote;
    if (newStatus === "cancelled") {
      const reason = window.prompt("Nhập lý do hủy đăng ký (không bắt buộc):");
      if (reason === null) return;
      if (reason) noteToSave = reason;
    }

    try {
      await updateRegistrationStatus(selectedLead.id, newStatus, noteToSave);
      toast.success(
        newStatus === "confirmed"
          ? "Đã xác nhận đăng ký! Đã queue thông báo ZNS."
          : `Đã chuyển trạng thái sang "${REGISTRATION_STATUS_MAP[newStatus]?.label || newStatus}".`
      );

      fetchRegistrations();
      loadLeadDetails({ ...selectedLead, status: newStatus });
    } catch (err: any) {
      console.error("handleUpdateRegistrationStatus error:", err);
      toast.error(err.message || "Cập nhật trạng thái thất bại.");
    }
  };

  const handleSaveFollowUp = async () => {
    if (!selectedLead) return;
    setSavingFollowUp(true);
    try {
      await updateRegistrationFollowUp({
        registrationId: selectedLead.id,
        followUpStatus,
        leadQuality,
        nextFollowUpAt: fromDateTimeLocal(nextFollowUpAt),
        assignedToEmail: assignedToEmail.trim() || null,
        internalNote: internalNote.trim() || null,
        lostReason: lostReason.trim() || null,
      });

      toast.success("Đã lưu thông tin chăm sóc lead!");
      fetchRegistrations();
      loadLeadDetails({
        ...selectedLead,
        follow_up_status: followUpStatus,
        lead_quality: leadQuality,
        next_follow_up_at: fromDateTimeLocal(nextFollowUpAt),
        assigned_to_email: assignedToEmail.trim() || null,
        internal_note: internalNote.trim() || null,
        lost_reason: lostReason.trim() || null,
      });
    } catch (err: any) {
      console.error("handleSaveFollowUp error:", err);
      toast.error(err.message || "Lỗi khi lưu chăm sóc lead.");
    } finally {
      setSavingFollowUp(false);
    }
  };

  const handleExportCsv = () => {
    exportRegistrationsToCsv(filteredRegistrations, "tat-ca-dang-ky");
    toast.success("Đã xuất danh sách thành file CSV.");
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 font-sans antialiased text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>DESEMBRE ACADEMY CRM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Đăng ký khóa học & Tư vấn CRM
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Quản lý khách đăng ký, phân công tư vấn và đặt lịch follow-up chăm sóc học viên.
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

      {/* Quick Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
        {[
          { key: "all", label: `Tất cả (${registrations.length})` },
          { key: "landing_campaign", label: "🎯 Landing Campaign" },
          { key: "today", label: "Cần gọi hôm nay" },
          { key: "overdue", label: "Quá hạn follow-up" },
          { key: "unassigned", label: "Chưa phân công" },
          { key: "hot", label: "Hot Lead" },
          { key: "confirmed", label: "Đã xác nhận" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setQuickFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
              quickFilter === f.key
                ? "bg-slate-900 text-white shadow-md"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, SĐT Zalo, email, sale phụ trách..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap gap-2.5">
          {availableCampaignSlugs.length > 0 && (
            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-purple-50 border border-purple-200 text-purple-900 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="all">Tất cả Campaign Ads</option>
              {availableCampaignSlugs.map((slug) => (
                <option key={slug} value={slug}>
                  Campaign: {slug}
                </option>
              ))}
            </select>
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">Tất cả trạng thái hệ thống</option>
            <option value="pending">Mới đăng ký</option>
            <option value="contacted">Đã liên hệ</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="cancelled">Đã hủy</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">Tất cả nguồn</option>
            <option value="landing_page">Landing Page Campaign</option>
            <option value="public_schedule">Lịch khai giảng (Public)</option>
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
                <th className="px-5 py-4">Khóa học / Lớp</th>
                <th className="px-5 py-4">Chăm sóc CRM</th>
                <th className="px-5 py-4">Người phụ trách</th>
                <th className="px-5 py-4">Lịch Follow-up</th>
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
              ) : filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400 space-y-2">
                    <User className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="font-bold text-slate-700">Không tìm thấy đăng ký nào</p>
                    <p className="text-xs text-slate-400">Thử thay đổi tab bộ lọc hoặc từ khóa tìm kiếm.</p>
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map((lead) => {
                  const cleanPhone = (lead.phone || "").replace(/[^0-9]/g, "");
                  const hasOtherRegistrations = (phoneCounts[cleanPhone] || 0) > 1;

                  let isOverdue = false;
                  if (lead.next_follow_up_at) {
                    try {
                      isOverdue = isBefore(parseISO(lead.next_follow_up_at), startOfDay(new Date()));
                    } catch {}
                  }

                  return (
                    <tr
                      key={lead.id}
                      className={`transition-colors hover:bg-slate-50/80 ${
                        isOverdue ? "bg-rose-50/30" : ""
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{lead.full_name}</span>
                          {hasOtherRegistrations && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                              <Users className="w-3 h-3" />
                              Có đăng ký khác
                            </span>
                          )}
                        </div>
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
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusBadge status={lead.status} />
                          <FollowUpBadge status={lead.follow_up_status} />
                          <QualityBadge quality={lead.lead_quality} />
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs">
                        {lead.assigned_to_email ? (
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                            {lead.assigned_to_email}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Chưa gán</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs">
                        {lead.next_follow_up_at ? (
                          <div className={`flex items-center gap-1 font-semibold ${
                            isOverdue ? "text-rose-600 font-bold" : "text-slate-700"
                          }`}>
                            {isOverdue && <AlertTriangle className="w-3.5 h-3.5 shrink-0 animate-bounce" />}
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{format(parseISO(lead.next_follow_up_at), "dd/MM/yyyy HH:mm")}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Chưa hẹn</span>
                        )}
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
                  );
                })
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
                  CRM LEAD # {selectedLead.id.slice(0, 8)}
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
                    Trạng thái đăng ký
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

              {/* CRM Follow-up & Care Box */}
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                    <PhoneCall className="w-4 h-4 text-indigo-600" />
                    <span>Chăm sóc lead & Lịch hẹn</span>
                  </h4>
                  <Button
                    onClick={handleSaveFollowUp}
                    disabled={savingFollowUp}
                    size="sm"
                    className="h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
                  >
                    {savingFollowUp ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                    Lưu chăm sóc
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Trạng thái tư vấn (CRM Status)
                    </label>
                    <select
                      value={followUpStatus}
                      onChange={(e) => setFollowUpStatus(e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="new">Mới đăng ký</option>
                      <option value="need_call">Cần gọi chăm sóc</option>
                      <option value="contacted">Đã liên hệ</option>
                      <option value="callback_scheduled">Hẹn gọi lại</option>
                      <option value="no_answer">Không nghe máy</option>
                      <option value="qualified">Tiềm năng (Qualified)</option>
                      <option value="unqualified">Không tiềm năng</option>
                      <option value="won">Chốt đăng ký thành công</option>
                      <option value="lost">Thất bại / Hủy lead</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Đánh giá chất lượng (Lead Quality)
                    </label>
                    <select
                      value={leadQuality}
                      onChange={(e) => setLeadQuality(e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="hot">🔥 Hot Lead (Rất muốn học)</option>
                      <option value="warm">☀️ Warm (Đang phân vân)</option>
                      <option value="cold">❄️ Cold (Tham khảo)</option>
                      <option value="unknown">⚪ Chưa phân loại</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Lịch follow-up tiếp theo
                    </label>
                    <input
                      type="datetime-local"
                      value={nextFollowUpAt}
                      onChange={(e) => setNextFollowUpAt(e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Email tư vấn viên phụ trách
                    </label>
                    <input
                      type="email"
                      value={assignedToEmail}
                      onChange={(e) => setAssignedToEmail(e.target.value)}
                      placeholder="e.g. sale@desembre.vn"
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                {(followUpStatus === "lost" || followUpStatus === "unqualified") && (
                  <div>
                    <label className="text-[11px] font-bold text-rose-700 block mb-1">
                      Lý do thất bại / Không tiềm năng
                    </label>
                    <input
                      type="text"
                      value={lostReason}
                      onChange={(e) => setLostReason(e.target.value)}
                      placeholder="e.g. Trùng giờ làm, học phí quá cao..."
                      className="w-full h-9 px-3 bg-white border border-rose-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Ghi chú chăm sóc nội bộ
                  </label>
                  <textarea
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    rows={2}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Ghi chú kết quả cuộc gọi, nhu cầu đặc biệt..."
                  />
                </div>
              </div>

              {/* Section 2: Thanh Toán & Quyền Học Viên (P3C.65) */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Thanh toán & Quyền học viên</span>
                  </h4>
                  {leadOrder ? (
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      leadOrder.payment_status === "paid"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : leadOrder.payment_status === "cancelled"
                        ? "bg-slate-100 text-slate-600 border-slate-200"
                        : "bg-amber-100 text-amber-800 border-amber-300"
                    }`}>
                      {leadOrder.payment_status === "paid"
                        ? "Đã thanh toán"
                        : leadOrder.payment_status === "cancelled"
                        ? "Đã hủy đơn"
                        : "Chờ thanh toán"}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[11px] font-bold">
                      Chưa có đơn hàng
                    </span>
                  )}
                </div>

                {leadOrder ? (
                  <div className="space-y-2 text-xs text-emerald-950">
                    <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-emerald-200/80">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Số tiền đơn hàng:</span>
                        <span className="font-extrabold text-emerald-700 text-sm">{leadOrder.amount.toLocaleString("vi-VN")} VNĐ</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 block text-[10px]">Nội dung CK:</span>
                        <span className="font-mono font-bold text-slate-800">{leadOrder.bank_transfer_content}</span>
                      </div>
                    </div>

                    {leadOrder.paid_at && (
                      <div className="text-[11px] text-slate-500">
                        Xác nhận thanh toán lúc: <span className="font-semibold text-slate-800">{format(parseISO(leadOrder.paid_at), "dd/MM/yyyy HH:mm")}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Khách hàng chưa có đơn thanh toán tạo tự động.
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {(!leadOrder || leadOrder.payment_status === "pending_payment") && (
                    <Button
                      onClick={handleAdminConfirmPayment}
                      disabled={processingOrder}
                      size="sm"
                      className="h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs gap-1"
                    >
                      {processingOrder ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>Xác nhận đã thanh toán & Mở quyền</span>
                    </Button>
                  )}

                  {!leadOrder && (
                    <Button
                      onClick={handleAdminCreateOrder}
                      disabled={processingOrder}
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-xl text-xs font-semibold border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 gap-1"
                    >
                      <span>Tạo đơn thanh toán</span>
                    </Button>
                  )}

                  {leadOrder && leadOrder.payment_status === "pending_payment" && (
                    <Button
                      onClick={handleAdminCancelOrder}
                      disabled={processingOrder}
                      size="sm"
                      variant="ghost"
                      className="h-8 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      Hủy đơn
                    </Button>
                  )}
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
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                      selectedLead.source === "landing_page"
                        ? "bg-purple-100 text-purple-800 border border-purple-200"
                        : selectedLead.source === "public_schedule"
                        ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                        : "bg-slate-100 text-slate-700"
                    }`}>
                      {selectedLead.source === "landing_page"
                        ? "Landing Page Campaign"
                        : selectedLead.source === "public_schedule"
                        ? "Lịch khai giảng (Public)"
                        : (selectedLead.source || "Public Website")}
                    </span>
                  </div>
                </div>

                {(() => {
                  const raw = selectedLead.note || selectedLead.notes;
                  const parsed = parseAttributionFromNotes(raw);
                  const hasAttribution = parsed.campaign || parsed.utmSource || parsed.utmMedium || parsed.utmCampaign;

                  return (
                    <div className="pt-2 border-t border-slate-100 text-xs space-y-2">
                      {hasAttribution && (
                        <div className="bg-purple-50/80 border border-purple-200/80 rounded-xl p-3 space-y-1.5">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-purple-600" />
                            <span>Campaign Ads Attribution</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            {parsed.campaign && (
                              <div>
                                <span className="text-purple-600/80 block text-[10px]">Campaign Slug</span>
                                <span className="font-bold text-purple-900 font-mono">{parsed.campaign}</span>
                              </div>
                            )}
                            {parsed.utmSource && (
                              <div>
                                <span className="text-purple-600/80 block text-[10px]">UTM Source</span>
                                <span className="font-bold text-purple-900 font-mono">{parsed.utmSource}</span>
                              </div>
                            )}
                            {parsed.utmMedium && (
                              <div>
                                <span className="text-purple-600/80 block text-[10px]">UTM Medium</span>
                                <span className="font-bold text-purple-900 font-mono">{parsed.utmMedium}</span>
                              </div>
                            )}
                            {parsed.utmCampaign && (
                              <div>
                                <span className="text-purple-600/80 block text-[10px]">UTM Campaign</span>
                                <span className="font-bold text-purple-900 font-mono">{parsed.utmCampaign}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {parsed.cleanNotes && (
                        <div>
                          <span className="text-slate-400 block text-[10px] mb-0.5">Nhu cầu tư vấn / Ghi chú của khách</span>
                          <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-700 italic">
                            "{parsed.cleanNotes}"
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Duplicate Registrations by Phone Box */}
              {phoneHistory.length > 0 && (
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-600" />
                    <span>Lịch sử đăng ký cùng số điện thoại ({phoneHistory.length})</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    {phoneHistory.map((p) => (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between p-3 rounded-xl border shadow-2xs transition-colors ${
                          p.id === selectedLead.id
                            ? "bg-amber-100/70 border-amber-300 font-bold"
                            : "bg-white border-amber-100"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-900">
                            {p.course_title || "Khóa đào tạo DESEMBRE"}
                          </div>
                          <div className="text-[11px] text-slate-500 font-normal">
                            Lớp: {p.batch_title || p.batch_id} · {format(parseISO(p.created_at), "dd/MM/yyyy HH:mm")}
                          </div>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
            </div>

            {/* Drawer Footer Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                {selectedLead.status !== "contacted" && (
                  <Button
                    onClick={() => handleUpdateRegistrationStatus("contacted")}
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-xs font-semibold text-sky-700 border-sky-200 bg-sky-50 hover:bg-sky-100"
                  >
                    Đã liên hệ
                  </Button>
                )}

                {selectedLead.status !== "confirmed" && (
                  <Button
                    onClick={() => handleUpdateRegistrationStatus("confirmed")}
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-xs font-semibold border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                    Xác nhận giữ chỗ (Queue ZNS)
                  </Button>
                )}

                {(!leadOrder || leadOrder.payment_status === "pending_payment") && (
                  <Button
                    onClick={handleAdminConfirmPayment}
                    disabled={processingOrder}
                    size="sm"
                    className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md gap-1"
                  >
                    {processingOrder ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Xác nhận đã thanh toán & Mở quyền</span>
                  </Button>
                )}

                {selectedLead.status !== "cancelled" && (
                  <Button
                    onClick={() => handleUpdateRegistrationStatus("cancelled")}
                    size="sm"
                    variant="ghost"
                    className="rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    Hủy đăng ký
                  </Button>
                )}

                {selectedLead.status === "cancelled" && (
                  <Button
                    onClick={() => handleUpdateRegistrationStatus("pending")}
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
