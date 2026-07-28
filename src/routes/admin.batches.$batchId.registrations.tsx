import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  getBatchRegistrations,
  updateRegistrationStatus,
  exportRegistrationsToCsv,
  getLeadInsights,
  type BatchRegistrationLead,
  type RegistrationStatus,
  type LeadInsightData
} from "@/features/admin/services/academyAdminLeadPipelineApi";
import { Loader2, ArrowLeft, Download, Users, UserCheck, UserX, Clock, Phone, AlertCircle, Save, ChevronDown, ChevronUp, History, BellRing, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

export const Route = createFileRoute("/admin/batches/$batchId/registrations")({
  component: AdminBatchLeadsPage,
});

const STATUS_CONFIG: Record<RegistrationStatus, { label: string; bg: string; text: string }> = {
  pending: { label: "Pending", bg: "bg-gray-100", text: "text-gray-700" },
  contacted: { label: "Contacted", bg: "bg-blue-100", text: "text-blue-700" },
  confirmed: { label: "Confirmed", bg: "bg-green-100", text: "text-green-700" },
  rejected: { label: "Rejected", bg: "bg-red-100", text: "text-red-700" },
  cancelled: { label: "Cancelled", bg: "bg-slate-200", text: "text-slate-700" },
};

function StatusBadge({ status }: { status: RegistrationStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Lead Insight Panel Component
// ─────────────────────────────────────────────────────────────────────────────
function LeadInsightPanel({ registrationId }: { registrationId: string }) {
  const [data, setData] = useState<LeadInsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInsights() {
      try {
        setLoading(true);
        const res = await getLeadInsights(registrationId);
        setData(res);
      } catch (err: any) {
        setError(err.message || "Failed to load insights");
      } finally {
        setLoading(false);
      }
    }
    fetchInsights();
  }, [registrationId]);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;
  if (error) return <div className="p-4 text-destructive">{error}</div>;
  if (!data) return null;

  return (
    <div className="p-6 bg-slate-50/80 border-b shadow-inner space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Lịch sử xử lý */}
        <div className="md:col-span-1 space-y-4">
          <h4 className="font-semibold text-sm flex items-center gap-2"><History className="h-4 w-4 text-slate-500" /> Lịch sử trạng thái</h4>
          {data.history.length === 0 ? (
            <p className="text-xs text-muted-foreground">Chưa có lịch sử</p>
          ) : (
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
              {data.history.map((h, i) => (
                <div key={h.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-blue-500 text-slate-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10" />
                  <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-1">
                      <div className="text-[10px] text-muted-foreground flex justify-between">
                        <span>{format(parseISO(h.created_at), "dd/MM/yyyy HH:mm")}</span>
                      </div>
                      <div className="text-xs font-semibold">
                        {h.old_status ? <span className="line-through text-muted-foreground mr-1">{h.old_status}</span> : null}
                        <span className="text-blue-600">{h.new_status}</span>
                      </div>
                      {h.note && <div className="text-xs text-slate-600 mt-1 italic">"{h.note}"</div>}
                      {h.actor_email && <div className="text-[10px] text-slate-400 mt-1">bởi {h.actor_email}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lịch sử đăng ký khóa học */}
        <div className="md:col-span-1 space-y-4">
          <h4 className="font-semibold text-sm flex items-center gap-2"><User className="h-4 w-4 text-slate-500" /> Khoá học đã đăng ký</h4>
          {data.past_registrations.length === 0 ? (
            <p className="text-xs text-muted-foreground bg-white p-3 rounded border border-dashed">Chưa đăng ký khoá nào khác</p>
          ) : (
            <ul className="space-y-2">
              {data.past_registrations.map(r => (
                <li key={r.id} className="text-xs bg-white p-3 rounded border shadow-sm">
                  <div className="font-semibold text-blue-700">{r.course_title}</div>
                  <div className="text-slate-500 mt-0.5">{r.batch_title}</div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[10px] text-muted-foreground">{format(parseISO(r.created_at), "dd/MM/yyyy")}</span>
                    <StatusBadge status={r.status as RegistrationStatus} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Outbox Notifications */}
        <div className="md:col-span-1 space-y-4">
          <h4 className="font-semibold text-sm flex items-center gap-2"><BellRing className="h-4 w-4 text-slate-500" /> Trạng thái ZNS / Email</h4>
          {data.outbox.length === 0 ? (
            <p className="text-xs text-muted-foreground bg-white p-3 rounded border border-dashed">Không có thông báo nào trong hàng đợi</p>
          ) : (
            <ul className="space-y-2">
              {data.outbox.map(o => (
                <li key={o.id} className="text-xs bg-white p-3 rounded border shadow-sm flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="uppercase font-semibold text-slate-600">{o.channel}</span>
                    <span className={`px-1.5 rounded text-[10px] font-bold ${o.status === 'sent' ? 'bg-green-100 text-green-700' : o.status === 'queued' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {o.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">Tạo lúc: {format(parseISO(o.created_at), "dd/MM HH:mm")}</div>
                  {o.sent_at && <div className="text-[10px] text-green-600">Gửi lúc: {format(parseISO(o.sent_at), "dd/MM HH:mm")}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Row Component (Editable + Expandable)
// ─────────────────────────────────────────────────────────────────────────────
function LeadRow({ lead, onUpdate }: { lead: BatchRegistrationLead, onUpdate: () => void }) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<RegistrationStatus>(lead.status);
  const [adminNote, setAdminNote] = useState(lead.admin_note || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state if lead changes from parent
  useEffect(() => {
    setStatus(lead.status);
    setAdminNote(lead.admin_note || "");
  }, [lead]);

  const handleSave = async (quickStatus?: RegistrationStatus) => {
    try {
      setSaving(true);
      setError(null);
      await updateRegistrationStatus(lead.id, quickStatus || status, adminNote);
      setEditing(false);
      onUpdate(); // refresh data
    } catch (err: any) {
      setError(err.message || "Lỗi lưu trạng thái.");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = status !== lead.status || adminNote !== (lead.admin_note || "");

  return (
    <>
      <tr className={`hover:bg-muted/30 transition-colors border-b last:border-0 ${expanded ? 'bg-muted/10' : ''}`}>
        <td className="p-2 align-middle w-10">
          <Button variant="ghost" size="icon" onClick={() => setExpanded(!expanded)} className="h-8 w-8 text-slate-400">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </td>
        <td className="p-4 align-top">
          <div className="font-semibold text-sm cursor-pointer hover:text-blue-600" onClick={() => setExpanded(!expanded)}>{lead.full_name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{lead.phone}</div>
          {lead.email && <div className="text-xs text-muted-foreground">{lead.email}</div>}
          {lead.source && <div className="text-[10px] uppercase text-slate-400 mt-1 font-semibold">Nguồn: {lead.source}</div>}
        </td>
        <td className="p-4 align-top">
          <div className="text-sm">{lead.company || "—"}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{lead.participant_role || "—"}</div>
        </td>
        <td className="p-4 align-top min-w-[200px]">
          {editing ? (
            <div className="space-y-2">
              <select
                value={status}
                onChange={e => setStatus(e.target.value as RegistrationStatus)}
                className="h-8 w-full rounded-md border bg-background px-2 text-xs font-medium"
              >
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
                <option value="confirmed">Confirmed</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <textarea
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                placeholder="Ghi chú nội bộ..."
                className="w-full min-h-[60px] text-xs p-2 border rounded-md"
              />
              {error && <div className="text-[10px] text-destructive">{error}</div>}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => {
                  setEditing(false);
                  setStatus(lead.status);
                  setAdminNote(lead.admin_note || "");
                  setError(null);
                }}>Huỷ</Button>
                <Button size="sm" className="h-7 text-xs px-2" disabled={!hasChanges || saving} onClick={() => handleSave()}>
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 mr-1" />} Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="group cursor-pointer" onClick={() => setEditing(true)}>
              <div className="mb-2"><StatusBadge status={lead.status} /></div>
              {lead.admin_note ? (
                <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-md border italic line-clamp-3">
                  {lead.admin_note}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground/50 italic opacity-0 group-hover:opacity-100 transition-opacity">
                  Nhấn để thêm ghi chú...
                </div>
              )}
            </div>
          )}
        </td>
        <td className="p-4 align-top max-w-[250px]">
          <div className="text-xs whitespace-pre-wrap">{lead.note || "—"}</div>
        </td>
        <td className="p-4 align-top">
          <div className="text-xs text-slate-600">
            {format(parseISO(lead.created_at), "dd/MM/yyyy HH:mm")}
          </div>
          {(lead.contacted_at || lead.confirmed_at) && (
            <div className="mt-2 space-y-1">
              {lead.contacted_at && (
                <div className="text-[10px] text-blue-600 flex gap-1 items-center">
                  <Phone className="h-3 w-3" /> {format(parseISO(lead.contacted_at), "dd/MM HH:mm")}
                </div>
              )}
              {lead.confirmed_at && (
                <div className="text-[10px] text-green-600 flex gap-1 items-center">
                  <UserCheck className="h-3 w-3" /> {format(parseISO(lead.confirmed_at), "dd/MM HH:mm")}
                </div>
              )}
            </div>
          )}
        </td>
        <td className="p-4 align-top text-right">
            {!editing && (
              <div className="flex flex-col gap-1">
                 {lead.status === 'pending' && (
                   <Button size="sm" variant="outline" className="h-7 text-[10px] text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => handleSave("contacted")} disabled={saving}>
                     Mark Contacted
                   </Button>
                 )}
                 {(lead.status === 'contacted' || lead.status === 'pending') && (
                   <Button size="sm" variant="outline" className="h-7 text-[10px] text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleSave("confirmed")} disabled={saving}>
                     Confirm
                   </Button>
                 )}
                 {lead.status !== 'rejected' && lead.status !== 'cancelled' && lead.status !== 'confirmed' && (
                   <Button size="sm" variant="outline" className="h-7 text-[10px] text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleSave("rejected")} disabled={saving}>
                     Reject
                   </Button>
                 )}
                 {lead.status === 'confirmed' && (
                   <Button size="sm" variant="outline" className="h-7 text-[10px] text-slate-600 border-slate-200 hover:bg-slate-50" onClick={() => handleSave("cancelled")} disabled={saving}>
                     Cancel
                   </Button>
                 )}
              </div>
            )}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="p-0 border-b">
            <LeadInsightPanel registrationId={lead.id} />
          </td>
        </tr>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────
function AdminBatchLeadsPage() {
  const { batchId } = Route.useParams();
  const [leads, setLeads] = useState<BatchRegistrationLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | RegistrationStatus>("all");

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBatchRegistrations(batchId);
      setLeads(data);
    } catch (err: any) {
      setError(err.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLeads(); }, [batchId]);

  const batchTitle = leads.length > 0 ? leads[0].batch_title : "";
  const batchSlug = leads.length > 0 ? leads[0].batch_slug : batchId;

  // Stats
  const stats = useMemo(() => {
    return {
      total: leads.length,
      pending: leads.filter(l => l.status === "pending").length,
      contacted: leads.filter(l => l.status === "contacted").length,
      confirmed: leads.filter(l => l.status === "confirmed").length,
      rejected: leads.filter(l => l.status === "rejected" || l.status === "cancelled").length,
    };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    if (filter === "all") return leads;
    return leads.filter(l => l.status === filter);
  }, [leads, filter]);

  const handleExport = () => {
    exportRegistrationsToCsv(leads, batchTitle || batchSlug || "leads");
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-[1400px]">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Button variant="ghost" asChild className="mb-2 -ml-4 h-8 px-4">
            <Link to="/admin/batches">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Batches
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Batch Leads</h1>
          {batchTitle && <p className="text-muted-foreground mt-1 text-lg">{batchTitle}</p>}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExport} disabled={leads.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {!loading && !error && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
            <Users className="h-5 w-5 text-slate-400 mb-2" />
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Tổng Leads</div>
          </div>
          <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col items-center justify-center text-center border-b-4 border-b-gray-400">
            <Clock className="h-5 w-5 text-gray-400 mb-2" />
            <div className="text-2xl font-bold">{stats.pending}</div>
            <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Pending</div>
          </div>
          <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col items-center justify-center text-center border-b-4 border-b-blue-400">
            <Phone className="h-5 w-5 text-blue-400 mb-2" />
            <div className="text-2xl font-bold">{stats.contacted}</div>
            <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Contacted</div>
          </div>
          <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col items-center justify-center text-center border-b-4 border-b-green-400">
            <UserCheck className="h-5 w-5 text-green-400 mb-2" />
            <div className="text-2xl font-bold">{stats.confirmed}</div>
            <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Confirmed</div>
          </div>
          <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col items-center justify-center text-center border-b-4 border-b-red-400">
            <UserX className="h-5 w-5 text-red-400 mb-2" />
            <div className="text-2xl font-bold">{stats.rejected}</div>
            <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Fail / Cancel</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {!loading && !error && (
        <div className="flex flex-wrap gap-2 mb-4">
          <Button variant={filter === "all" ? "default" : "secondary"} size="sm" className="rounded-full h-8" onClick={() => setFilter("all")}>All</Button>
          <Button variant={filter === "pending" ? "default" : "secondary"} size="sm" className="rounded-full h-8" onClick={() => setFilter("pending")}>Pending</Button>
          <Button variant={filter === "contacted" ? "default" : "secondary"} size="sm" className="rounded-full h-8" onClick={() => setFilter("contacted")}>Contacted</Button>
          <Button variant={filter === "confirmed" ? "default" : "secondary"} size="sm" className="rounded-full h-8" onClick={() => setFilter("confirmed")}>Confirmed</Button>
          <Button variant={filter === "rejected" ? "default" : "secondary"} size="sm" className="rounded-full h-8" onClick={() => setFilter("rejected")}>Rejected</Button>
          <Button variant={filter === "cancelled" ? "default" : "secondary"} size="sm" className="rounded-full h-8" onClick={() => setFilter("cancelled")}>Cancelled</Button>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            {filter === "all" ? "Chưa có lead đăng ký nào cho batch này." : "Không có lead nào khớp với bộ lọc."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="w-10"></th>
                  <th className="p-4 font-semibold text-sm">Học viên</th>
                  <th className="p-4 font-semibold text-sm">Công ty / Vai trò</th>
                  <th className="p-4 font-semibold text-sm">Trạng thái / Ghi chú Admin</th>
                  <th className="p-4 font-semibold text-sm">Lời nhắn của Lead</th>
                  <th className="p-4 font-semibold text-sm">Ngày tháng</th>
                  <th className="p-4 font-semibold text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map(lead => (
                  <LeadRow key={lead.id} lead={lead} onUpdate={loadLeads} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
