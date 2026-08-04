import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Download, FileText, Sparkles, CheckCircle2, ShieldCheck, Loader2, ArrowRight, X, ExternalLink, BookOpen, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { normalizeVietnamPhone } from "@/lib/phoneNormalization";
import { submitResourceLead } from "@/features/public-training/services/resourceLeadApi";
import { SITE_URL, DEFAULT_OG_IMAGE } from "@/config/site";

export const Route = createFileRoute("/tai-lieu")({
  head: () => ({
    meta: [
      { title: "Tài Liệu Đào Tạo Miễn Phí | DESEMBRE Training Center" },
      { name: "description", content: "Tải cẩm nang, protocol peel da 3 pha, và hướng dẫn phối hợp hoạt chất chuẩn Y Khoa dành cho Spa/Clinic từ DESEMBRE Training Center." },
      { property: "og:title", content: "Tài Liệu Đào Tạo Miễn Phí | DESEMBRE Training Center" },
      { property: "og:description", content: "Tải cẩm nang, protocol peel da 3 pha, và hướng dẫn phối hợp hoạt chất chuẩn Y Khoa miễn phí." },
      { property: "og:image", content: DEFAULT_OG_IMAGE },
      { property: "og:url", content: `${SITE_URL}/tai-lieu` },
    ],
    links: [
      { rel: "canonical", href: `${SITE_URL}/tai-lieu` },
    ],
  }),
  component: FreeResourcesPage,
});

interface ResourceItem {
  id: string;
  slug: string;
  badge: string;
  title: string;
  description: string;
  pages: number;
  format: string;
  highlights: string[];
}

const RESOURCES: ResourceItem[] = [
  {
    id: "res-1",
    slug: "protocol-peel-da-3-pha",
    badge: "Hot Protocol",
    title: "Sổ Tay Protocol Peel Da Sinh Học 3 Pha Chuẩn Y Khoa",
    description: "Bộ tài liệu hướng dẫn từng bước quy trình Peel da 3 pha không bong tróc, tối ưu hóa tái tạo tế bào và an toàn tuyệt đối cho mọi nền da nhạy cảm.",
    pages: 28,
    format: "PDF Chuẩn Y Khoa",
    highlights: [
      "Chi tiết cơ chế hoạt động 3 pha sinh học",
      "Bảng đối chiếu nồng độ hoạt chất Acid & Peptide",
      "Quy trình xử lý biến chứng & phục hồi khẩn cấp",
    ],
  },
  {
    id: "res-2",
    slug: "targeted-modulation-guide",
    badge: "Tài Liệu Kỹ Thuật",
    title: "Cẩm Nang Hoạt Chất Phối Hợp & Targeted Modulation",
    description: "Nguyên lý phối hợp hoạt chất tầng sâu, điều hòa phản ứng viêm và kích hoạt khả năng tự phục hồi của da trong liệu trình Spa/Clinic.",
    pages: 24,
    format: "PDF Chuyên Môn",
    highlights: [
      "Ma trận tương thích giữa Retinoids, Niacinamide & BHA",
      "Sơ đồ thâm nhập tầng bì theo kích thước phân tử",
      "Kế hoạch kê đơn skincare tại nhà cho khách hàng",
    ],
  },
  {
    id: "res-3",
    slug: "biological-trigger-manual",
    badge: "Hướng Dẫn Thực Hành",
    title: "Hướng Dẫn Kích Hoạt Sinh Học Trong Liệu Trình Spa/Clinic",
    description: "Phương pháp ứng dụng tín hiệu tế bào (Biological Trigger) để tăng hiệu quả điều trị mụn, thâm sạm và lão hóa gấp 3 lần.",
    pages: 20,
    format: "PDF Hướng Dẫn",
    highlights: [
      "Quy trình đánh giá nền da trước trị liệu",
      "Kỹ thuật đưa dưỡng chất không xâm lấn",
      "Bộ biểu mẫu tư vấn & theo dõi liệu trình",
    ],
  },
  {
    id: "res-4",
    slug: "premium-glass-skin-program",
    badge: "Chuyên Đề Cao Cấp",
    title: "Quy Trình Phục Hồi & Glass Skin Chuyên Sâu",
    description: "Quy chuẩn liệu trình căng bóng Glass Skin công nghệ Hàn Quốc kết hợp phục hồi hàng rào bảo vệ da (Skin Barrier) chuyên sâu.",
    pages: 32,
    format: "PDF Cẩm Nang",
    highlights: [
      "Công thức phối hợp HA phân tử đa tầng & Ceramide",
      "Kỹ thuật massage kích hoạt hệ bạch huyết",
      "Chiến lược tăng doanh thu liệu trình Glass Skin",
    ],
  },
];

