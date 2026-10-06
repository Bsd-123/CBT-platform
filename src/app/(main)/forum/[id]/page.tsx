import Link from "next/link";
import { notFound } from "next/navigation";
import { ForumAnswerForm } from "@/components/forum/ForumAnswerForm";
import { ForumAnswerThread } from "@/components/forum/ForumAnswerThread";
import { ForumLikeButton } from "@/components/forum/ForumLikeButton";
import { ReportForm } from "@/components/shared/ReportForm";
import { TagList } from "@/components/shared/TagList";
import { MaterialIcon } from "@/components/shared/MaterialIcon";
import { fetchAuthenticatedProfile } from "@/lib/actions/auth";
import { fetchEntityTags, fetchForumQuestionById } from "@/lib/data";
import { enrichForumQuestionWithLikes } from "@/lib/services/forum-likes";
import { formatDate } from "@/lib/utils/format";

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
    <>
      <p>
        <Link href="/forum">
          <MaterialIcon name="arrow_forward" /> חזרה לפורום
        </Link>
      </p>

      <section className="ui-section">
        <h1>{question.title}</h1>
        <div className="thread-meta">
          <strong>{question.user?.full_name}</strong>
          <span>{formatDate(question.created_at)}</span>
        </div>
        <p>{question.content}</p>
        <TagList tags={tags} />
        <div className="thread-actions">
          <ForumLikeButton
            targetType="question"
            targetId={question.id}
            initialCount={question.like_count}
            initialLiked={question.user_liked}
          />
          <ReportForm targetType="forum_question" targetId={question.id} />
        </div>
      </section>

      <section className="ui-section">
        <h2>תשובות</h2>
        <ForumAnswerForm questionId={question.id} />
      </section>

      <ForumAnswerThread questionId={question.id} answers={question.answers ?? []} />
    </>
  );
}
