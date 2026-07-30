import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  getAdminNotificationOutbox,
  adminRetryNotificationJob,
  getNotificationOpsSummary,
  requeueStuckNotificationJobs,
  type NotificationJob,
  type OutboxStatus,
  type NotificationOpsSummary
} from "@/features/admin/services/academyAdminNotificationsApi";
import { processZnsOutboxProxy, getZnsHubHealthProxy } from "@/features/admin/services/znsWorkerProxy.server";
import { Loader2, ArrowLeft, Send, AlertCircle, CheckCircle2, Clock, RefreshCw, ServerCog, Mail, MessageSquare, Activity, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/notifications")({
  component: AdminNotificationsPage,
});

const STATUS_CONFIG: Record<OutboxStatus, { label: string; bg: string; text: string; icon: any }> = {
  queued: { label: "Queued", bg: "bg-gray-100", text: "text-gray-700", icon: Clock },
  processing: { label: "Processing", bg: "bg-blue-100", text: "text-blue-700", icon: RefreshCw },
  sent: { label: "Sent", bg: "bg-green-100", text: "text-green-700", icon: CheckCircle2 },
  failed: { label: "Failed", bg: "bg-red-100", text: "text-red-700", icon: AlertCircle },
  skipped: { label: "Skipped", bg: "bg-slate-200", text: "text-slate-700", icon: AlertCircle },
};

function StatusBadge({ status }: { status: OutboxStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.queued;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <Icon className="h-3 w-3 mr-1" />
      {cfg.label}
    </span>
  );
}

