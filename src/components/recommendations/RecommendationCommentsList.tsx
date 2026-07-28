import type { PublicRecommendationComment } from "@/lib/models/recommendation";
import { RecommendationCommentForm } from "@/components/recommendations/RecommendationCommentForm";

type RecommendationCommentsListProps = {
  recommendationId: string;
  comments: PublicRecommendationComment[];
};

export function RecommendationCommentsList({
  recommendationId,
  comments,
}: RecommendationCommentsListProps) {
  return (
    <div className="stack">
      <RecommendationCommentForm recommendationId={recommendationId} label="תגובה להמלצה" />
      <ul className="thread-list">
        {comments.map((comment) => (
          <li key={comment.id} className="thread-item">
            <div className="card stack">
              <p>{comment.content}</p>
              <p className="muted">{comment.user?.full_name ?? "משתמש"}</p>
              {comment.depth === 0 && (
                <RecommendationCommentForm
                  recommendationId={recommendationId}
                  parentCommentId={comment.id}
                  label="הגבה לתגובה"
                />
              )}
              {comment.replies && comment.replies.length > 0 && (
                <ul className="thread-list">
                  {comment.replies.map((reply) => (
                    <li key={reply.id} className="thread-item">
                      <div className="card stack">
                        <p>{reply.content}</p>
                        <p className="muted">{reply.user?.full_name ?? "משתמש"}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
