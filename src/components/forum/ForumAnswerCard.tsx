import { AuthorBadges } from "@/components/forum/AuthorBadges";
import { ForumAnswerForm } from "@/components/forum/ForumAnswerForm";
import { ForumLikeButton } from "@/components/forum/ForumLikeButton";
import { MaterialIcon } from "@/components/shared/MaterialIcon";
import { ReportForm } from "@/components/shared/ReportForm";
import { ShareButton } from "@/components/shared/ShareButton";
import { Disclosure } from "@/components/ui/Disclosure";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { authorBadges } from "@/lib/forum/thread";
import type { PublicForumAnswerWithLikes } from "@/lib/services/forum-likes";
import { formatDate } from "@/lib/utils/format";

type ForumAnswerCardProps = {
  questionId: string;
  questionOwnerId: string;
  answer: PublicForumAnswerWithLikes;
  /** 0 for a top-level answer; replies are rendered one level deeper each time. */
  depth?: number;
  /** Renders the highlighted "top answer" treatment above the other answers. */
  highlighted?: boolean;
};

/**
 * One answer (or reply) with its vote column, author line, actions and nested replies.
 * Replies sit under their parent behind a vertical guide line.
 */
export function ForumAnswerCard({
  questionId,
  questionOwnerId,
  answer,
  depth = 0,
  highlighted = false,
}: ForumAnswerCardProps) {
  const isReply = depth > 0;
  const author = answer.user;
  const badges = authorBadges({
    authorId: answer.user_id,
    questionOwnerId,
    role: author?.role,
  });
  const anchor = `answer-${answer.id}`;
  // `replies` is typed as both the plain and the like-enriched answer; at runtime it is the latter.
  const replies = answer.replies as PublicForumAnswerWithLikes[] | undefined;

  return (
    <div className={`fq-thread${isReply ? " fq-thread--reply" : ""}`}>
      <article
        id={anchor}
        className={`fq-answer${isReply ? " fq-answer--reply" : ""}${highlighted ? " fq-answer--top" : ""}`}
        aria-label={`${isReply ? "תגובה" : "תשובה"} של ${author?.full_name ?? "משתמש"}`}
      >
        {answer.is_hidden && (
          <p className="banner-warning" role="status">
            תשובה מוסתרת, מוצגת למנהלים בלבד.
          </p>
        )}
        {highlighted && (
          <p className="fq-top-label">
            <MaterialIcon name="military_tech" filled />
            התשובה המובילה
          </p>
        )}

        <div className="fq-answer-grid">
          <div className="fq-vote-col">
            <ForumLikeButton
              variant="stacked"
              targetType="answer"
              targetId={answer.id}
              initialCount={answer.like_count}
              initialLiked={answer.user_liked}
            />
          </div>

          <div className="fq-answer-main">
            <header className="fq-author">
              <UserAvatar name={author?.full_name} size={isReply ? "sm" : "md"} />
              <strong>{author?.full_name ?? "משתמש"}</strong>
              <AuthorBadges badges={badges} />
              <time className="fq-date" dateTime={answer.created_at.toISOString()}>
                {formatDate(answer.created_at)}
              </time>
            </header>

            <p className="fq-body">{answer.content}</p>

            <footer className="fq-actions">
              <Disclosure label="הגבה">
                <ForumAnswerForm
                  questionId={questionId}
                  parentAnswerId={answer.id}
                  label="הגבה לתשובה"
                />
              </Disclosure>
              <ShareButton path={`/forum/${questionId}#${anchor}`} />
              <ReportForm targetType="forum_answer" targetId={answer.id} />
            </footer>
          </div>
        </div>
      </article>

      {replies && replies.length > 0 && (
        <div className="fq-replies">
          {replies.map((reply) => (
            <ForumAnswerCard
              key={reply.id}
              questionId={questionId}
              questionOwnerId={questionOwnerId}
              answer={reply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
