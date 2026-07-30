import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { adminGetCourseBatches, adminUpdateCourseBatch } from "@/features/admin/services/academyAdminBatchesApi";
import { academyAdminCoursesApi } from "@/features/admin/services/academyAdminCoursesApi";
import { getAdminInstructors, type Instructor } from "@/features/admin/services/academyAdminInstructorsApi";
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
  validateSearch: (search: Record<string, unknown>) => ({
    created: search.created === "true" || search.created === true,
    addSession: search.addSession === "true" || search.addSession === true,
  }),
  component: AdminBatchesEditPage,
});

// ── helpers ──────────────────────────────────────────────────────────────────
function normalizeBatchStatus(value?: string | null) {
  return (value || "draft").toLowerCase().trim();
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
  batchStartDate?: string | null;
  batchFormat?: string | null;
  onDone: () => void;
  onCancel: () => void;
}

function SessionForm({ batchId, editing, batchStartDate, batchFormat, onDone, onCancel }: SessionFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultStartsAt = editing?.starts_at
    ? toDateTimeLocal(editing.starts_at)
    : batchStartDate
      ? `${batchStartDate.slice(0, 10)}T09:00`
      : "";
  const defaultEndsAt = editing?.ends_at
    ? toDateTimeLocal(editing.ends_at)
    : batchStartDate
      ? `${batchStartDate.slice(0, 10)}T12:00`
      : "";
  const defaultLocationType = editing?.location_type ?? (batchFormat || "office");

  const { register, handleSubmit, formState: { errors } } = useForm<SessionFormValues>({
    defaultValues: {
      title: editing?.title ?? "",
      description: editing?.description ?? "",
      starts_at: defaultStartsAt,
      ends_at: defaultEndsAt,
      location_type: defaultLocationType,
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
function SessionsSection({
  batchId,
  batchStartDate,
  batchFormat,
  initialShowForm = false,
  onCountChange,
}: {
  batchId: string;
  batchStartDate?: string | null;
  batchFormat?: string | null;
  initialShowForm?: boolean;
  onCountChange?: (count: number) => void;
}) {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(initialShowForm);
  const [editingSession, setEditingSession] = useState<AdminSession | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminGetBatchSessions(batchId);
      setSessions(data);
      if (onCountChange) onCountChange(data.length);
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
          <h2 className="text-xl font-bold">Lịch học của lớp này</h2>
          <p className="text-sm text-muted-foreground mt-1">Các buổi học sẽ hiển thị trên lịch khai giảng và trang chi tiết khóa học.</p>
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
          <p className="font-semibold text-slate-700">Chưa có buổi học nào. Hãy thêm lịch học để học viên biết thời gian tham gia.</p>
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
  const search = Route.useSearch();
  const isJustCreated = !!(search as any)?.created;
  const isAddSessionParam = !!(search as any)?.addSession;

  const [courses, setCourses] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [batchRegistrations, setBatchRegistrations] = useState<number>(0);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      course_id: "",
      title: "",
      slug: "",
      training_format: "office",
      instructor_id: "",
      max_participants: "",
      registration_status: "open",
      registration_closes_at: "",
      start_date: "",
      end_date: "",
      description: ""
    }
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [coursesData, batchesData, instructorsData] = await Promise.all([
          academyAdminCoursesApi.listCourses(),
          adminGetCourseBatches(),
          getAdminInstructors().catch(() => []),
        ]);
        setCourses(coursesData);
        setInstructors(instructorsData || []);
        const batch = batchesData.find((b: any) => b.id === batchId);
        if (batch) {
          const totalRegs = (batch.confirmed_count || 0) + (batch.pending_count || 0) + (batch.registration_count || 0);
          setBatchRegistrations(totalRegs);
          reset({
            course_id: batch.course_id || batch.course?.id || "",
            title: batch.title ?? "",
            slug: batch.slug ?? "",
            training_format: batch.training_format ?? "office",
            instructor_id: batch.instructor_id ?? "",
            max_participants: batch.max_participants ? String(batch.max_participants) : "",
            registration_status: normalizeBatchStatus(batch.registration_status ?? batch.status),
            registration_closes_at: toDateTimeLocal(batch.registration_closes_at),
            start_date: toDateInputValue(batch.start_date ?? batch.registration_opens_at),
            end_date: toDateInputValue(batch.end_date ?? batch.registration_closes_at),
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
      if ((values.registration_status === "OPEN" || values.registration_status === "open") && sessionCount === 0) {
        if (!window.confirm("Lớp này chưa có buổi học. Khách vẫn có thể đăng ký nhưng lịch học sẽ hiển thị là đang cập nhật. Bạn vẫn muốn mở đăng ký?")) {
          return;
        }
      }

      setSubmitting(true);
      setError(null);
      const payload = {
        ...values,
        slug: values.slug ? values.slug.trim().toLowerCase() : "",
        instructor_id: values.instructor_id || null,
        max_participants: values.max_participants ? parseInt(values.max_participants) : null,
        registration_closes_at: fromDateTimeLocal(values.registration_closes_at),
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
      {isJustCreated && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-800 font-bold text-sm">
              ✓
            </div>
            <div>
              <h3 className="font-bold text-emerald-950 text-sm">Lớp đã được tạo thành công!</h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Hãy thêm buổi học để lớp xuất hiện đầy đủ trên Lịch đào tạo và ứng dụng của học viên.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <Button variant="ghost" asChild className="mb-4 -ml-4">
            <Link to="/admin/batches">
              <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách lớp
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Chỉnh sửa lớp đào tạo</h1>
          <p className="text-muted-foreground mt-2">Cập nhật thông tin khai giảng, giảng viên và trạng thái đăng ký.</p>
        </div>
        <Link
          to="/admin/batches/$batchId/registrations"
          params={{ batchId }}
          className="mt-8 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
        >
          <Users className="mr-2 h-4 w-4" /> Xem đăng ký
        </Link>
      </div>

      {/* Batch Form */}
      <div className="bg-card border rounded-lg p-6">
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Khóa học</label>
            <select
              {...register("course_id", { required: "Vui lòng chọn khóa học" })}
              className={selectCls}
              disabled={batchRegistrations > 0}
            >
              <option value="">Chọn khóa học...</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            {batchRegistrations > 0 && (
              <p className="text-xs text-amber-600 font-medium mt-1">Lớp đã có học viên đăng ký. Không thể đổi khóa học.</p>
            )}
            {errors.course_id && <p className="text-destructive text-sm">{errors.course_id.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tên lớp (Batch Title)</label>
              <input
                {...register("title", {
                  required: "Vui lòng nhập tên lớp",
                  onChange: (e) => setValue("slug", generateSlug(e.target.value), { shouldValidate: true })
                })}
                className={inputCls}
              />
              {errors.title && <p className="text-destructive text-sm">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Đường dẫn (Slug)</label>
              <input
                {...register("slug", {
                  required: "Vui lòng nhập đường dẫn",
                  pattern: { value: /^[a-z0-9-]+$/, message: "Chỉ cho phép a-z, 0-9, dấu gạch ngang" }
                })}
                className={inputCls}
              />
              {errors.slug && <p className="text-destructive text-sm">{errors.slug.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Giảng viên phụ trách</label>
            <select {...register("instructor_id")} className={selectCls}>
              <option value="">-- Chưa gán giảng viên --</option>
              {instructors.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.full_name} {inst.title ? `— ${inst.title}` : ""} {!inst.is_active ? " (Ẩn)" : ""}
                </option>
              ))}
            </select>
            {instructors.length === 0 && (
              <p className="text-xs text-amber-600">
                Chưa có giảng viên. Hãy tạo giảng viên trước trong mục <Link to="/admin/instructors" className="underline font-bold">Giảng viên</Link>.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Hình thức</label>
              <select {...register("training_format")} className={selectCls}>
                <option value="office">Văn phòng (Offline)</option>
                <option value="zoom">Zoom Online</option>
                <option value="hybrid">Hybrid</option>
                <option value="external_seminar">Seminar ngoài</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Trạng thái đăng ký</label>
              <select {...register("registration_status")} className={selectCls}>
                <option value="open">Đang mở đăng ký</option>
                <option value="draft">Bản nháp</option>
                <option value="closed">Đã đóng</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Số ghế tối đa (Max Seats)</label>
              <input type="number" {...register("max_participants")} className={inputCls} placeholder="Không giới hạn" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ngày khai giảng (Start Date)</label>
              <input type="date" {...register("start_date")} className={inputCls} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ngày kết thúc (End Date)</label>
              <input type="date" {...register("end_date")} className={inputCls} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Hạn chót đăng ký</label>
              <input type="datetime-local" {...register("registration_closes_at")} className={inputCls} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Mô tả public (Description)</label>
            <textarea {...register("description")} className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="button" variant="outline" className="mr-4" onClick={() => navigate({ to: "/admin/batches" })}>
              Huỷ
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </div>

      {/* Sessions Section */}
      <SessionsSection
        batchId={batchId}
        batchStartDate={watch("start_date")}
        batchFormat={watch("training_format")}
        initialShowForm={isAddSessionParam || isJustCreated}
        onCountChange={setSessionCount}
      />
    </div>
  );
}
