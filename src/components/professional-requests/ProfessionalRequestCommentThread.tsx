import type { PublicProfessionalRequestComment } from "@/lib/models/professional-request";
import { ProfessionalRequestCommentForm } from "@/components/professional-requests/ProfessionalRequestCommentForm";

type ProfessionalRequestCommentThreadProps = {
  requestId: string;
  comments: PublicProfessionalRequestComment[];
  depth?: number;
};

export function ProfessionalRequestCommentThread({
  requestId,
  comments,
  depth = 0,
}: ProfessionalRequestCommentThreadProps) {
  if (comments.length === 0) return null;

  return (
    <ul className="thread-list">
      {comments.map((comment) => (
        <li key={comment.id} className="thread-item" style={{ marginInlineStart: `${depth * 1.25}rem` }}>
          <div className="card stack">
            <p>{comment.content}</p>
            <p className="muted">{comment.user?.full_name ?? "משתמש"}</p>
            <ProfessionalRequestCommentForm
              requestId={requestId}
              parentCommentId={comment.id}
              label="הגבה לתגובה"
            />
            {comment.replies && comment.replies.length > 0 && (
              <ProfessionalRequestCommentThread
                requestId={requestId}
                comments={comment.replies}
                depth={depth + 1}
              />
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