const schema = z.object({
  fullName: z.string().min(2, "Vui lòng nhập họ và tên của bạn."),
  phone: z.string().refine((val) => normalizeVietnamPhone(val) !== null, {
    message: "Vui lòng nhập số điện thoại Zalo hợp lệ.",
  }),
  email: z.string().email("Email không hợp lệ.").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

function FreeResourcesPage() {
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState<{
    downloadUrl: string;
    resourceTitle: string;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
    },
  });

  const handleDownloadClick = (res: ResourceItem) => {
    setSelectedResource(res);
    setSuccessResult(null);
    setFormError(null);
    form.reset();
  };

  const onSubmit = async (values: FormValues) => {
    if (!selectedResource) return;

    try {
      setLoading(true);
      setFormError(null);

      const result = await submitResourceLead({
        fullName: values.fullName,
        phone: values.phone,
        email: values.email || undefined,
        resourceSlug: selectedResource.slug,
        resourceTitle: selectedResource.title,
      });

      setSuccessResult({
        downloadUrl: result.downloadUrl || "#",
        resourceTitle: selectedResource.title,
      });
    } catch (err: any) {
      setFormError(err.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader />

      {/* Hero Banner */}
      <section className="bg-slate-900 text-white py-12 sm:py-16 border-b border-slate-800">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Tài Liệu Chuyên Ngành Miễn Phí
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            Thư Viện Protocol & Cẩm Nang Y Khoa
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Tổng hợp tài liệu đào tạo, quy trình chuẩn hóa và hướng dẫn phối hợp hoạt chất dành cho Chủ Spa, KTV & Chuyên gia Thẩm mỹ.
          </p>
        </div>
      </section>

      {/* Resource Grid */}
      <section className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {RESOURCES.map((res) => (
            <div
              key={res.id}
              className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5 group"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold">
                    {res.badge}
                  </span>
                  <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    {res.format} ({res.pages} trang)
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                  {res.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {res.description}
                </p>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Nội dung nổi bật:
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {res.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={() => handleDownloadClick(res)}
                  className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 gap-2 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải tài liệu ngay (Miễn phí)</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Lead Capture Modal Drawer */}
      {selectedResource && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative space-y-5 animate-scaleUp">
            
            <button
              onClick={() => setSelectedResource(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {successResult ? (
              /* Success Download State */
              <div className="text-center space-y-5 py-2">
                <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl font-extrabold text-slate-900">Đăng ký thành công!</h3>
                  <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                    Tài liệu <span className="font-bold text-slate-900">{successResult.resourceTitle}</span> đã sẵn sàng tải về.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-3">
                  <p className="leading-relaxed">
                    Hệ thống cũng đã ghi nhận số điện thoại của bạn. Chuyên viên DESEMBRE sẽ hỗ trợ giải đáp thắc mắc chuyên môn qua Zalo khi cần.
                  </p>
                  <Button
                    asChild
                    className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 gap-2"
                  >
                    <a href={successResult.downloadUrl} target="_blank" rel="noreferrer">
                      <Download className="w-4 h-4" />
                      <span>Tải file PDF ngay</span>
                    </a>
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => setSelectedResource(null)}
                  className="text-xs text-slate-500 hover:text-slate-900 font-semibold"
                >
                  Đóng cửa sổ
                </Button>
              </div>
            ) : (
              /* Lead Capture Form */
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                    Xác nhận tải tài liệu
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-snug">
                    {selectedResource.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Vui lòng điền thông tin bên dưới để nhận liên kết tải trực tiếp file {selectedResource.format}.
                  </p>
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    {formError}
                  </div>
                )}

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Họ và tên <span className="text-rose-600">*</span>
                    </label>
                    <Input
                      placeholder="VD: Nguyễn Văn A"
                      className="h-11 rounded-xl text-sm font-medium border-slate-200"
                      {...form.register("fullName")}
                    />
                    {form.formState.errors.fullName && (
                      <p className="mt-1 text-xs text-rose-600">{form.formState.errors.fullName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Số điện thoại Zalo <span className="text-rose-600">*</span>
                    </label>
                    <Input
                      type="tel"
                      placeholder="VD: 0912345678"
                      className="h-11 rounded-xl text-sm font-medium border-slate-200"
                      {...form.register("phone")}
                    />
                    {form.formState.errors.phone && (
                      <p className="mt-1 text-xs text-rose-600">{form.formState.errors.phone.message}</p>
                    )}
                    <p className="mt-1 text-[11px] text-slate-400">
                      Zalo để nhận thêm bản cập nhật protocol mới khi có chỉnh sửa.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Email (Tùy chọn)
                    </label>
                    <Input
                      type="email"
                      placeholder="VD: spa.example@gmail.com"
                      className="h-11 rounded-xl text-sm font-medium border-slate-200"
                      {...form.register("email")}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 gap-2 transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Xác nhận & Tải file PDF</span>
                      </>
                    )}
                  </Button>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 justify-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Không yêu cầu đăng nhập. Bảo mật thông tin tuyệt đối.</span>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