function AdminNotificationsPage() {
  const [jobs, setJobs] = useState<NotificationJob[]>([]);
  const [opsSummary, setOpsSummary] = useState<NotificationOpsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | OutboxStatus>("all");
  
  const [simulating, setSimulating] = useState(false);
  const [requeuing, setRequeuing] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [mode, setMode] = useState<"simulate" | "real">("simulate");
  const [hubHealth, setHubHealth] = useState<any>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [jobsData, summaryData, healthData] = await Promise.all([
        getAdminNotificationOutbox(),
        getNotificationOpsSummary(),
        getZnsHubHealthProxy()
      ]);
      setJobs(jobsData);
      setOpsSummary(summaryData);
      setHubHealth(healthData);
    } catch (err: any) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const stats = useMemo(() => {
    return {
      total: jobs.length,
      queued: jobs.filter(j => j.status === "queued").length,
      processing: jobs.filter(j => j.status === "processing").length,
      sent: jobs.filter(j => j.status === "sent").length,
      failed: jobs.filter(j => j.status === "failed" || j.status === "skipped").length,
    };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    if (filter === "all") return jobs;
    return jobs.filter(j => j.status === filter);
  }, [jobs, filter]);

  const handleSimulate = async () => {
    try {
      setSimulating(true);
      setError(null);
      
      const data = await processZnsOutboxProxy({ data: { mode, limit: 10 } });
      
      if (data && data.processed > 0) {
        toast.success(`Processed ${data.processed} jobs. Sent: ${data.sent}, Failed: ${data.failed}`);
        await loadData();
      } else {
        toast.info("Không có job nào trong hàng đợi.");
        await loadData();
      }
    } catch (err: any) {
      let errorMsg = err.message || "Đã xảy ra lỗi hệ thống.";
      if (errorMsg.startsWith("{")) {
        try {
          const parsed = JSON.parse(errorMsg);
          if (parsed.missing && Array.isArray(parsed.missing)) {
            errorMsg = `Hub thiếu cấu hình: ${parsed.missing.join(", ")}`;
            if (mode === "real") {
              errorMsg += ". Hãy chuyển sang Simulate để test local, hoặc cấu hình Zalo ENV thật trong Hub .env.";
            }
          } else if (parsed.error) {
            errorMsg = parsed.error;
          }
        } catch (e) {}
      }
      setError(errorMsg);
      toast.error("Lỗi Worker: " + errorMsg);
    } finally {
      setSimulating(false);
    }
  };

  const handleRequeue = async () => {
    try {
      setRequeuing(true);
      setError(null);
      const count = await requeueStuckNotificationJobs();
      toast.success(`Đã requeue ${count} jobs bị kẹt.`);
      if (count > 0) await loadData();
    } catch (err: any) {
      setError("Lỗi requeue: " + err.message);
      toast.error("Lỗi requeue: " + err.message);
    } finally {
      setRequeuing(false);
    }
  };

  const handleRetry = async (jobId: string) => {
    try {
      setRetrying(jobId);
      setError(null);
      await adminRetryNotificationJob(jobId);
      toast.success("Đã đưa job trở lại hàng đợi.");
      await loadData();
    } catch (err: any) {
      setError("Lỗi retry: " + err.message);
      toast.error("Lỗi retry: " + err.message);
    } finally {
      setRetrying(null);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-[1400px]">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notification Outbox</h1>
          <p className="text-muted-foreground mt-1 text-sm">Quản lý hàng đợi ZNS & Email</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mr-2 bg-muted p-1 rounded-md border">
              <button 
                className={`px-3 py-1.5 text-xs font-medium rounded ${mode === 'simulate' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setMode('simulate')}
              >
                Simulate
              </button>
              <button 
                className={`px-3 py-1.5 text-xs font-medium rounded ${mode === 'real' ? 'bg-background shadow-sm text-indigo-600' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setMode('real')}
              >
                Real ZNS
              </button>
            </div>
            {mode === 'real' && (
              <span className="text-[10px] text-amber-600 font-semibold mt-1">
                Real ZNS yêu cầu ZALO_ACCESS_TOKEN và template IDs trong Hub.
              </span>
            )}
            {mode === 'real' && hubHealth?.env && (!hubHealth.env.hasZaloSenderCredential || !hubHealth.env.hasTemplateMappings) && (
              <span className="text-[10px] text-red-600 font-semibold mt-1 max-w-xs">
                Cảnh báo: Hub đang thiếu cấu hình Sender Credential hoặc Template Mappings cho Real ZNS. Vui lòng cập nhật .env.
              </span>
            )}
          </div>
          <Button 
            onClick={handleSimulate} 
            disabled={simulating || (mode === 'real' && hubHealth?.env && (!hubHealth.env.hasZaloSenderCredential || !hubHealth.env.hasTemplateMappings))} 
            className={mode === 'real' ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-600 hover:bg-slate-700"}
          >
            {simulating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ServerCog className="mr-2 h-4 w-4" />}
            {simulating ? "Processing..." : (mode === 'real' ? "Run Worker Now" : "Run Simulation")}
          </Button>
          <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={handleRequeue} disabled={requeuing}>
            {requeuing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldAlert className="h-4 w-4 mr-2" />}
            Requeue Stuck
          </Button>
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Worker Health / Summary Cards */}
      {!loading && !error && opsSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <div className="col-span-2 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-4 shadow-sm flex flex-col justify-center">
             <div className="flex items-center gap-2 mb-2">
               <Activity className="h-4 w-4 text-indigo-500" />
               <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Worker Health</span>
             </div>
             <div className="text-sm font-medium">
               Last run: {opsSummary.last_run_at ? formatDistanceToNow(parseISO(opsSummary.last_run_at), { addSuffix: true }) : "Never"}
             </div>
             <div className="text-xs text-muted-foreground mt-1">
               Status: {opsSummary.last_run_ok ? <span className="text-green-600 font-semibold">OK</span> : <span className="text-red-600 font-semibold">Error</span>} | Mode: {opsSummary.last_run_mode || 'N/A'}
             </div>
          </div>
          <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col items-center justify-center text-center border-b-4 border-b-gray-400">
             <div className="text-2xl font-bold text-gray-700">{opsSummary.queued_count}</div>
             <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider flex items-center"><Clock className="h-3 w-3 mr-1"/> Queued</div>
          </div>
          <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col items-center justify-center text-center border-b-4 border-b-blue-400">
             <div className="text-2xl font-bold text-blue-700">{opsSummary.processing_count}</div>
             <div className="text-xs text-blue-500 uppercase font-semibold tracking-wider flex items-center"><RefreshCw className="h-3 w-3 mr-1"/> Process</div>
             {opsSummary.stuck_count > 0 && (
               <div className="text-[10px] text-red-500 font-bold mt-1 bg-red-50 px-1.5 py-0.5 rounded">
                 {opsSummary.stuck_count} STUCK
               </div>
             )}
          </div>
          <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col items-center justify-center text-center border-b-4 border-b-red-400">
             <div className="text-2xl font-bold text-red-700">{opsSummary.failed_count}</div>
             <div className="text-xs text-red-500 uppercase font-semibold tracking-wider flex items-center"><AlertCircle className="h-3 w-3 mr-1"/> Failed</div>
          </div>
          <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col items-center justify-center text-center border-b-4 border-b-green-400">
             <div className="text-2xl font-bold text-green-700">{opsSummary.sent_today}</div>
             <div className="text-xs text-green-500 uppercase font-semibold tracking-wider flex items-center">Sent Tdy</div>
          </div>
          <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col items-center justify-center text-center border-b-4 border-b-indigo-400">
             <div className="text-2xl font-bold text-indigo-700">{opsSummary.delivered_today}</div>
             <div className="text-xs text-indigo-500 uppercase font-semibold tracking-wider flex items-center">Deliv Tdy</div>
          </div>
          <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col items-center justify-center text-center border-b-4 border-b-purple-400">
             <div className="text-2xl font-bold text-purple-700">{opsSummary.seen_today}</div>
             <div className="text-xs text-purple-500 uppercase font-semibold tracking-wider flex items-center">Seen Tdy</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {!loading && !error && (
        <div className="flex flex-wrap gap-2 mb-4">
          <Button variant={filter === "all" ? "default" : "secondary"} size="sm" className="rounded-full h-8" onClick={() => setFilter("all")}>All</Button>
          <Button variant={filter === "queued" ? "default" : "secondary"} size="sm" className="rounded-full h-8" onClick={() => setFilter("queued")}>Queued</Button>
          <Button variant={filter === "sent" ? "default" : "secondary"} size="sm" className="rounded-full h-8" onClick={() => setFilter("sent")}>Sent</Button>
          <Button variant={filter === "failed" ? "default" : "secondary"} size="sm" className="rounded-full h-8" onClick={() => setFilter("failed")}>Failed</Button>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            {filter === "all" ? "Chưa có thông báo nào trong hàng đợi." : "Không có thông báo nào khớp với bộ lọc."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="p-4 font-semibold text-sm">Template & Channel</th>
                  <th className="p-4 font-semibold text-sm">Lead & Batch</th>
                  <th className="p-4 font-semibold text-sm">Sender Key</th>
                  <th className="p-4 font-semibold text-sm">Status & Attempts</th>
                  <th className="p-4 font-semibold text-sm">Error / Provider Info</th>
                  <th className="p-4 font-semibold text-sm">Thời gian</th>
                  <th className="p-4 font-semibold text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map(job => (
                  <tr key={job.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-4 align-top">
                      <div className="font-semibold text-sm text-indigo-700 flex items-center gap-1.5">
                        {job.channel === 'zalo' ? <MessageSquare className="h-4 w-4" /> : <Mail className="h-4 w-4" />} 
                        {job.template_code}
                      </div>
                      <div className="text-xs uppercase text-slate-500 font-semibold tracking-wider mt-1">{job.channel}</div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-semibold text-sm">{job.lead_name || "Unknown"}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{job.lead_phone || "Unknown Phone"}</div>
                      <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">{job.course_title} - {job.batch_title}</div>
                    </td>
                    <td className="p-4 align-top">
                      {job.sender_key ? (
                        <span className="text-xs font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-1 rounded">
                          {job.sender_key}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">—</span>
                      )}
                    </td>
                    <td className="p-4 align-top">
                      <div className="mb-1"><StatusBadge status={job.status} /></div>
                      <div className="text-[10px] text-muted-foreground font-semibold">
                        Attempts: {job.attempt_count ?? 0} / {job.max_attempts ?? 5}
                      </div>
                    </td>
                    <td className="p-4 align-top max-w-[200px]">
                      {job.error_message ? (
                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100 line-clamp-2" title={job.error_message}>
                          {job.error_message}
                        </div>
                      ) : job.provider_message_id ? (
                         <div className="text-xs text-slate-500">
                           <div className="font-semibold text-slate-700 mb-1">ID: {job.provider_message_id}</div>
                           {job.provider_status ? (
                             <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium">{job.provider_status}</span>
                           ) : job.status === "sent" ? (
                             <span className="text-amber-600 font-medium italic">Sent, waiting callback...</span>
                           ) : null}
                         </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="p-4 align-top text-xs text-slate-600 space-y-1">
                      <div><span className="font-medium text-slate-400 inline-block w-14">Tạo:</span> {format(parseISO(job.created_at), "dd/MM HH:mm")}</div>
                      {job.sent_at ? (
                        <div className="text-green-700"><span className="font-medium inline-block w-14">Gửi:</span> {format(parseISO(job.sent_at), "dd/MM HH:mm")}</div>
                      ) : job.next_attempt_at ? (
                        <div className="text-blue-600"><span className="font-medium inline-block w-14">Hẹn lại:</span> {format(parseISO(job.next_attempt_at), "dd/MM HH:mm")}</div>
                      ) : null}
                      {job.delivered_at && (
                        <div className="text-indigo-600"><span className="font-medium inline-block w-14">Đã nhận:</span> {format(parseISO(job.delivered_at), "dd/MM HH:mm")}</div>
                      )}
                      {job.seen_at && (
                        <div className="text-purple-600"><span className="font-medium inline-block w-14">Đã xem:</span> {format(parseISO(job.seen_at), "dd/MM HH:mm")}</div>
                      )}
                    </td>
                    <td className="p-4 align-top text-right">
                      {job.status === "failed" && (
                        <Button 
                           size="sm" 
                           variant="outline" 
                           className="h-8 text-xs border-amber-200 text-amber-600 hover:bg-amber-50"
                           onClick={() => handleRetry(job.id)}
                           disabled={retrying === job.id}
                        >
                          {retrying === job.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                          Retry
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
