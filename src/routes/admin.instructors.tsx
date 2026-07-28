import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  User,
  Globe,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAdminInstructors,
  createInstructor,
  updateInstructor,
  deleteInstructor,
  type Instructor,
  type InstructorFormData,
} from "@/features/admin/services/academyAdminInstructorsApi";

export const Route = createFileRoute("/admin/instructors")({
  component: AdminInstructorsPage,
});

// ── Zod Schema ──────────────────────────────────────────────────────
const instructorFormSchema = z.object({
  full_name: z.string().min(1, "Họ tên không được để trống"),
  slug: z.string().optional(),
  title: z.string().optional(),
  avatar_url: z.string().url("URL không hợp lệ").or(z.literal("")).optional(),
  expertise_raw: z.string().optional(),
  bio: z.string().optional(),
  highlights_raw: z.string().optional(),
  social_website: z.string().url("URL không hợp lệ").or(z.literal("")).optional(),
  social_facebook: z.string().url("URL không hợp lệ").or(z.literal("")).optional(),
  social_linkedin: z.string().url("URL không hợp lệ").or(z.literal("")).optional(),
  is_active: z.boolean().optional(),
  display_order: z.coerce.number().int().min(0).optional(),
});

type InstructorFormValues = z.infer<typeof instructorFormSchema>;

