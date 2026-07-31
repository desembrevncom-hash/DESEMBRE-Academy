import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { getCourseOutline, getPublicCourseOutline } from "@/features/courses/services/course.service";
import type { CourseOutline, CourseCatalogItem } from "@/features/courses/types";
import { applyCourseSeoMeta, buildCourseHeadMeta } from "@/features/courses/utils/seo";
import { fetchCourseMetaForSeo } from "@/features/courses/courseMetaFetcher.server";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Loader2, AlertCircle, ArrowLeft, BookOpen, Clock, PlayCircle, FileText, Lock, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/useAuth";
import { useOptionalCourseRuntime } from "@/features/courses/useCourseRuntime";
import { toast } from "sonner";

import { SITE_URL } from "@/config/site";

export const Route = createFileRoute("/courses/$slug")({
  loader: async ({ params }) => {
    // Fetch course meta server-side cho SSR head tags.
    // Nếu thất bại (course không tìm thấy, lỗi mạng, env thiếu) → trả null, không crash page.
    try {
      return await fetchCourseMetaForSeo({ data: params.slug });
    } catch {
      return null;
    }
  },
  head: ({ loaderData, params }) => ({
    meta: buildCourseHeadMeta(loaderData ?? null),
    links: [
      { rel: "canonical", href: `${SITE_URL}/courses/${params.slug}` },
    ],
  }),
  component: CourseDetailPage,
});

