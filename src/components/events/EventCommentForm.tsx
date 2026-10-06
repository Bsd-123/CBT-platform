"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitEventComment } from "@/lib/actions/submit";
import { unwrap } from "@/lib/actions/result";

type EventCommentFormProps = {
  eventId: string;
};

export function EventCommentForm({ eventId }: EventCommentFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      unwrap(await submitEventComment({ event_id: eventId, content }));
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
      <h3>עדכון / תגובה (שטוחה בלבד)</h3>
      <div className="form-field">
        <label htmlFor="event-comment">תוכן</label>
        <textarea id="event-comment" rows={3} required value={content} onChange={(e) => setContent(e.target.value)} />
      </div>
      {error && <p className="error">{error}</p>}
      <button type="submit" className="button secondary" disabled={loading}>{loading ? "שולח..." : "פרסום עדכון"}</button>
    </form>
  );
}
