import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Target,
  Users,
  Award,
  TrendingUp,
  Sparkles,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SectionHeading } from "@/components/common/SectionHeading";
import { instructors } from "@/data/instructors";
import { courses } from "@/data/courses";
import heroImg from "@/assets/hero-instructor.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Về chúng tôi — DESEMBRE Academy" },
      {
        name: "description",
        content:
          "Tìm hiểu về DESEMBRE Academy, đội ngũ giảng viên và giá trị cốt lõi: Học đúng kiến thức. Phát triển đúng hướng.",
      },
      { property: "og:title", content: "Về chúng tôi — DESEMBRE Academy" },
      {
        property: "og:description",
        content: "Tìm hiểu về DESEMBRE Academy, đội ngũ giảng viên và giá trị cốt lõi.",
      },
    ],
  }),
  component: AboutPage,
});

const values = [
  {
    icon: Target,
    title: "Học đúng kiến thức",
    description:
      "Nội dung được biên soạn bởi chuyên gia, sát với thực tiễn và cập nhật liên tục theo xu hướng ngành.",
  },
  {
    icon: TrendingUp,
    title: "Phát triển đúng hướng",
    description:
      "Mỗi khóa học đều hướng đến kết quả cụ thể: năng lực làm việc tốt hơn, doanh số cao hơn, sự nghiệp vững vàng hơn.",
  },
  {
    icon: Users,
    title: "Cộng đồng học tập",
    description:
      "Học viên không đơn độc — chúng tôi xây dựng môi trường chia sẻ, đồng hành và phát triển cùng nhau.",
  },
  {
    icon: Award,
    title: "Chứng nhận uy tín",
    description:
      "Chứng nhận hoàn thành khóa học được công nhận bởi DESEMBRE và các đối tác phân phối trên toàn quốc.",
  },
];

const stats = [
  { value: "10.000+", label: "Học viên" },
  { value: "50+", label: "Khóa học" },
  { value: "4.8", label: "Đánh giá trung bình" },
  { value: "98%", label: "Học viên hài lòng" },
];

