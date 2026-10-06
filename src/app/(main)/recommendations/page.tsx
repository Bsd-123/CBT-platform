import { fetchRecommendationsFeed } from "@/lib/data";
import { RecommendationsChat } from "@/components/recommendations/RecommendationsChat";
import "@/app/recommendations.css";

export default async function RecommendationsPage() {
  const items = await fetchRecommendationsFeed();

  return <RecommendationsChat items={items} />;
}
