import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { adminCreateCourseBatch } from "@/features/admin/services/academyAdminBatchesApi";
import { academyAdminCoursesApi } from "@/features/admin/services/academyAdminCoursesApi";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/batches/new")({
  component: AdminBatchesNewPage,
});

function AdminBatchesNewPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
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
    async function loadCourses() {
      try {
        const data = await academyAdminCoursesApi.listCourses();
        setCourses(data);
      } catch (err) {
        console.error("Failed to load courses", err);
      } finally {
        setLoadingCourses(false);
      }
    }
    loadCourses();
  }, []);

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

      await adminCreateCourseBatch(payload);
      navigate({ to: "/admin/batches" });
    } catch (err: any) {
      setError(err.message || "Failed to create batch");
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4 -ml-4">
          <Link to="/admin/batches">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Batches
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create New Batch</h1>
        <p className="text-muted-foreground mt-2">Set up a new monthly funnel course batch.</p>
      </div>

      <div className="bg-card border rounded-lg p-6">
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Course</label>
            <select 
              {...register("course_id", { required: "Course is required" })}
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loadingCourses}
            >
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
              <label className="text-sm font-medium">Slug</label>
              <input 
                {...register("slug", { 
                  required: "Slug is required",
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <select 
                {...register("training_format")}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="office">Office</option>
                <option value="zoom">Zoom</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Registration Status</label>
              <select 
                {...register("registration_status")}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="DRAFT">Draft</option>
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Max Participants</label>
              <input 
                type="number"
                {...register("max_participants")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <input 
                type="date"
                {...register("start_date")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <input 
                type="date"
                {...register("end_date")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea 
              {...register("description")}
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Batch specific details or location info..."
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="button" variant="outline" className="mr-4" onClick={() => navigate({ to: "/admin/batches" })}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Batch
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
