import Link from "next/link";
import { fetchTags } from "@/lib/data";
import { PostRecommendationForm } from "@/components/recommendations/PostRecommendationForm";
import "@/app/recommendations.css";

export default async function NewRecommendationPage() {
  const tags = await fetchTags();

  return (
    <div className="rec-chat-page">
      <Link href="/recommendations" className="rec-chat-back-link">
        <span className="material-symbols-outlined" aria-hidden="true">
          arrow_forward
        </span>
        חזרה להמלצות
      </Link>

      <header className="rec-chat-header">
        <h1>פרסום המלצה</h1>
        <p>שתפו ספר, משחק או סדנה עם הקהילה — ההמלצה תופיע בשרשור השיחה הראשי.</p>
      </header>

      <section className="rec-chat-compose" aria-label="טופס פרסום המלצה">
        <PostRecommendationForm tags={tags} stayOnPage />
      </section>
    </div>
  );
}