function CourseDetailPage() {
  const { slug } = Route.useParams();
  const { session, initialized: authInitialized } = useAuth();
  const navigate = useNavigate();
  const runtime = useOptionalCourseRuntime();
  const enroll = runtime?.enroll;
  
  const [outline, setOutline] = useState<CourseOutline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchOutline() {
      try {
        setLoading(true);
        setError(null);
        setIsFallback(false);
        let data;
        if (session) {
          try {
            data = await getCourseOutline(slug);
          } catch (e: any) {
            if (e === "UNAUTHENTICATED" || e?.message === "UNAUTHENTICATED" || e === "PERMISSION_DENIED") {
              data = await getPublicCourseOutline(slug);
              setIsFallback(true);
            } else {
              throw e;
            }
          }
        } else {
          data = await getPublicCourseOutline(slug);
          setIsFallback(true);
        }
        
        if (mounted) {
          setOutline(data);
          if (data && data.course) {
            applyCourseSeoMeta(data.course);
          }
        }
      } catch (err: any) {
        if (mounted) {
          let errorMessage = "Đã xảy ra lỗi khi tải thông tin khóa học.";
          if (err === "COURSE_NOT_FOUND") {
            errorMessage = "COURSE_NOT_FOUND";
          } else if (err === "INVALID_DATA" || err?.message === "INVALID_DATA") {
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

    fetchOutline();

    return () => {
      mounted = false;
    };
  }, [slug]);

  const stats = useMemo(() => {
    if (!outline) return null;
    let totalLessons = 0;
    let totalDuration = 0;
    const types = new Set<string>();

    outline.modules.forEach(m => {
      m.lessons.forEach(l => {
        totalLessons++;
        if (l.duration) totalDuration += l.duration;
        if (l.type) types.add(l.type);
      });
    });

    let contentType = "Tổng hợp";
    if (types.size === 1) {
      if (types.has("video")) contentType = "Video";
      if (types.has("article") || types.has("text")) contentType = "Bài viết";
    }

    return { totalLessons, totalDuration, contentType };
  }, [outline]);

  const handleEnroll = async () => {
    if (!session || !enroll) {
      toast.info("Vui lòng đăng nhập để bắt đầu học.");
      navigate({ to: "/auth/phone", search: { redirect: `/courses/${slug}` } as any });
      return;
    }
    try {
      setIsEnrolling(true);
      await enroll(slug);
      toast.success("Đăng ký thành công!");
      // Re-fetch to update access_decision
      const data = await getCourseOutline(slug);
      setOutline(data);
    } catch (err) {
      toast.error("Lỗi đăng ký khóa học.");
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleStartLearning = () => {
    if (!outline) return;
    const flatLessons = outline.modules.flatMap(m => m.lessons);
    const firstAvailable = flatLessons.find(l => !l.is_locked);
    
    if (firstAvailable) {
      navigate({ to: "/student/courses/$slug/lessons/$lessonId", params: { slug, lessonId: firstAvailable.id } });
    } else {
      navigate({ to: "/student/courses" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4fbfb]">
        <SiteHeader />
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p>Đang tải thông tin khóa học...</p>
        </div>
      </div>
    );
  }

  if (error === "COURSE_NOT_FOUND") {
    return (
      <div className="min-h-screen bg-[#f4fbfb]">
        <SiteHeader />
        <div className="mx-auto max-w-4xl px-6 py-20 text-center flex flex-col items-center">
          <div className="rounded-full bg-accent p-6 mb-6">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Không tìm thấy khóa học</h1>
          <p className="text-muted-foreground mb-8">Khóa học bạn đang tìm kiếm không tồn tại hoặc đã bị gỡ xuống.</p>
          <Button asChild className="rounded-full px-8">
            <Link to="/courses">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại danh mục
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f4fbfb]">
        <SiteHeader />
        <div className="mx-auto max-w-4xl px-6 py-20 text-center flex flex-col items-center">
          <div className="rounded-full bg-destructive/10 p-4 mb-6">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Chưa thể tải dữ liệu</h1>
          <p className="text-muted-foreground mb-8">{error}</p>
          <div className="flex gap-4">
            {!session && (
              <Button onClick={() => navigate({ to: "/auth/phone", search: { redirect: `/courses/${slug}` } as any })} className="rounded-full">
                Đăng nhập ngay
              </Button>
            )}
            <Button onClick={() => window.location.reload()} variant="outline" className="rounded-full">
              Thử lại
            </Button>
            <Button asChild variant="ghost" className="rounded-full">
              <Link to="/courses">Quay lại danh mục</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!outline) return null;

  const { course, access_decision } = outline;
  const isBlocked = (access_decision.reason as string) === "ACCESS_BLOCKED" || (access_decision.can_learn === false && (access_decision.reason as string) === "ACCESS_BLOCKED");
  // Some course outlines don't strictly have is_blocked on course object, but reason is ACCESS_BLOCKED
  const canLearn = access_decision.can_learn;
  const canEnroll = access_decision.can_enroll;

  return (
    <div className="min-h-screen bg-[#f4fbfb] pb-20">
      <SiteHeader />
      
      {/* Breadcrumb */}
      <div className="mx-auto max-w-5xl px-6 py-4">
        <nav className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Link to="/courses" className="hover:text-primary transition-colors">Khóa học</Link>
          <span>/</span>
          <span className="text-foreground truncate">{course.title}</span>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="mx-auto max-w-5xl px-6 py-8 md:py-12">
        <div className="grid md:grid-cols-[1fr_320px] gap-8 md:gap-12">
          
          <div>
            {course.category && (
              <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 border-0 rounded-full px-3 py-1">
                {course.category.name}
              </Badge>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-slate-950 leading-tight mb-4">
              {course.title}
            </h1>
            <p className="text-slate-600 md:text-lg mb-8 leading-relaxed">
              {course.marketing?.short_description || course.description || "Chưa có mô tả cho khóa học này."}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {isBlocked ? (
                <Button className="rounded-full h-12 px-8 bg-destructive/10 text-destructive hover:bg-destructive/20 cursor-not-allowed" disabled>
                  <Lock className="mr-2 h-4 w-4" />
                  Đã bị khóa
                </Button>
              ) : canLearn ? (
                <Button className="rounded-full h-12 px-8 shadow-sm" onClick={handleStartLearning}>
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Vào học ngay
                </Button>
              ) : canEnroll ? (
                <Button className="rounded-full h-12 px-8 shadow-sm" onClick={handleEnroll} disabled={isEnrolling}>
                  {isEnrolling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {!authInitialized ? "Đang kiểm tra..." : !session ? "Đăng nhập để đăng ký" : "Đăng ký học"}
                </Button>
              ) : (access_decision.reason as string) === "NO_STUDENT_ACCOUNT" ? (
                <Button className="rounded-full h-12 px-8 shadow-sm" onClick={handleEnroll} disabled={isEnrolling}>
                  {isEnrolling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Đăng nhập để học
                </Button>
              ) : (
                <Button className="rounded-full h-12 px-8 bg-accent text-muted-foreground cursor-not-allowed" disabled>
                  <Lock className="mr-2 h-4 w-4" />
                  {access_decision.required_tier ? `Yêu cầu hạng ${access_decision.required_tier.name}` : "Không thể đăng ký"}
                </Button>
              )}
              
              <Button asChild variant="outline" className="rounded-full h-12 px-8">
                <Link to="/courses">
                  Quay lại danh mục
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Info Card */}
          <div>
            <div className="bg-white rounded-3xl p-6 border border-border/60 shadow-sm sticky top-24 overflow-hidden">
              {course.marketing?.thumbnail_url && (
                <div className="-mx-6 -mt-6 mb-6 aspect-[16/10] overflow-hidden bg-accent">
                  <img src={course.marketing.thumbnail_url} alt={course.marketing.thumbnail_alt || course.title} className="w-full h-full object-cover" />
                </div>
              )}
              <h3 className="font-semibold text-lg mb-4">Thông tin khóa học</h3>
              <ul className="space-y-4">
                {stats && stats.totalLessons > 0 && (
                  <li className="flex items-center text-slate-700">
                    <BookOpen className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span><strong className="font-medium">{stats.totalLessons}</strong> bài học</span>
                  </li>
                )}
                {course.marketing?.level && (
                  <li className="flex items-center text-slate-700">
                    <Star className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span>Cấp độ: <strong className="font-medium">
                      {course.marketing.level === "basic" ? "Cơ bản" : course.marketing.level === "intermediate" ? "Trung cấp" : "Nâng cao"}
                    </strong></span>
                  </li>
                )}
                {course.marketing?.estimated_minutes ? (
                  <li className="flex items-center text-slate-700">
                    <Clock className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span>Thời lượng ước tính <strong className="font-medium">{course.marketing.estimated_minutes} phút</strong></span>
                  </li>
                ) : stats && stats.totalDuration > 0 && (
                  <li className="flex items-center text-slate-700">
                    <Clock className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span>Thời lượng ước tính <strong className="font-medium">{Math.round(stats.totalDuration / 60)} phút</strong></span>
                  </li>
                )}
                {stats && stats.totalLessons > 0 && (
                  <li className="flex items-center text-slate-700">
                    <FileText className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span>Nội dung: <strong className="font-medium">{stats.contentType}</strong></span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Marketing Details Section */}
      {((course.marketing?.audience && course.marketing.audience.length > 0) || 
        (course.marketing?.outcomes && course.marketing.outcomes.length > 0)) && (
        <section className="mx-auto max-w-5xl px-6 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            {course.marketing?.audience && course.marketing.audience.length > 0 && (
              <div className="bg-white rounded-3xl p-6 border border-border/60 shadow-sm">
                <h2 className="text-xl font-bold text-slate-950 mb-4 flex items-center">
                  <Star className="mr-2 h-5 w-5 text-primary" />
                  Khóa học này dành cho ai?
                </h2>
                <ul className="space-y-3">
                  {course.marketing.audience.map((item, i) => (
                    <li key={i} className="flex items-start">
                      <div className="mr-3 mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                      <span className="text-slate-700 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {course.marketing?.outcomes && course.marketing.outcomes.length > 0 && (
              <div className="bg-white rounded-3xl p-6 border border-border/60 shadow-sm">
                <h2 className="text-xl font-bold text-slate-950 mb-4 flex items-center">
                  <Sparkles className="mr-2 h-5 w-5 text-primary" />
                  Bạn sẽ học được gì?
                </h2>
                <ul className="space-y-3">
                  {course.marketing.outcomes.map((item, i) => (
                    <li key={i} className="flex items-start">
                      <div className="mr-3 mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                      <span className="text-slate-700 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Outline Section */}
      {!isFallback && (
        <section className="mx-auto max-w-5xl px-6 py-8">
          <h2 className="text-2xl font-bold text-slate-950 mb-6">Nội dung khóa học</h2>
          
          {outline.modules.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-border/60 text-center">
              <p className="text-muted-foreground">Khóa học này chưa có nội dung bài học.</p>
            </div>
          ) : (
          <div className="space-y-6">
            {outline.modules.map((module, mIndex) => (
              <div key={module.id} className="bg-white rounded-3xl p-6 border border-border/60 shadow-sm">
                <h3 className="font-semibold text-lg mb-4">
                  Phần {mIndex + 1}: {module.title}
                </h3>
                
                <div className="space-y-2">
                  {module.lessons.map((lesson, lIndex) => {
                    const isVideo = lesson.type === "video";
                    return (
                      <div 
                        key={lesson.id} 
                        className={`flex items-center justify-between p-3 rounded-xl transition-colors ${lesson.is_locked ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-accent flex items-center justify-center text-xs font-medium text-muted-foreground">
                            {lIndex + 1}
                          </div>
                          <div className="flex flex-col truncate">
                            <span className={`text-sm font-medium truncate ${lesson.is_locked ? 'text-slate-500' : 'text-slate-900'}`}>
                              {lesson.title}
                            </span>
                            {lesson.is_locked && (
                              <span className="text-[11px] text-muted-foreground flex items-center mt-0.5">
                                <Lock className="h-3 w-3 mr-1" />
                                Bài học bị khóa
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                          {lesson.duration && (
                            <span className="text-xs text-muted-foreground hidden sm:flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {Math.round(lesson.duration / 60)} phút
                            </span>
                          )}
                          {!lesson.is_locked && canLearn && (
                            <Button variant="ghost" size="sm" className="rounded-full h-8 px-3 text-xs" onClick={handleStartLearning}>
                              {isVideo ? "Xem video" : "Đọc bài"}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        </section>
      )}
    </div>
  );
}
