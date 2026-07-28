"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitProfessionalRequestComment } from "@/lib/actions/submit";

type ProfessionalCommentFormProps = {
  requestId: string;
  parentCommentId?: string | null;
  label?: string;
};

export function ProfessionalCommentForm({
  requestId,
  parentCommentId = null,
  label = "תגובה",
}: ProfessionalCommentFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await submitProfessionalRequestComment({
        request_id: requestId,
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
