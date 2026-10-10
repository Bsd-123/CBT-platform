import { redirect, notFound } from "next/navigation";
import { isUuid } from "@/lib/utils/ids";

type RecommendationDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RecommendationDetailPage({ params }: RecommendationDetailPageProps) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  redirect(`/recommendations#rec-${id}`);
}
