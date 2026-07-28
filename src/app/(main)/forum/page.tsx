import Link from "next/link";
import { Suspense } from "react";
import { ForumSearchForm } from "@/components/forum/ForumSearchForm";
import { ForumLikeButton } from "@/components/forum/ForumLikeButton";
import { PostForumQuestionForm } from "@/components/forum/PostForumQuestionForm";
import { searchForum } from "@/lib/actions";
import { fetchAuthenticatedProfile } from "@/lib/actions/auth";
import { enrichForumQuestionsWithLikes } from "@/lib/services/forum-likes";

type ForumPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function ForumPage({ searchParams }: ForumPageProps) {
  const { q } = await searchParams;
  const auth = await fetchAuthenticatedProfile();
  const questionsRaw = await searchForum({ query: q });
  const questions = await enrichForumQuestionsWithLikes(questionsRaw, auth?.userId);

  return (
    <div className="stack">
      <section className="card">
        <h1>פורום שאלות ותשובות</h1>
        <p className="muted">חיפוש בתוך מרחב הפורום בלבד.</p>
      </section>

      <section className="card">
        <PostForumQuestionForm />
      </section>

      <section className="card">
        <Suspense fallback={<p className="muted">טוען חיפוש...</p>}>
          <ForumSearchForm />
        </Suspense>
      </section>

      <section className="card stack">
        <h2>
          שאלות ({questions.length})
          {q ? ` — תוצאות עבור "${q}"` : ""}
        </h2>
        {questions.length === 0 ? (
          <p className="muted">לא נמצאו שאלות.</p>
        ) : (
          <ul className="list-plain">
            {questions.map((question) => (
              <li key={question.id}>
                <Link href={`/forum/${question.id}`}>
                  <strong>{question.title}</strong>
                </Link>
                <ForumLikeButton
                  targetType="question"
                  targetId={question.id}
                  initialCount={question.like_count}
                  initialLiked={question.user_liked}
                />
                <p className="muted">{question.content}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
