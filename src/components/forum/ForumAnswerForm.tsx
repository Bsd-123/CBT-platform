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
  const isReply = parentAnswerId !== null;
  const fieldId = `answer-${parentAnswerId ?? "root"}`;

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
      <div className="form-field">
        <label htmlFor={fieldId}>{isReply ? "תוכן התגובה" : label}</label>
        <textarea
          id={fieldId}
          rows={isReply ? 3 : 6}
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={isReply ? undefined : "שתפו מה עבד בעבודה שלכם. אפשר לציין קבוצת גיל ומסגרת טיפול."}
        />
        {!isReply && (
          <small className="muted">
            אנא הימנעו מפרטים מזהים של מטופלים. שורות ריקות יישמרו כפי שהוקלדו.
          </small>
        )}
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="fq-form-actions">
        <button type="submit" className={isReply ? "button secondary" : "button"} disabled={loading}>
          {loading ? "שולח..." : isReply ? "שליחה" : "פרסום תשובה"}
        </button>
      </div>
    </form>
  );
}
