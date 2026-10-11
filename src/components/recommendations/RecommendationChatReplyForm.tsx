"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitRecommendationComment } from "@/lib/actions/submit";
import { unwrap } from "@/lib/actions/result";

type RecommendationChatReplyFormProps = {
  recommendationId: string;
  parentCommentId?: string | null;
  placeholder?: string;
  onCancel?: () => void;
  autoFocus?: boolean;
};

export function RecommendationChatReplyForm({
  recommendationId,
  parentCommentId = null,
  placeholder = "כתבו תגובה...",
  onCancel,
  autoFocus = false,
}: RecommendationChatReplyFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;

    setError(null);
    setLoading(true);

    try {
      unwrap(await submitRecommendationComment({
        recommendation_id: recommendationId,
        content: content.trim(),
        parent_comment_id: parentCommentId,
      }));
      setContent("");
      onCancel?.();
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "הפרסום נכשל");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rec-chat-composer-slot">
      <form className="rec-chat-reply-form" onSubmit={(event) => void handleSubmit(event)}>
        <textarea
          rows={1}
          required
          value={content}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <button type="submit" className="rec-chat-send-btn" disabled={loading} aria-label="שליחה">
          <span className="material-symbols-outlined" aria-hidden="true">
            send
          </span>
        </button>
      </form>
      <div className="rec-chat-reply-form-footer">
        {onCancel ? (
          <button type="button" className="rec-chat-cancel-btn" onClick={onCancel}>
            ביטול
          </button>
        ) : (
          <span />
        )}
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
