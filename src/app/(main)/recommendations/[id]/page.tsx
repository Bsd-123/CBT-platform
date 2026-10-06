import { notFound, redirect } from "next/navigation";
import { fetchRecommendationById } from "@/lib/data";

type RecommendationDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RecommendationDetailPage({ params }: RecommendationDetailPageProps) {
  const { id } = await params;
  const recommendation = await fetchRecommendationById(id);
  if (!recommendation) notFound();
  redirect(`/recommendations#rec-${id}`);
}
