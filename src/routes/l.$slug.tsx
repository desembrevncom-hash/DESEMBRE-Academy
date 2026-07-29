import { createFileRoute } from "@tanstack/react-router";
import { DynamicAcademyLandingPage } from "@/features/public-training/pages/DynamicAcademyLandingPage";

export const Route = createFileRoute("/l/$slug")({
  component: RouteComponent,
});

function RouteComponent() {
  const { slug } = Route.useParams();
  return <DynamicAcademyLandingPage slug={slug} canonicalPath={`/l/${slug}`} />;
}
