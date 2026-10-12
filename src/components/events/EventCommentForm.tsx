"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { MaterialIcon } from "@/components/shared/MaterialIcon";
import { submitEventComment } from "@/lib/actions/submit";
import { unwrap } from "@/lib/actions/result";

type EventCommentFormProps = {
  eventId: string;
};

/** Collapsed behind an "add comment" button; opens with a short expand animation and can be cancelled. */
export function EventCommentForm({ eventId }: EventCommentFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  function openForm() {
    setOpen(true);
    // The panel is visibility:hidden until the next paint, so focus once it can receive it.
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function closeForm() {
    setOpen(false);
    setError(null);
    toggleRef.current?.focus();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      unwrap(await submitEventComment({ event_id: eventId, content }));
      setContent("");
      setOpen(false);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "הפרסום נכשל");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="event-comment-composer">
      {!open && (
        <button
          ref={toggleRef}
          type="button"
          className="btn btn-secondary event-comment-toggle"
          aria-expanded={false}
          aria-controls="event-comment-panel"
          onClick={openForm}
        >
          <MaterialIcon name="add_comment" />
          הוספת תגובה
        </button>
      )}

      <div
        id="event-comment-panel"
        className={`event-comment-panel${open ? " is-open" : ""}`}
        aria-hidden={!open}
      >
        <div className="event-comment-panel-inner">
          <form className="stack" onSubmit={handleSubmit} onKeyDown={(e) => e.key === "Escape" && closeForm()}>
            <div className="form-field">
              <label htmlFor="event-comment">תגובה</label>
              <textarea
                id="event-comment"
                ref={textareaRef}
                rows={3}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            {error && <p className="error">{error}</p>}
            <div className="event-comment-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "שולח..." : "פרסום תגובה"}
              </button>
              <button type="button" className="btn btn-secondary" disabled={loading} onClick={closeForm}>
                ביטול
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
