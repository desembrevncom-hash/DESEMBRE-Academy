import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { getCatalog, getPublicCatalog } from "@/features/courses/services/course.service";
import type { CourseCatalogItem } from "@/features/courses/types";
import { CatalogCourseCard } from "@/features/courses/components/CatalogCourseCard";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Loader2, AlertCircle, BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { isDemoRecord } from "@/features/admin/utils/demoData";

export const Route = createFileRoute("/courses/")({
  head: () => ({
    meta: [
      { title: "Danh sách Khóa học | DESEMBRE Training Center" },
      { name: "description", content: "Khám phá tất cả các khóa đào tạo chuyên sâu về Da liễu, Thẩm mỹ và Quản trị Spa tại DESEMBRE Training Center." },
      { property: "og:title", content: "Danh sách Khóa học | DESEMBRE Training Center" },
      { property: "og:description", content: "Khám phá tất cả các khóa đào tạo chuyên sâu về Da liễu, Thẩm mỹ và Quản trị Spa tại DESEMBRE Training Center." },
      { property: "og:image", content: "https://academy.desembre-vn.com/og/academy-home.jpg" },
      { property: "og:url", content: "https://academy.desembre-vn.com/courses" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Danh sách Khóa học | DESEMBRE Training Center" },
      { name: "twitter:description", content: "Khám phá tất cả các khóa đào tạo chuyên sâu tại DESEMBRE Training Center." },
      { name: "twitter:image", content: "https://academy.desembre-vn.com/og/academy-home.jpg" },
    ],
    links: [
      { rel: "canonical", href: "https://academy.desembre-vn.com/courses" },
    ],
  }),
  component: CoursesIndexPage,
});

function CoursesIndexPage() {
  const { session, initialized: authInitialized } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchCatalog() {
      try {
        setLoading(true);
        setError(null);
        let data;
        if (session) {
          try {
            data = await getCatalog();
          } catch (e: any) {
            if (e === "UNAUTHENTICATED" || e?.message === "UNAUTHENTICATED" || e === "PERMISSION_DENIED") {
              data = await getPublicCatalog();
            } else {
              throw e;
            }
          }
        } else {
          data = await getPublicCatalog();
        }
        if (mounted) {
          const safeData = data || [];
          setCourses(safeData.filter((c: any) => !isDemoRecord(c)));
        }
      } catch (err: any) {
        if (mounted) {
          let errorMessage = "Đã xảy ra lỗi khi tải danh mục khóa học.";
          if (err === "INVALID_DATA" || err?.message === "INVALID_DATA") {
            errorMessage = "Dữ liệu khóa học không hợp lệ. Vui lòng liên hệ quản trị viên.";
          } else if (err === "NETWORK" || err?.message === "NETWORK") {
            errorMessage = "Lỗi kết nối mạng. Vui lòng kiểm tra lại.";
          } else if (err?.message) {
            errorMessage = err.message;
          }
          setError(errorMessage);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchCatalog();

    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const cats = new Map<string, { id: string; name: string }>();
    courses.forEach((c) => {
      if (c.category) {
        cats.set(c.category.id, c.category);
      }
    });
    return Array.from(cats.values());
  }, [courses]);

  const filteredCourses = useMemo(() => {
    let result = courses;
    if (selectedCategory) {
      result = result.filter((c) => c.category?.id === selectedCategory);
    }
    
    // Sort by is_featured (true first) and then featured_order (ascending)
    return [...result].sort((a, b) => {
      const aFeatured = a.marketing?.is_featured ?? false;
      const bFeatured = b.marketing?.is_featured ?? false;
      
      if (aFeatured && !bFeatured) return -1;
      if (!aFeatured && bFeatured) return 1;
      
      if (aFeatured && bFeatured) {
        const aOrder = a.marketing?.featured_order ?? 0;
        const bOrder = b.marketing?.featured_order ?? 0;
        return aOrder - bOrder;
      }
      
      return 0; // Keep original order for non-featured
    });
  }, [courses, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#f4fbfb]">
      <SiteHeader />
      
      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-6 py-12 md:py-20 text-center">
        <p className="mb-4 inline-flex rounded-full bg-cyan-100 px-3 py-1 text-sm font-medium text-cyan-700">
          DESEMBRE Academy
        </p>
        <h1 className="text-3xl md:text-5xl font-bold text-slate-950 tracking-tight">
          Khóa học dành cho đối tác phát triển cùng DESEMBRE
        </h1>
        <p className="mt-4 mx-auto max-w-2xl text-slate-600 md:text-lg">
          Học theo lộ trình thực chiến: bán hàng, chăm sóc khách hàng, sản phẩm, marketing và vận hành đội nhóm.
        </p>
        
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          {!authInitialized ? (
             <Button className="rounded-full h-12 px-8 text-base shadow-sm" disabled>
               <Loader2 className="h-5 w-5 animate-spin" />
             </Button>
          ) : !session ? (
            <Button className="rounded-full h-12 px-8 text-base shadow-sm" onClick={() => navigate({ to: "/auth/phone" })}>
              Khám phá khóa học
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button className="rounded-full h-12 px-8 text-base shadow-sm" asChild>
              <Link to="/student">
                Vào học viện
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>Đang tải danh mục khóa học...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="rounded-full bg-destructive/10 p-4 mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Chưa thể tải dữ liệu</h3>
            <p className="text-muted-foreground mb-6 max-w-md text-center">{error}</p>
            <div className="flex gap-4">
              {!session && (
                <Button onClick={() => navigate({ to: "/auth/phone" })} className="rounded-full">
                  Đăng nhập ngay
                </Button>
              )}
              <Button onClick={() => window.location.reload()} variant="outline" className="rounded-full">
                Thử lại
              </Button>
            </div>
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="rounded-full bg-accent p-4 mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có khóa học nào</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Hiện tại danh mục chưa có khóa học nào được xuất bản. Vui lòng quay lại sau.
            </p>
          </div>
        )}

        {!loading && !error && courses.length > 0 && (
          <>
            {categories.length > 1 && (
              <div className="mb-12">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                      selectedCategory === null
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-white text-slate-600 border border-border/60 hover:bg-slate-50"
                    }`}
                  >
                    Tất cả
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                        selectedCategory === cat.id
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-white text-slate-600 border border-border/60 hover:bg-slate-50"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-2xl font-bold text-slate-950 mb-6">Khóa học nổi bật</h2>
              
              {filteredCourses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-border/60">
                  <p className="text-muted-foreground text-center mb-4">Chưa có khóa học trong danh mục này.</p>
                  <Button variant="outline" className="rounded-full" onClick={() => setSelectedCategory(null)}>
                    Xem tất cả
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map((course) => (
                    <CatalogCourseCard key={course.id} course={course} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
