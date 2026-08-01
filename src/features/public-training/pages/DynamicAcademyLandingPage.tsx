import { useEffect, useState, useCallback } from "react";
import {
  getPublicTrainingSchedule,
  PublicCourseBatch,
} from "@/features/public-training/services/publicTrainingApi";
import {
  getLandingPageBySlug,
  AcademyLandingPage,
} from "@/features/admin/services/academyAdminLandingPagesApi";
import { CampaignLandingTemplate } from "@/features/public-training/components/landing/CampaignLandingTemplate";
import { isDemoRecord } from "@/features/admin/utils/demoData";

interface DynamicAcademyLandingPageProps {
  slug: string;
  canonicalPath?: string;
}

export function DynamicAcademyLandingPage({ slug }: DynamicAcademyLandingPageProps) {
  const [landing, setLanding] = useState<AcademyLandingPage | null>(null);
  const [batches, setBatches] = useState<PublicCourseBatch[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLandingData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Fetch Landing Page Configuration
      const landingConfig = await getLandingPageBySlug(slug);
      setLanding(landingConfig);

      // 2. Fetch Public Training Schedule & filter matching batch for this slug/course
      const scheduleBatches = await getPublicTrainingSchedule();
      const cleanSchedule = scheduleBatches.filter((b) => !isDemoRecord(b));

      // Match batch by course slug or campaign slug
      const matchedBatches = cleanSchedule.filter((b) => {
        const cSlug = (b.course?.slug || "").toLowerCase().trim();
        const bSlug = (b.slug || "").toLowerCase().trim();
        const targetSlug = slug.toLowerCase().trim();

        return (
          cSlug === targetSlug ||
          bSlug === targetSlug ||
          cSlug.includes(targetSlug) ||
          targetSlug.includes(cSlug)
        );
      });

      setBatches(matchedBatches.length > 0 ? matchedBatches : cleanSchedule);
    } catch (err: any) {
      console.error("loadLandingData error:", err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadLandingData();
  }, [loadLandingData]);

  return (
    <CampaignLandingTemplate
      slug={slug}
      landing={landing}
      batches={batches}
      loading={loading}
      onRefreshSchedule={loadLandingData}
    />
  );
}
