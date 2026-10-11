"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitRecommendationComment } from "@/lib/actions/submit";
import { unwrap } from "@/lib/actions/result";

type RecommendationCommentFormProps = {
  recommendationId: string;
  parentCommentId?: string | null;
  label?: string;
};

export function RecommendationCommentForm({
  recommendationId,
  parentCommentId = null,
  label = "תגובה",
}: RecommendationCommentFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      unwrap(await submitRecommendationComment({
        recommendation_id: recommendationId,
        content,
        parent_comment_id: parentCommentId,
      }));
      setContent("");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "הפרסום נכשל");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="stack thread-form" onSubmit={handleSubmit}>
      <h4>{label}</h4>
      <div className="form-field">
        <label htmlFor={`rec-comment-${parentCommentId ?? "root"}`}>תוכן</label>
        <textarea
          id={`rec-comment-${parentCommentId ?? "root"}`}
          rows={3}
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
      {error && <p className="error">{error}</p>}
      <button type="submit" className="button secondary" disabled={loading}>
        {loading ? "שולח..." : "שליחה"}
      </button>
    </form>
  );
}
