"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitProfessionalRequestComment } from "@/lib/actions/submit";
import { unwrap } from "@/lib/actions/result";

type ProfessionalRequestCommentFormProps = {
  requestId: string;
  parentCommentId?: string | null;
  placeholder?: string;
  /** Collapses the form again; called after a successful send as well. */
  onCancel: () => void;
};

/** Response composer in the recommendations chat style: one growing textarea, send and cancel. */
export function ProfessionalRequestCommentForm({
  requestId,
  parentCommentId = null,
  placeholder = "כתבו תגובה...",
  onCancel,
}: ProfessionalRequestCommentFormProps) {
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
      unwrap(await submitProfessionalRequestComment({
        request_id: requestId,
        content: content.trim(),
        parent_comment_id: parentCommentId,
      }));
      setContent("");
      onCancel();
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "הפרסום נכשל");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rec-chat-composer-slot">
      <form
        className="rec-chat-reply-form"
        onSubmit={(event) => void handleSubmit(event)}
        onKeyDown={(event) => event.key === "Escape" && onCancel()}
      >
        <textarea
          rows={2}
          required
          autoFocus
          value={content}
          placeholder={placeholder}
          aria-label={placeholder}
          onChange={(event) => setContent(event.target.value)}
        />
        <button type="submit" className="btn btn-primary btn-icon" disabled={loading} aria-label="שליחה">
          <span className="material-symbols-outlined" aria-hidden="true">
            send
          </span>
        </button>
      </form>
      <div className="rec-chat-reply-form-footer">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel} disabled={loading}>
          ביטול
        </button>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
