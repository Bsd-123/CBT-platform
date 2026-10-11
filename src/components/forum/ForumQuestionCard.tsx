import { AuthorBadges } from "@/components/forum/AuthorBadges";
import { ForumLikeButton } from "@/components/forum/ForumLikeButton";
import { MaterialIcon } from "@/components/shared/MaterialIcon";
import { ReportForm } from "@/components/shared/ReportForm";
import { ShareButton } from "@/components/shared/ShareButton";
import { TagList } from "@/components/shared/TagList";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { authorBadges } from "@/lib/forum/thread";
import type { PublicForumQuestion } from "@/lib/models/forum";
import type { WithForumLikes } from "@/lib/services/forum-likes";
import { countLabel, formatDate } from "@/lib/utils/format";

type ForumQuestionCardProps = {
  question: PublicForumQuestion & WithForumLikes;
  tags: Parameters<typeof TagList>[0]["tags"];
  answerCount: number;
};

/** The thread's main card: title, author line, content, tags and engagement controls. */
export function ForumQuestionCard({ question, tags, answerCount }: ForumQuestionCardProps) {
  const author = question.user;
  const badges = authorBadges({
    authorId: question.user_id,
    questionOwnerId: question.user_id,
    role: author?.role,
  }).filter((badge) => badge.kind !== "op"); // the asker is obvious on their own question

  return (
    <article className="fq-card fq-question" aria-labelledby="question-title">
      <header>
        <h1 id="question-title">{question.title}</h1>
        <div className="fq-author fq-author--meta">
          <UserAvatar name={author?.full_name} size="md" />
          <strong>{author?.full_name ?? "משתמש"}</strong>
          <AuthorBadges badges={badges} />
          <span className="fq-meta-item">
            <MaterialIcon name="schedule" />
            <time dateTime={question.created_at.toISOString()}>{formatDate(question.created_at)}</time>
          </span>
          <span className="fq-meta-item">
            <MaterialIcon name="chat_bubble" />
            {countLabel(answerCount, "תשובה", "תשובות")}
          </span>
        </div>
      </header>

      <p className="fq-body fq-body--question">{question.content}</p>

      <TagList tags={tags} />

      <footer className="fq-actions fq-actions--bar">
        <ForumLikeButton
          variant="inline"
          targetType="question"
          targetId={question.id}
          initialCount={question.like_count}
          initialLiked={question.user_liked}
        />
        <ShareButton path={`/forum/${question.id}`} />
        <ReportForm targetType="forum_question" targetId={question.id} />
      </footer>
    </article>
  );
}
