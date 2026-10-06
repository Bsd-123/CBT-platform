"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitForumAnswer } from "@/lib/actions/submit";
import { unwrap } from "@/lib/actions/result";

type ForumAnswerFormProps = {
  questionId: string;
  parentAnswerId?: string | null;
  label?: string;
};

export function ForumAnswerForm({
  questionId,
  parentAnswerId = null,
  label = "כתיבת תשובה",
}: ForumAnswerFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      unwrap(await submitForumAnswer({
        question_id: questionId,
        content,
        parent_answer_id: parentAnswerId,
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
      {!parentAnswerId && <h4>{label}</h4>}
      <div className="form-field">
        <label htmlFor={`answer-${parentAnswerId ?? "root"}`}>תוכן</label>
        <textarea
          id={`answer-${parentAnswerId ?? "root"}`}
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
