import { redirect } from "next/navigation";

type RecommendationDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RecommendationDetailPage({ params }: RecommendationDetailPageProps) {
  const { id } = await params;
  redirect(`/recommendations#rec-${id}`);
}
