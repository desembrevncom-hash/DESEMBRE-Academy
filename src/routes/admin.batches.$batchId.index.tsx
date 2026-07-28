import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { adminGetCourseBatches, adminUpdateCourseBatch } from "@/features/admin/services/academyAdminBatchesApi";
import { academyAdminCoursesApi } from "@/features/admin/services/academyAdminCoursesApi";
import {
  adminGetBatchSessions,
  adminCreateSession,
  adminUpdateSession,
  adminDeleteSession,
  type AdminSession,
} from "@/features/admin/services/academyAdminSessionsApi";
import {
  Loader2, ArrowLeft, Users, Plus, Pencil, Trash2,
  CalendarDays, MapPin, Video, MonitorPlay,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

export const Route = createFileRoute("/admin/batches/$batchId/")({
  component: AdminBatchesEditPage,
});

// ── helpers ──────────────────────────────────────────────────────────────────
function normalizeBatchStatus(value?: string | null) {
  return (value || "DRAFT").toUpperCase();
}
function toDateInputValue(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}
function generateSlug(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
function toDateTimeLocal(iso?: string | null) {
  if (!iso) return "";
  // "2024-08-01T09:00:00+07:00" → "2024-08-01T09:00"
  return iso.slice(0, 16);
}
function fromDateTimeLocal(val: string) {
  if (!val) return null;
  return new Date(val).toISOString();
}
function formatIcon(type: string) {
  switch (type) {
    case "zoom": return <Video className="h-4 w-4 text-blue-500" />;
    case "office": return <MapPin className="h-4 w-4 text-green-600" />;
    case "hybrid": return <MonitorPlay className="h-4 w-4 text-purple-500" />;
    default: return <CalendarDays className="h-4 w-4 text-orange-500" />;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Session Form (create / edit)
// ─────────────────────────────────────────────────────────────────────────────
interface SessionFormValues {
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  location_type: string;
  location_detail: string;
}

interface SessionFormProps {
  batchId: string;
  editing: AdminSession | null;
  onDone: () => void;
  onCancel: () => void;
}

function SessionForm({ batchId, editing, onDone, onCancel }: SessionFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<SessionFormValues>({
    defaultValues: {
      title: editing?.title ?? "",
      description: editing?.description ?? "",
      starts_at: toDateTimeLocal(editing?.starts_at),
      ends_at: toDateTimeLocal(editing?.ends_at),
      location_type: editing?.location_type ?? "office",
      location_detail: editing?.location_detail ?? "",
    },
  });

  const onSubmit = async (values: SessionFormValues) => {
    if (values.ends_at && values.starts_at && values.ends_at <= values.starts_at) {
      setError("Giờ kết thúc phải sau giờ bắt đầu.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const payload = {
        title: values.title,
        description: values.description || null,
        starts_at: fromDateTimeLocal(values.starts_at),
        ends_at: fromDateTimeLocal(values.ends_at),
        location_type: values.location_type,
        location_detail: values.location_detail || null,
      };
      if (editing) {
        await adminUpdateSession(editing.id, payload);
      } else {
        await adminCreateSession({ ...payload, batch_id: batchId });
      }
      onDone();
    } catch (err: any) {
      setError(err.message || "Lỗi khi lưu buổi học.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const selectCls = "w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-muted/30 border rounded-xl p-5">
      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Tên buổi học *</label>
        <input {...register("title", { required: "Bắt buộc" })} className={inputCls} placeholder="Buổi 1 – Giới thiệu..." />
        {errors.title && <p className="text-destructive text-xs">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Mô tả ngắn</label>
        <input {...register("description")} className={inputCls} placeholder="Nội dung chính của buổi học..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Bắt đầu *</label>
          <input type="datetime-local" {...register("starts_at", { required: "Bắt buộc" })} className={inputCls} />
          {errors.starts_at && <p className="text-destructive text-xs">{errors.starts_at.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Kết thúc</label>
          <input type="datetime-local" {...register("ends_at")} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Hình thức</label>
          <select {...register("location_type")} className={selectCls}>
            <option value="office">Văn phòng</option>
            <option value="zoom">Zoom Online</option>
            <option value="hybrid">Hybrid</option>
            <option value="external_seminar">Seminar ngoài</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Chi tiết địa điểm</label>
          <input {...register("location_detail")} className={inputCls} placeholder="Link Zoom / Địa chỉ văn phòng..." />
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Huỷ</Button>
        <Button type="submit" size="sm" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          {editing ? "Lưu thay đổi" : "Thêm buổi học"}
        </Button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sessions Section
// ─────────────────────────────────────────────────────────────────────────────
function SessionsSection({ batchId }: { batchId: string }) {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState<AdminSession | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminGetBatchSessions(batchId);
      setSessions(data);
    } catch (err: any) {
      setError(err.message || "Không tải được danh sách buổi học.");
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Xoá buổi học này?")) return;
    try {
      setDeleting(id);
      await adminDeleteSession(id);
      await load();
    } catch (err: any) {
      alert(err.message || "Lỗi khi xoá.");
    } finally {
      setDeleting(null);
    }
  };

  const handleDone = () => {
    setShowForm(false);
    setEditingSession(null);
    load();
  };

  return (
    <div className="bg-card border rounded-lg p-6 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Sessions / Lịch học</h2>
          <p className="text-sm text-muted-foreground mt-1">Quản lý các buổi học trong batch này.</p>
        </div>
        {!showForm && !editingSession && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" /> Thêm buổi học
          </Button>
        )}
      </div>

      {(showForm && !editingSession) && (
        <div className="mb-6">
          <SessionForm
            batchId={batchId}
            editing={null}
            onDone={handleDone}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && error && (
        <p className="text-destructive text-sm">{error}</p>
      )}

      {!loading && !error && sessions.length === 0 && !showForm && (
        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
          Chưa có buổi học nào. Nhấn "Thêm buổi học" để tạo.
        </div>
      )}

      {!loading && sessions.length > 0 && (
        <div className="space-y-3">
          {sessions.map((session, idx) => (
            <div key={session.id}>
              {editingSession?.id === session.id ? (
                <SessionForm
                  batchId={batchId}
                  editing={session}
                  onDone={handleDone}
                  onCancel={() => setEditingSession(null)}
                />
              ) : (
                <div className="flex items-start justify-between gap-4 p-4 border rounded-xl hover:bg-muted/20 transition-colors">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">{idx + 1}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground truncate">{session.title}</div>
                      {session.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{session.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {session.starts_at && (
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {format(parseISO(session.starts_at), "EEE dd/MM/yyyy, HH:mm", { locale: vi })}
                            {session.ends_at && ` – ${format(parseISO(session.ends_at), "HH:mm")}`}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          {formatIcon(session.location_type)}
                          <span className="capitalize">{session.location_type?.replace("_", " ")}</span>
                          {session.location_detail && ` · ${session.location_detail}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setEditingSession(session); setShowForm(false); }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={deleting === session.id}
                      onClick={() => handleDelete(session.id)}
                    >
                      {deleting === session.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Edit Page
// ─────────────────────────────────────────────────────────────────────────────
function AdminBatchesEditPage() {
  const navigate = useNavigate();
  const { batchId } = Route.useParams();

  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      course_id: "",
      title: "",
      slug: "",
      training_format: "office",
      max_participants: "",
      registration_status: "DRAFT",
      start_date: "",
      end_date: "",
      description: ""
    }
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [coursesData, batchesData] = await Promise.all([
          academyAdminCoursesApi.listCourses(),
          adminGetCourseBatches()
        ]);
        setCourses(coursesData);
        const batch = batchesData.find((b: any) => b.id === batchId);
        if (batch) {
          reset({
            course_id: batch.course_id ?? "",
            title: batch.title ?? "",
            slug: batch.slug ?? "",
            training_format: batch.training_format ?? "office",
            max_participants: batch.max_participants ? String(batch.max_participants) : "",
            registration_status: normalizeBatchStatus(batch.registration_status ?? batch.status),
            start_date: toDateInputValue(batch.registration_opens_at ?? batch.start_date),
            end_date: toDateInputValue(batch.registration_closes_at ?? batch.end_date),
            description: batch.description ?? ""
          });
        } else {
          setError("Batch not found.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [batchId, reset]);

  const onSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      setError(null);
      const payload = {
        ...values,
        slug: values.slug ? values.slug.trim().toLowerCase() : "",
        max_participants: values.max_participants ? parseInt(values.max_participants) : null,
        start_date: values.start_date || null,
        end_date: values.end_date || null
      };
      await adminUpdateCourseBatch(batchId, payload);
      navigate({ to: "/admin/batches" });
    } catch (err: any) {
      setError(err.message || "Failed to update batch");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const inputCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
  const selectCls = "w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <Button variant="ghost" asChild className="mb-4 -ml-4">
            <Link to="/admin/batches">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Batches
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Edit Batch</h1>
          <p className="text-muted-foreground mt-2">Update batch details and status.</p>
        </div>
        <Link
          to="/admin/batches/$batchId/registrations"
          params={{ batchId }}
          className="mt-8 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
        >
          <Users className="mr-2 h-4 w-4" /> View Registrations
        </Link>
      </div>

      {/* Batch Form */}
      <div className="bg-card border rounded-lg p-6">
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Course</label>
            <select {...register("course_id", { required: "Course is required" })} className={selectCls}>
              <option value="">Select a course...</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            {errors.course_id && <p className="text-destructive text-sm">{errors.course_id.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Batch Title</label>
              <input
                {...register("title", {
                  required: "Title is required",
                  onChange: (e) => setValue("slug", generateSlug(e.target.value), { shouldValidate: true })
                })}
                className={inputCls}
              />
              {errors.title && <p className="text-destructive text-sm">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Slug</label>
              <input
                {...register("slug", {
                  required: "Slug is required",
                  pattern: { value: /^[a-z0-9-]+$/, message: "Chỉ cho phép a-z, 0-9, dấu gạch ngang" }
                })}
                className={inputCls}
              />
              {errors.slug && <p className="text-destructive text-sm">{errors.slug.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <select {...register("training_format")} className={selectCls}>
                <option value="office">Office</option>
                <option value="zoom">Zoom</option>
                <option value="hybrid">Hybrid</option>
                <option value="external_seminar">External Seminar</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Registration Status</label>
              <select {...register("registration_status")} className={selectCls}>
                <option value="DRAFT">Draft</option>
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Participants</label>
              <input type="number" {...register("max_participants")} className={inputCls} placeholder="Unlimited" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <input type="date" {...register("start_date")} className={inputCls} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <input type="date" {...register("end_date")} className={inputCls} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea {...register("description")} className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="button" variant="outline" className="mr-4" onClick={() => navigate({ to: "/admin/batches" })}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Sessions Section */}
      <SessionsSection batchId={batchId} />
    </div>
  );
}
