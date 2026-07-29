import { createFileRoute } from "@tanstack/react-router";
import { DynamicAcademyLandingPage } from "@/features/public-training/pages/DynamicAcademyLandingPage";

export const Route = createFileRoute("/synergistic-protocol")({
  head: () => ({
    meta: [
      { title: "SYNERGISTIC PROTOCOL | Khóa đào tạo protocol chuyên sâu | DESEMBRE Academy" },
      { name: "description", content: "Đăng ký khóa SYNERGISTIC PROTOCOL cùng DESEMBRE Academy. Chương trình giúp chuẩn hóa tư duy phối hợp hoạt chất, xây dựng protocol và ứng dụng thực tế trong spa/clinic." },
      { property: "og:title", content: "SYNERGISTIC PROTOCOL | Khóa đào tạo protocol chuyên sâu | DESEMBRE Academy" },
      { property: "og:description", content: "Đăng ký khóa SYNERGISTIC PROTOCOL cùng DESEMBRE Academy. Chương trình giúp chuẩn hóa tư duy phối hợp hoạt chất, xây dựng protocol và ứng dụng thực tế trong spa/clinic." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: SynergisticProtocolRouteComponent,
});

function SynergisticProtocolRouteComponent() {
  return <DynamicAcademyLandingPage slug="synergistic-protocol" canonicalPath="/synergistic-protocol" />;
}
