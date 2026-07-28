"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PublicEvent } from "@/lib/models/event";
import { submitEventComment, submitEventUpdate } from "@/lib/actions/submit";

type EventDetailActionsProps = {
  event: PublicEvent;
  isOwner: boolean;
  isAdmin: boolean;
};

export function EventDetailActions({ event, isOwner, isAdmin }: EventDetailActionsProps) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleComment(eventForm: React.FormEvent) {
    eventForm.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await submitEventComment({ event_id: event.id, content: comment });
      setComment("");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "הפרסום נכשל");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!confirm("לבטל את האירוע?")) return;
    setLoading(true);
    try {
      await submitEventUpdate(event.id, { is_cancelled: true });
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "הביטול נכשל");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      {(isOwner || isAdmin) && !event.is_cancelled && (
        <button type="button" className="button danger" onClick={() => void handleCancel()} disabled={loading}>
          סימון כבוטל
        </button>
      )}

      <form className="stack" onSubmit={handleComment}>
        <h3>עדכון / תגובה (שטוח בלבד)</h3>
        <div className="form-field">
          <textarea rows={3} required value={comment} onChange={(e) => setComment(e.target.value)} placeholder='למשל: "האירוע יתחיל 30 דקות אחרי"' />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="button secondary" disabled={loading}>
          {loading ? "שולח..." : "פרסום עדכון"}
        </button>
      </form>
    </div>
  );
}
