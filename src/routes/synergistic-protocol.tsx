import { createFileRoute } from "@tanstack/react-router";
import { DynamicAcademyLandingPage } from "@/features/public-training/pages/DynamicAcademyLandingPage";
import { SITE_URL, DEFAULT_OG_IMAGE } from "@/config/site";

export const Route = createFileRoute("/synergistic-protocol")({
  head: () => ({
    meta: [
      { title: "SYNERGISTIC PROTOCOL | Khóa đào tạo protocol chuyên sâu | DESEMBRE Training Center" },
      { name: "description", content: "Đăng ký khóa SYNERGISTIC PROTOCOL cùng DESEMBRE Training Center. Chương trình giúp chuẩn hóa tư duy phối hợp hoạt chất, xây dựng protocol và ứng dụng thực tế trong spa/clinic." },
      { property: "og:title", content: "SYNERGISTIC PROTOCOL | Khóa đào tạo protocol chuyên sâu | DESEMBRE Training Center" },
      { property: "og:description", content: "Đăng ký khóa SYNERGISTIC PROTOCOL cùng DESEMBRE Training Center. Chương trình giúp chuẩn hóa tư duy phối hợp hoạt chất, xây dựng protocol và ứng dụng thực tế trong spa/clinic." },
      { property: "og:image", content: DEFAULT_OG_IMAGE },
      { property: "og:url", content: `${SITE_URL}/synergistic-protocol` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "SYNERGISTIC PROTOCOL | Khóa đào tạo protocol chuyên sâu | DESEMBRE Training Center" },
      { name: "twitter:description", content: "Đăng ký khóa SYNERGISTIC PROTOCOL cùng DESEMBRE Training Center. Chương trình giúp chuẩn hóa tư duy phối hợp hoạt chất, xây dựng protocol và ứng dụng thực tế trong spa/clinic." },
      { name: "twitter:image", content: DEFAULT_OG_IMAGE },
    ],
    links: [
      { rel: "canonical", href: `${SITE_URL}/synergistic-protocol` },
    ],
  }),
  component: SynergisticProtocolRouteComponent,
});

function SynergisticProtocolRouteComponent() {
  return <DynamicAcademyLandingPage slug="synergistic-protocol" canonicalPath="/synergistic-protocol" />;
}
