import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchEntityTags, fetchForumQuestionById } from "@/lib/data";
import { fetchAuthenticatedProfile } from "@/lib/actions/auth";
import { ForumAnswerForm } from "@/components/forum/ForumAnswerForm";
import { ForumAnswerThread } from "@/components/forum/ForumAnswerThread";
import { ForumLikeButton } from "@/components/forum/ForumLikeButton";
import { ReportForm } from "@/components/shared/ReportForm";
import { enrichForumQuestionWithLikes } from "@/lib/services/forum-likes";

type ForumQuestionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ForumQuestionPage({ params }: ForumQuestionPageProps) {
  const { id } = await params;
  const auth = await fetchAuthenticatedProfile();
  const [questionRaw, tags] = await Promise.all([
    fetchForumQuestionById(id),
    fetchEntityTags("forum", id),
  ]);

  if (!questionRaw) notFound();

  const question = await enrichForumQuestionWithLikes(questionRaw, auth?.userId);

  return (
    <div className="stack">
      <section className="card stack">
        <Link href="/forum">← חזרה לפורום</Link>
        <h1>{question.title}</h1>
        <p className="muted">{question.user?.full_name}</p>
        <p>{question.content}</p>
        {tags.length > 0 && (
          <p>
            {tags.map((tag) => (
              <span key={tag.id} className="badge" style={{ marginInlineStart: "0.25rem" }}>
                {tag.tag?.name}
              </span>
            ))}
          </p>
        )}
        <ForumLikeButton
          targetType="question"
          targetId={question.id}
          initialCount={question.like_count}
          initialLiked={question.user_liked}
        />
        <ReportForm targetType="forum_question" targetId={question.id} />
      </section>

      <section className="card stack">
        <h2>תשובות</h2>
        <ForumAnswerForm questionId={question.id} />
        <ForumAnswerThread questionId={question.id} answers={question.answers ?? []} />
      </section>
    </div>
  );
}
