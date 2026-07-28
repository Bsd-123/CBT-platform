"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PublicRecommendationComment } from "@/lib/models/recommendation";
import { submitRecommendationComment } from "@/lib/actions/submit";

type RecommendationCommentsProps = {
  recommendationId: string;
  comments: PublicRecommendationComment[];
};

export function RecommendationComments({
  recommendationId,
  comments,
}: RecommendationCommentsProps) {
  return (
    <div className="stack">
      <CommentForm recommendationId={recommendationId} />
      <ul className="list-plain">
        {comments.map((comment) => (
          <li key={comment.id}>
            <div className="card stack">
              <p>{comment.content}</p>
              <p className="muted">{comment.user?.full_name ?? "משתמש"}</p>
              {comment.depth === 0 && (
                <CommentForm
                  recommendationId={recommendationId}
                  parentCommentId={comment.id}
                  label="הגבה לתגובה"
                />
              )}
              {comment.replies?.map((reply) => (
                <div key={reply.id} className="card" style={{ marginInlineStart: "1rem" }}>
                  <p>{reply.content}</p>
                  <p className="muted">{reply.user?.full_name ?? "משתמש"}</p>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CommentForm({
  recommendationId,
  parentCommentId = null,
  label = "תגובה להמלצה",
}: {
  recommendationId: string;
  parentCommentId?: string | null;
  label?: string;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await submitRecommendationComment({
        recommendation_id: recommendationId,
        content,
        parent_comment_id: parentCommentId,
      });
      setContent("");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "הפרסום נכשל");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <h4>{label}</h4>
      <div className="form-field">
        <textarea rows={3} required value={content} onChange={(e) => setContent(e.target.value)} />
      </div>
      {error && <p className="error">{error}</p>}
      <button type="submit" className="button secondary" disabled={loading}>
        {loading ? "שולח..." : "שליחה"}
      </button>
    </form>
  );
}
