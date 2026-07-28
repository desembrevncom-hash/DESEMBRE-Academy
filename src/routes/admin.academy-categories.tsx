import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  useAcademyAdminCategoryManager, 
  useCreateAcademyCategory, 
  useUpdateAcademyCategory 
} from "@/features/admin/hooks/useAcademyAdminCourses";
import { categoryFormSchema, type CategoryFormData } from "@/features/admin/validators";
import type { AcademyAdminCategoryManagerItem } from "@/features/admin/types";
import { Loader2, Plus, Edit2, Archive, CheckCircle, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/academy-categories")({
  component: AcademyCategoriesAdmin,
});

function AcademyCategoriesAdmin() {
  const { data: categories = [], isLoading, error, refetch } = useAcademyAdminCategoryManager();
  const createMutation = useCreateAcademyCategory();
  const updateMutation = useUpdateAcademyCategory();

  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AcademyAdminCategoryManagerItem | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      status: "draft",
    },
  });

  const filteredCategories = categories.filter((c) => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenForm = (category?: AcademyAdminCategoryManagerItem) => {
    if (category) {
      setEditingCategory(category);
      reset({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        status: category.status,
      });
    } else {
      setEditingCategory(null);
      reset({
        name: "",
        slug: "",
        description: "",
        status: "draft",
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
    reset();
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({
          p_category_id: editingCategory.id,
          p_name: data.name,
          p_slug: data.slug,
          p_description: data.description || null,
          p_status: data.status,
        });
        toast.success("Cập nhật danh mục thành công");
      } else {
        await createMutation.mutateAsync({
          p_name: data.name,
          p_slug: data.slug,
          p_description: data.description || null,
          p_status: data.status,
        });
        toast.success("Thêm danh mục mới thành công");
      }
      handleCloseForm();
    } catch (err: any) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    }
  };

  const handleArchive = async (category: AcademyAdminCategoryManagerItem) => {
    if (category.course_count > 0) {
      const confirm = window.confirm(
        `Danh mục này đang được dùng bởi ${category.course_count} khóa học. Các khóa học sẽ không bị xóa, nhưng danh mục sẽ không còn xuất hiện trong dropdown chọn danh mục published.\n\nBạn có chắc muốn lưu trữ?`
      );
      if (!confirm) return;
    } else {
      const confirm = window.confirm("Bạn có chắc muốn lưu trữ danh mục này?");
      if (!confirm) return;
    }

    try {
      await updateMutation.mutateAsync({
        p_category_id: category.id,
        p_name: category.name,
        p_slug: category.slug,
        p_description: category.description || null,
        p_status: "archived",
      });
      toast.success("Đã lưu trữ danh mục");
    } catch (err: any) {
      toast.error(err.message || "Không thể lưu trữ danh mục");
    }
  };

  const handlePublish = async (category: AcademyAdminCategoryManagerItem) => {
    try {
      await updateMutation.mutateAsync({
        p_category_id: category.id,
        p_name: category.name,
        p_slug: category.slug,
        p_description: category.description || null,
        p_status: "published",
      });
      toast.success("Đã publish danh mục");
    } catch (err: any) {
      toast.error(err.message || "Không thể publish danh mục");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Danh mục khóa học</h1>
          <p className="text-slate-500 mt-1">Quản lý nhóm chủ đề hiển thị trong DESEMBRE Academy.</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm danh mục
        </button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 font-semibold text-lg">
              {editingCategory ? "Sửa danh mục" : "Thêm danh mục mới"}
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="categoryForm" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tên danh mục *</label>
                  <input
                    {...register("name")}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="VD: Chăm sóc da chuyên sâu"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Slug *</label>
                  <input
                    {...register("slug")}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="VD: cham-soc-da"
                  />
                  <p className="text-slate-400 text-xs mt-1">Chỉ dùng chữ thường, số và dấu gạch ngang.</p>
                  {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái *</label>
                  <select
                    {...register("status")}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="draft">Bản nháp (Draft)</option>
                    <option value="published">Xuất bản (Published)</option>
                    <option value="archived">Lưu trữ (Archived)</option>
                  </select>
                  {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                  <textarea
                    {...register("description")}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Mô tả ngắn gọn về danh mục này..."
                  />
                  {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                </div>
              </form>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={handleCloseForm}
                className="px-4 py-2 text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                form="categoryForm"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Lưu danh mục
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4 items-center bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Tên / Slug</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-center">Số khóa học</th>
                <th className="px-6 py-4">Cập nhật</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Đang tải danh mục...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-red-500">
                    Lỗi tải dữ liệu. <button onClick={() => refetch()} className="underline">Thử lại</button>
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Chưa có danh mục nào.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{category.name}</div>
                      <div className="text-xs text-slate-500 mt-1 font-mono">{category.slug}</div>
                      {category.description && (
                        <div className="text-xs text-slate-400 mt-1 truncate max-w-xs">{category.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          category.status === "published"
                            ? "bg-green-100 text-green-800"
                            : category.status === "draft"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {category.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center justify-center bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-medium">
                        {category.course_count}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(category.updated_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenForm(category)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        
                        {category.status === "archived" || category.status === "draft" ? (
                          <button
                            onClick={() => handlePublish(category)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Xuất bản (Publish)"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleArchive(category)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Lưu trữ (Archive)"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