// ── Slug helper ─────────────────────────────────────────────────────
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ═══════════════════════════════════════════════════════════════════
// Main page
// ═══════════════════════════════════════════════════════════════════
function AdminInstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);

  // ── Fetch ───────────────────────────────────────────────────────
  const fetchInstructors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminInstructors();
      setInstructors(data);
    } catch (err: any) {
      setError(err.message || "Lỗi tải danh sách giảng viên");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstructors();
  }, [fetchInstructors]);

  // ── Filtering ───────────────────────────────────────────────────
  const filtered = instructors.filter((i) => {
    const matchesSearch =
      i.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (i.expertise || []).some((e) =>
        e.toLowerCase().includes(search.toLowerCase())
      ) ||
      (i.title || "").toLowerCase().includes(search.toLowerCase());

    const matchesActive =
      activeFilter === "all"
        ? true
        : activeFilter === "active"
          ? i.is_active
          : !i.is_active;

    return matchesSearch && matchesActive;
  });

  // ── Actions ─────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingInstructor(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (instructor: Instructor) => {
    setEditingInstructor(instructor);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingInstructor(null);
  };

  const handleDelete = async (instructor: Instructor) => {
    const ok = window.confirm(
      `Bạn có chắc muốn xóa giảng viên "${instructor.full_name}"?\n\nThao tác này không thể hoàn tác.`
    );
    if (!ok) return;

    try {
      await deleteInstructor(instructor.id);
      toast.success("Đã xóa giảng viên");
      fetchInstructors();
    } catch (err: any) {
      toast.error(err.message || "Không thể xóa giảng viên");
    }
  };

  const handleToggleActive = async (instructor: Instructor) => {
    try {
      await updateInstructor(instructor.id, {
        is_active: !instructor.is_active,
      });
      toast.success(
        instructor.is_active
          ? "Đã ẩn giảng viên khỏi trang public"
          : "Đã hiển thị giảng viên trên trang public"
      );
      fetchInstructors();
    } catch (err: any) {
      toast.error(err.message || "Lỗi cập nhật trạng thái");
    }
  };

  const handleSaved = () => {
    handleCloseDrawer();
    fetchInstructors();
  };

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold">Giảng viên / Người đào tạo</h1>
          <p className="text-slate-500 mt-1">
            Quản lý hồ sơ chuyên gia, trainer và người phụ trách đào tạo.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm giảng viên
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, chức danh, chuyên môn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg text-sm">
          {(["all", "active", "inactive"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setActiveFilter(v)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeFilter === v
                  ? "bg-white shadow-sm text-slate-900 font-medium"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {v === "all" ? "Tất cả" : v === "active" ? "Hoạt động" : "Ẩn"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Giảng viên</th>
                <th className="px-6 py-4">Chức danh</th>
                <th className="px-6 py-4">Chuyên môn</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-center">Thứ tự</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Đang tải danh sách giảng viên...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-red-500">
                    {error}{" "}
                    <button
                      onClick={fetchInstructors}
                      className="underline ml-1"
                    >
                      Thử lại
                    </button>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <User className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    {search || activeFilter !== "all"
                      ? "Không tìm thấy giảng viên phù hợp."
                      : "Chưa có giảng viên nào. Bấm \"Thêm giảng viên\" để bắt đầu."}
                  </td>
                </tr>
              ) : (
                filtered.map((inst) => (
                  <tr
                    key={inst.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {inst.avatar_url ? (
                          <img
                            src={inst.avatar_url}
                            alt={inst.full_name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                            {inst.full_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-slate-900">
                            {inst.full_name}
                          </div>
                          {inst.slug && (
                            <div className="text-xs text-slate-400 font-mono mt-0.5">
                              /{inst.slug}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {inst.title || (
                        <span className="text-slate-300 italic">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(inst.expertise || []).length > 0 ? (
                          inst.expertise.slice(0, 3).map((e, i) => (
                            <span
                              key={i}
                              className="inline-block bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs"
                            >
                              {e}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-300 italic text-xs">
                            Chưa có
                          </span>
                        )}
                        {(inst.expertise || []).length > 3 && (
                          <span className="text-xs text-slate-400">
                            +{inst.expertise.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          inst.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {inst.is_active ? "Hoạt động" : "Ẩn"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-500">
                      {inst.display_order}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {inst.slug && (
                          <Link
                            to="/giang-vien/$slug"
                            params={{ slug: inst.slug }}
                            target="_blank"
                            className="text-xs font-semibold text-indigo-600 hover:underline mr-1"
                          >
                            Xem public ↗
                          </Link>
                        )}
                        <button
                          onClick={() => handleToggleActive(inst)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            inst.is_active
                              ? "text-amber-600 hover:bg-amber-50"
                              : "text-green-600 hover:bg-green-50"
                          }`}
                          title={inst.is_active ? "Ẩn" : "Hiển thị"}
                        >
                          {inst.is_active ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(inst)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(inst)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {isDrawerOpen && (
        <InstructorDrawer
          instructor={editingInstructor}
          onClose={handleCloseDrawer}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Drawer Component
// ═══════════════════════════════════════════════════════════════════
function InstructorDrawer({
  instructor,
  onClose,
  onSaved,
}: {
  instructor: Instructor | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = Boolean(instructor);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InstructorFormValues>({
    resolver: zodResolver(instructorFormSchema),
    defaultValues: {
      full_name: instructor?.full_name || "",
      slug: instructor?.slug || "",
      title: instructor?.title || "",
      avatar_url: instructor?.avatar_url || "",
      expertise_raw: (instructor?.expertise || []).join(", "),
      bio: instructor?.bio || "",
      highlights_raw: (instructor?.highlights || []).join("\n"),
      social_website: instructor?.social_links?.website || "",
      social_facebook: instructor?.social_links?.facebook || "",
      social_linkedin: instructor?.social_links?.linkedin || "",
      is_active: instructor?.is_active ?? true,
      display_order: instructor?.display_order ?? 0,
    },
  });

  // Auto-generate slug from full_name (only when creating)
  const watchName = watch("full_name");
  useEffect(() => {
    if (!isEditing && watchName) {
      setValue("slug", generateSlug(watchName));
    }
  }, [watchName, isEditing, setValue]);

  const onSubmit = async (data: InstructorFormValues) => {
    const payload: InstructorFormData = {
      full_name: data.full_name,
      slug: data.slug || generateSlug(data.full_name),
      title: data.title || undefined,
      avatar_url: data.avatar_url || undefined,
      expertise: data.expertise_raw
        ? data.expertise_raw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      bio: data.bio || undefined,
      highlights: data.highlights_raw
        ? data.highlights_raw
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      social_links: {
        website: data.social_website || undefined,
        facebook: data.social_facebook || undefined,
        linkedin: data.social_linkedin || undefined,
      },
      is_active: data.is_active ?? true,
      display_order: data.display_order ?? 0,
    };

    try {
      if (isEditing && instructor) {
        await updateInstructor(instructor.id, payload);
        toast.success("Cập nhật giảng viên thành công");
      } else {
        await createInstructor(payload);
        toast.success("Thêm giảng viên thành công");
      }
      onSaved();
    } catch (err: any) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="relative w-full max-w-lg bg-white shadow-xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold">
            {isEditing ? "Sửa giảng viên" : "Thêm giảng viên mới"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <form
            id="instructorForm"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
          >
            {/* full_name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                {...register("full_name")}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="VD: Nguyễn Văn A"
              />
              {errors.full_name && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.full_name.message}
                </p>
              )}
            </div>

            {/* slug */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Slug
              </label>
              <input
                {...register("slug")}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="nguyen-van-a"
              />
              <p className="text-slate-400 text-xs mt-1">
                Tự động tạo từ tên. Có thể chỉnh sửa.
              </p>
            </div>

            {/* title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Chức danh
              </label>
              <input
                {...register("title")}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="VD: Senior Trainer, Chuyên gia da liễu"
              />
            </div>

            {/* avatar_url */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Avatar URL
              </label>
              <input
                {...register("avatar_url")}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="https://example.com/photo.jpg"
              />
              {errors.avatar_url && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.avatar_url.message}
                </p>
              )}
            </div>

            {/* expertise */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Chuyên môn
              </label>
              <input
                {...register("expertise_raw")}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="VD: Skincare, Anti-aging, Laser Treatment"
              />
              <p className="text-slate-400 text-xs mt-1">
                Phân cách bằng dấu phẩy.
              </p>
            </div>

            {/* bio */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tiểu sử
              </label>
              <textarea
                {...register("bio")}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Giới thiệu ngắn về giảng viên..."
              />
            </div>

            {/* highlights */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Điểm nổi bật
              </label>
              <textarea
                {...register("highlights_raw")}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder={"10+ năm kinh nghiệm\nĐào tạo 500+ học viên\nChứng chỉ quốc tế"}
              />
              <p className="text-slate-400 text-xs mt-1">
                Mỗi dòng là một điểm nổi bật.
              </p>
            </div>

            {/* Social Links */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                <Globe className="w-4 h-4 inline-block mr-1 mb-0.5" />
                Liên kết mạng xã hội
              </label>
              <div className="space-y-2">
                <input
                  {...register("social_website")}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Website: https://..."
                />
                {errors.social_website && (
                  <p className="text-red-500 text-xs">{errors.social_website.message}</p>
                )}
                <input
                  {...register("social_facebook")}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Facebook: https://facebook.com/..."
                />
                {errors.social_facebook && (
                  <p className="text-red-500 text-xs">{errors.social_facebook.message}</p>
                )}
                <input
                  {...register("social_linkedin")}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="LinkedIn: https://linkedin.com/in/..."
                />
                {errors.social_linkedin && (
                  <p className="text-red-500 text-xs">{errors.social_linkedin.message}</p>
                )}
              </div>
            </div>

            {/* is_active + display_order row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Trạng thái
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("is_active")}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-600">Hoạt động (hiển thị public)</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Thứ tự hiển thị
                </label>
                <input
                  type="number"
                  {...register("display_order")}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={0}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button
            type="submit"
            form="instructorForm"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditing ? "Cập nhật" : "Thêm giảng viên"}
          </button>
        </div>
      </div>
    </div>
  );
}
