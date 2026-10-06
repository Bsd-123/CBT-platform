import type { PublicProfessionalRequestComment } from "@/lib/models/professional-request";
import { ProfessionalRequestCommentForm } from "@/components/professional-requests/ProfessionalRequestCommentForm";
import { Disclosure } from "@/components/ui/Disclosure";
import { formatDate } from "@/lib/utils/format";

type ProfessionalRequestCommentThreadProps = {
  requestId: string;
  comments: PublicProfessionalRequestComment[];
};

export function ProfessionalRequestCommentThread({
  requestId,
  comments,
}: ProfessionalRequestCommentThreadProps) {
  if (comments.length === 0) return null;

  return (
    <ul className="thread-list">
      {comments.map((comment) => (
        <li key={comment.id}>
          <div className="thread-card">
            <div className="thread-meta">
              <strong>{comment.user?.full_name ?? "משתמש"}</strong>
              <span>{formatDate(comment.created_at)}</span>
            </div>
            <p>{comment.content}</p>
            <div className="thread-actions">
              <Disclosure label="הגבה">
                <ProfessionalRequestCommentForm
                  requestId={requestId}
                  parentCommentId={comment.id}
                  label="הגבה לתגובה"
                />
              </Disclosure>
            </div>
          </div>
          {comment.replies && comment.replies.length > 0 && (
            <div className="thread-replies">
              <ProfessionalRequestCommentThread
                requestId={requestId}
                comments={comment.replies}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
