import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, parseISO } from "date-fns";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const sessionSchema = z.object({
  course_id: z.string().min(1, "Vui lòng chọn khóa học"),
  batch_id: z.string().min(1, "Vui lòng chọn lớp học (batch)"),
  title: z.string().min(1, "Vui lòng nhập tên buổi học"),
  description: z.string().optional(),
  starts_at_date: z.string().min(1, "Bắt buộc"),
  starts_at_time: z.string().min(1, "Bắt buộc"),
  ends_at_date: z.string().optional(),
  ends_at_time: z.string().optional(),
  location_type: z.string().min(1, "Vui lòng chọn hình thức/địa điểm"),
  location_detail: z.string().optional(),
}).refine(data => {
  if (data.starts_at_date && data.starts_at_time && data.ends_at_date && data.ends_at_time) {
    const start = new Date(`${data.starts_at_date}T${data.starts_at_time}`);
    const end = new Date(`${data.ends_at_date}T${data.ends_at_time}`);
    return end >= start;
  }
  return true;
}, {
  message: "Thời gian kết thúc phải sau thời gian bắt đầu",
  path: ["ends_at_time"],
});

type SessionFormValues = z.infer<typeof sessionSchema>;

interface SessionFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessionToEdit?: any | null;
  courses: any[];
  batches: any[];
  onSubmit: (data: any) => Promise<void>;
}

export function SessionFormDrawer({
  isOpen,
  onClose,
  sessionToEdit,
  courses,
  batches,
  onSubmit
}: SessionFormDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      course_id: "",
      batch_id: "",
      title: "",
      description: "",
      starts_at_date: "",
      starts_at_time: "",
      ends_at_date: "",
      ends_at_time: "",
      location_type: "office",
      location_detail: "",
    },
  });

  const selectedCourseId = form.watch("course_id");
  const filteredBatches = useMemo(() => {
    if (!selectedCourseId) return [];
    return batches.filter(b => b.course_id === selectedCourseId || b.courses?.id === selectedCourseId);
  }, [batches, selectedCourseId]);

  useEffect(() => {
    if (isOpen) {
      if (sessionToEdit) {
        const batch = sessionToEdit.course_batches;
        const courseId = batch?.courses?.id || batch?.course_id || "";
        
        let startDate = "", startTime = "", endDate = "", endTime = "";
        if (sessionToEdit.starts_at) {
          const d = parseISO(sessionToEdit.starts_at);
          startDate = format(d, "yyyy-MM-dd");
          startTime = format(d, "HH:mm");
        }
        if (sessionToEdit.ends_at) {
          const d = parseISO(sessionToEdit.ends_at);
          endDate = format(d, "yyyy-MM-dd");
          endTime = format(d, "HH:mm");
        }

        form.reset({
          course_id: courseId,
          batch_id: sessionToEdit.batch_id || "",
          title: sessionToEdit.title || "",
          description: sessionToEdit.description || "",
          starts_at_date: startDate,
          starts_at_time: startTime,
          ends_at_date: endDate,
          ends_at_time: endTime,
          location_type: sessionToEdit.location_type || "office",
          location_detail: sessionToEdit.location_detail || "",
        });
      } else {
        form.reset({
          course_id: "",
          batch_id: "",
          title: "",
          description: "",
          starts_at_date: format(new Date(), "yyyy-MM-dd"),
          starts_at_time: "08:00",
          ends_at_date: format(new Date(), "yyyy-MM-dd"),
          ends_at_time: "10:00",
          location_type: "office",
          location_detail: "",
        });
      }
    }
  }, [isOpen, sessionToEdit, form]);

  const handleSubmit = async (values: SessionFormValues) => {
    try {
      setIsSubmitting(true);
      
      const payload: any = {
        batch_id: values.batch_id,
        title: values.title,
        description: values.description || null,
        location_type: values.location_type,
        location_detail: values.location_detail || null,
      };

      if (values.starts_at_date && values.starts_at_time) {
        payload.starts_at = new Date(`${values.starts_at_date}T${values.starts_at_time}`).toISOString();
      }
      if (values.ends_at_date && values.ends_at_time) {
        payload.ends_at = new Date(`${values.ends_at_date}T${values.ends_at_time}`).toISOString();
      }

      await onSubmit(payload);
      toast.success(sessionToEdit ? "Đã cập nhật buổi học" : "Đã tạo buổi học mới");
      onClose();
    } catch (error: any) {
      console.error("SessionForm error:", error);
      toast.error(error.message || "Đã xảy ra lỗi khi lưu buổi học");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6 mt-4">
          <SheetTitle>{sessionToEdit ? "Sửa buổi học" : "Thêm buổi học"}</SheetTitle>
          <SheetDescription>
            Điền thông tin buổi học và thời gian bắt đầu/kết thúc.
          </SheetDescription>
        </SheetHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            
            <FormField
              control={form.control}
              name="course_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Khóa học <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={(val) => {
                    field.onChange(val);
                    form.setValue("batch_id", ""); // reset batch when course changes
                  }} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn khóa học" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {courses.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="batch_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lớp học (Batch) <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCourseId || filteredBatches.length === 0}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={!selectedCourseId ? "Chọn khóa học trước" : "Chọn lớp học"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredBatches.map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên buổi học <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Buổi 1: Tổng quan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="starts_at_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày bắt đầu <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="starts_at_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giờ bắt đầu <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ends_at_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày kết thúc</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ends_at_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giờ kết thúc</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hình thức <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn hình thức" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="office">Offline (Tại văn phòng)</SelectItem>
                      <SelectItem value="zoom">Online (Zoom)</SelectItem>
                      <SelectItem value="hybrid">Hybrid (Kết hợp)</SelectItem>
                      <SelectItem value="other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location_detail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chi tiết địa điểm / Link Zoom</FormLabel>
                  <FormControl>
                    <Input placeholder="Tầng 1, số 123... hoặc Link Zoom" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nội dung / Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Chi tiết nội dung buổi học..." className="resize-none" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {sessionToEdit ? "Lưu thay đổi" : "Tạo buổi học"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