function AboutPage() {
  const totalStudents = courses.reduce((sum, c) => sum + c.enrolledCount, 0);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="px-3 sm:px-6 pt-6">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[28px] sm:rounded-[36px] hero-bg border border-border/60 shadow-[var(--shadow-soft)]">
          <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-2 lg:gap-6 lg:p-14">
            <div className="flex flex-col justify-center">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/70 backdrop-blur px-3 py-1 text-xs font-medium text-primary-dark">
                <Sparkles className="h-3.5 w-3.5" /> DESEMBRE Academy
              </span>
              <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight">
                Về chúng tôi
              </h1>
              <p className="mt-5 max-w-lg text-lg font-medium text-primary-dark">
                Học đúng kiến thức. Phát triển đúng hướng.
              </p>
              <p className="mt-3 max-w-lg text-base text-muted-foreground">
                DESEMBRE Academy là nền tảng đào tạo trực tuyến được xây dựng để trang bị kiến thức
                chuyên sâu cho khách hàng, đối tác và đội ngũ DESEMBRE. Chúng tôi tin rằng giáo dục
                đúng cách không chỉ là truyền đạt thông tin — mà là thay đổi hành vi và tạo ra kết
                quả thực.
              </p>
            </div>

            <div className="relative">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-primary/10">
                <img
                  src={heroImg}
                  alt="Đội ngũ DESEMBRE Academy"
                  width={1024}
                  height={768}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent" />
              </div>
              <div className="absolute -left-4 sm:left-6 bottom-6 rounded-2xl glass px-4 py-3 shadow-[var(--shadow-soft)]">
                <div className="text-xs text-muted-foreground">Học viên đã tham gia</div>
                <div className="text-lg font-bold text-primary-dark">
                  {totalStudents.toLocaleString("vi-VN")}+
                </div>
              </div>
              <div className="absolute -right-2 sm:right-6 top-8 rounded-2xl glass px-4 py-3 shadow-[var(--shadow-soft)]">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <PlayCircle className="h-5 w-5 text-primary" /> {courses.length}+ khóa học
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={i}
              className="rounded-3xl border border-border/60 bg-card p-6 text-center shadow-[var(--shadow-soft)]"
            >
              <div className="text-3xl font-extrabold text-primary-dark">{s.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission & Values */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <SectionHeading
          eyebrow="Giá trị cốt lõi"
          title="Những gì chúng tôi cam kết"
          description="DESEMBRE Academy được xây dựng trên 4 trụ cột giá trị — định hướng mọi quyết định từ nội dung đến trải nghiệm học viên."
          center
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => (
            <div
              key={i}
              className="group rounded-3xl border border-border/60 bg-card p-6 shadow-[var(--shadow-soft)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
            >
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary-dark">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Instructors */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <SectionHeading
          eyebrow="Đội ngũ"
          title="Gặp gỡ giảng viên"
          description="Những chuyên gia hàng đầu đứng sau nội dung mỗi khóa học — giàu kinh nghiệm thực chiến và đam mê truyền đạt."
          center
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {instructors.map((ins) => {
            const courseCount = courses.filter((c) => c.instructorId === ins.id).length;
            return (
              <div
                key={ins.id}
                className="rounded-3xl border border-border/60 bg-card p-6 text-center shadow-[var(--shadow-soft)]"
              >
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary/10 text-2xl font-bold text-primary-dark">
                  {ins.name
                    .split(" ")
                    .slice(-2)
                    .map((w) => w[0])
                    .join("")}
                </div>
                <h3 className="mt-4 text-base font-bold">{ins.name}</h3>
                <p className="text-sm text-primary-dark font-medium">{ins.title}</p>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{ins.bio}</p>
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-primary-dark">
                  <BookOpen className="h-3.5 w-3.5" />
                  {courseCount} khóa học
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-[32px] hero-bg border border-border/60 p-10 md:p-14">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Hành trình xây dựng DESEMBRE Academy
              </h2>
              <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  DESEMBRE Academy ra đời từ nhu cầu thực tế: đội ngũ ngày càng lớn, đối tác ngày
                  càng nhiều, và cách đào tạo truyền thống không đủ nhanh để đáp ứng. Chúng tôi cần
                  một nền tảng có thể đào tạo hàng nghìn người cùng lúc — nhưng vẫn đảm bảo chất
                  lượng và sự cá nhân hóa.
                </p>
                <p>
                  Từ những buổi workshop offline đầu tiên, chúng tôi dần chuyển đổi nội dung thành
                  các module học trực tuyến, có thể xem lại, đánh giá và cấp chứng nhận. Mỗi bài học
                  đều được thiết kế dựa trên nguyên tắc: học xong phải làm được ngay.
                </p>
                <p>
                  Hôm nay, DESEMBRE Academy không chỉ phục vụ nội bộ — mà còn mở cửa cho khách hàng
                  và đối tác muốn nâng cao năng lực trong lĩnh vực chăm sóc sắc đẹp, bán hàng và
                  quản trị.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="rounded-3xl overflow-hidden aspect-[3/4] bg-primary/10">
                  <img src={heroImg} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="rounded-3xl bg-primary/10 p-6 flex flex-col justify-center">
                  <div className="text-3xl font-extrabold text-primary-dark">2019</div>
                  <div className="text-sm text-muted-foreground mt-1">Năm thành lập</div>
                </div>
              </div>
              <div className="space-y-4 pt-6">
                <div className="rounded-3xl bg-primary/10 p-6 flex flex-col justify-center">
                  <div className="text-3xl font-extrabold text-primary-dark">25+</div>
                  <div className="text-sm text-muted-foreground mt-1">Tỉnh thành phủ sóng</div>
                </div>
                <div className="rounded-3xl overflow-hidden aspect-[3/4] bg-primary/10">
                  <img src={heroImg} alt="" className="h-full w-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-[32px] hero-bg border border-border/60 p-10 md:p-14 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Sẵn sàng cùng chúng tôi phát triển?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Tham gia cộng đồng học viên DESEMBRE Academy — nơi tri thức được truyền đạt bởi những
            chuyên gia hàng đầu.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-primary hover:bg-primary-dark text-primary-foreground"
            >
              <Link to="/courses">
                Khám phá khóa học <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full bg-white/70">
              <Link to="/auth/phone">Đăng nhập để bắt đầu</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
