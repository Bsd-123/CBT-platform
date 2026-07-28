import type { PublicForumAnswerWithLikes } from "@/lib/services/forum-likes";
import { ForumAnswerForm } from "@/components/forum/ForumAnswerForm";
import { ForumLikeButton } from "@/components/forum/ForumLikeButton";
import { ReportForm } from "@/components/shared/ReportForm";

type ForumAnswerThreadProps = {
  questionId: string;
  answers: PublicForumAnswerWithLikes[];
  depth?: number;
};

export function ForumAnswerThread({
  questionId,
  answers,
  depth = 0,
}: ForumAnswerThreadProps) {
  if (answers.length === 0) {
    return null;
  }

  return (
    <ul className="thread-list">
      {answers.map((answer) => (
        <li key={answer.id} className="thread-item" style={{ marginInlineStart: `${depth * 1.25}rem` }}>
          <div className="card stack">
            <p>{answer.content}</p>
            <p className="muted">{answer.user?.full_name ?? "משתמש"}</p>
            <ForumLikeButton
              targetType="answer"
              targetId={answer.id}
              initialCount={answer.like_count}
              initialLiked={answer.user_liked}
            />
            <ReportForm targetType="forum_answer" targetId={answer.id} />
            <ForumAnswerForm
              questionId={questionId}
              parentAnswerId={answer.id}
              label="הגבה לתשובה"
            />
            {answer.replies && answer.replies.length > 0 && (
              <ForumAnswerThread
                questionId={questionId}
                answers={answer.replies}
                depth={depth + 1}
              />
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
