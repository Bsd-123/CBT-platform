import type { PublicForumAnswerWithLikes } from "@/lib/services/forum-likes";
import { ForumAnswerForm } from "@/components/forum/ForumAnswerForm";
import { ForumLikeButton } from "@/components/forum/ForumLikeButton";
import { ReportForm } from "@/components/shared/ReportForm";
import { Disclosure } from "@/components/ui/Disclosure";
import { formatDate } from "@/lib/utils/format";

type ForumAnswerThreadProps = {
  questionId: string;
  answers: PublicForumAnswerWithLikes[];
};

export function ForumAnswerThread({ questionId, answers }: ForumAnswerThreadProps) {
  if (answers.length === 0) {
    return null;
  }

  return (
    <ul className="thread-list">
      {answers.map((answer) => (
        <li key={answer.id}>
          <div className="thread-card">
            <div className="thread-meta">
              <strong>{answer.user?.full_name ?? "משתמש"}</strong>
              <span>{formatDate(answer.created_at)}</span>
            </div>
            <p>{answer.content}</p>
            <div className="thread-actions">
              <ForumLikeButton
                targetType="answer"
                targetId={answer.id}
                initialCount={answer.like_count}
                initialLiked={answer.user_liked}
              />
              <Disclosure label="הגבה">
                <ForumAnswerForm
                  questionId={questionId}
                  parentAnswerId={answer.id}
                  label="הגבה לתשובה"
                />
              </Disclosure>
              <ReportForm targetType="forum_answer" targetId={answer.id} />
            </div>
          </div>
          {answer.replies && answer.replies.length > 0 && (
            <div className="thread-replies">
              <ForumAnswerThread questionId={questionId} answers={answer.replies} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
