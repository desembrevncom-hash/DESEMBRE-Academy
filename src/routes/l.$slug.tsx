import { createFileRoute } from "@tanstack/react-router";
import { DynamicAcademyLandingPage } from "@/features/public-training/pages/DynamicAcademyLandingPage";
import { SITE_URL, DEFAULT_OG_IMAGE } from "@/config/site";

export const Route = createFileRoute("/l/$slug")({
  head: ({ params }) => {
    const slug = params.slug;
    const isSynergistic = slug === "synergistic-protocol";
    const canonicalUrl = isSynergistic
      ? `${SITE_URL}/synergistic-protocol`
      : `${SITE_URL}/l/${slug}`;

    const title = isSynergistic
      ? "SYNERGISTIC PROTOCOL | Khóa đào tạo protocol chuyên sâu | DESEMBRE Training Center"
      : `Landing Page ${slug} | DESEMBRE Training Center`;

    const description = isSynergistic
      ? "Đăng ký khóa SYNERGISTIC PROTOCOL cùng DESEMBRE Training Center. Chương trình giúp chuẩn hóa tư duy phối hợp hoạt chất, xây dựng protocol và ứng dụng thực tế trong spa/clinic."
      : "Chương trình đào tạo chuyên sâu dành cho khách hàng, đối tác và đội ngũ DESEMBRE Training Center.";

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: DEFAULT_OG_IMAGE },
        { property: "og:url", content: canonicalUrl },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: DEFAULT_OG_IMAGE },
      ],
      links: [
        { rel: "canonical", href: canonicalUrl },
      ],
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { slug } = Route.useParams();
  const canonicalPath = slug === "synergistic-protocol" ? "/synergistic-protocol" : `/l/${slug}`;
  return <DynamicAcademyLandingPage slug={slug} canonicalPath={canonicalPath} />;
}
