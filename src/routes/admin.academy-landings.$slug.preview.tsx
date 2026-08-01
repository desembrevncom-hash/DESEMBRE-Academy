import { createFileRoute } from "@tanstack/react-router";
import { DynamicAcademyLandingPage } from "@/features/public-training/pages/DynamicAcademyLandingPage";

export const Route = createFileRoute("/admin/academy-landings/$slug/preview")({
  component: AdminLandingPreviewRoute,
});

function AdminLandingPreviewRoute() {
  const { slug } = Route.useParams();
  return <DynamicAcademyLandingPage slug={slug} isForceAdminPreview={true} />;
}
