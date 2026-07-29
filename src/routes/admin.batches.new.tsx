import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { adminCreateCourseBatch } from "@/features/admin/services/academyAdminBatchesApi";
import { academyAdminCoursesApi } from "@/features/admin/services/academyAdminCoursesApi";
import { getAdminInstructors, type Instructor } from "@/features/admin/services/academyAdminInstructorsApi";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/batches/new")({
  component: AdminBatchesNewPage,
});

function fromDateTimeLocal(val: string) {
  if (!val) return null;
  return new Date(val).toISOString();
}

function AdminBatchesNewPage() {
  const getInitialCourseId = () => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.get("course_id") || "";
    }
    return "";
  };
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      course_id: getInitialCourseId(),
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
        const [coursesData, instructorsData] = await Promise.all([
          academyAdminCoursesApi.listCourses(),
          getAdminInstructors().catch(() => []),
        ]);
        
        const filteredCourses = coursesData.filter((c: any) => {
          const searchStr = ((c.title || "") + " " + (c.slug || "")).toLowerCase();
          return !searchStr.includes("smoke") && 
                 !searchStr.includes("test") && 
                 !searchStr.includes("demo") && 
                 !searchStr.includes("cancel");
        });
        
        setCourses(filteredCourses);
        setInstructors(instructorsData || []);
      } catch (err) {
        console.error("Failed to load options", err);
      } finally {
        setLoadingCourses(false);
      }
    }
    loadData();
  }, []);

  const onSubmit = async (values: any) => {
    try {
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

      await adminCreateCourseBatch(payload);
      navigate({ to: "/admin/batches" });
    } catch (err: any) {
      setError(err.message || "Không thể tạo lớp học. Vui lòng kiểm tra lại thông tin.");
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4 -ml-4">
          <Link to="/admin/batches">
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách lớp
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Tạo lớp đào tạo mới</h1>
        <p className="text-muted-foreground mt-2">Cấu hình lớp khai giảng và mở đăng ký cho học viên.</p>
      </div>

      <div className="bg-card border rounded-lg p-6">
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Khóa học</label>
            <select 
              {...register("course_id", { required: "Vui lòng chọn khóa học" })}
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loadingCourses}
            >
              <option value="">-- Chọn khóa học --</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            {errors.course_id && <p className="text-destructive text-sm">{errors.course_id.message}</p>}
            
            {courses.length === 0 && !loadingCourses && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm flex flex-col gap-2">
                <p>Chưa có khóa học phù hợp để tạo lớp. Vui lòng tạo khóa học trước.</p>
                <Button asChild variant="outline" size="sm" className="w-fit bg-white">
                  <Link to="/admin/courses/new">Tạo khóa học mới</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tên lớp</label>
              <input 
                {...register("title", { 
                  required: "Tên lớp không được để trống",
                  onChange: (e) => {
                    const val = e.target.value;
                    const generatedSlug = val
                      .toLowerCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .replace(/[^a-z0-9\s-]/g, '')
                      .trim()
                      .replace(/\s+/g, '-');
                    setValue("slug", generatedSlug, { shouldValidate: true });
                  }
                })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="e.g. Khóa T8/2024 - Office"
              />
              {errors.title && <p className="text-destructive text-sm">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Slug (URL)</label>
              <input 
                {...register("slug", { 
                  required: "Slug không được để trống",
                  pattern: {
                    value: /^[a-z0-9-]+$/,
                    message: "Slug chỉ cho phép chữ thường (a-z), số (0-9) và dấu gạch ngang (-)"
                  }
                })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="e.g. khoa-t8-2024"
              />
              {errors.slug && <p className="text-destructive text-sm">{errors.slug.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Giảng viên phụ trách</label>
            <select 
              {...register("instructor_id")}
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
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
              <select 
                {...register("training_format")}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="office">Văn phòng (Offline)</option>
                <option value="zoom">Zoom Online</option>
                <option value="hybrid">Hybrid</option>
                <option value="external_seminar">Seminar ngoài</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Trạng thái đăng ký</label>
              <select 
                {...register("registration_status")}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="open">Đang mở đăng ký</option>
                <option value="draft">Bản nháp</option>
                <option value="closed">Đã đóng</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Số ghế tối đa</label>
              <input 
                type="number"
                {...register("max_participants")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Không giới hạn"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ngày khai giảng</label>
              <input 
                type="date"
                {...register("start_date")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ngày kết thúc</label>
              <input 
                type="date"
                {...register("end_date")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Hạn chót đăng ký</label>
              <input 
                type="datetime-local"
                {...register("registration_closes_at")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Mô tả lớp học</label>
            <textarea 
              {...register("description")}
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Chi tiết địa điểm, ghi chú đặc biệt cho lớp này..."
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="button" variant="outline" className="mr-4" onClick={() => navigate({ to: "/admin/batches" })}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tạo lớp đào tạo mới
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
