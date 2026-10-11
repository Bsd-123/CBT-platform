"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitEvent } from "@/lib/actions/submit";
import { unwrap } from "@/lib/actions/result";

export function CreateEventForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const created = unwrap(await submitEvent({
        title,
        description,
        event_date: eventDate,
        event_time: eventTime || undefined,
      }));
      setTitle("");
      setDescription("");
      setEventDate("");
      setEventTime("");
      router.push(`/events/${created.id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "יצירת האירוע נכשלה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="event-title">כותרת</label>
        <input id="event-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="form-field">
        <label htmlFor="event-description">תיאור</label>
        <textarea id="event-description" rows={4} required value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="form-field">
        <label htmlFor="event-date">תאריך (חובה ללוח שנה)</label>
        <input id="event-date" type="date" required value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
      </div>
      <div className="form-field">
        <label htmlFor="event-time">שעה (אופציונלי — ללא שעה = כל היום)</label>
        <input id="event-time" type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
      </div>
      {error && <p className="error">{error}</p>}
      <button type="submit" className="button" disabled={loading}>{loading ? "יוצר..." : "יצירת אירוע"}</button>
    </form>
  );
}
