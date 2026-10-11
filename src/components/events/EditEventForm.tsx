"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitEventUpdate } from "@/lib/actions/submit";
import { formatEventTime, toDateKey } from "@/lib/utils/calendar";
import { unwrap } from "@/lib/actions/result";

type EditEventFormProps = {
  eventId: string;
  initial: {
    title: string;
    description: string;
    event_date: string;
    event_time: string;
    is_cancelled: boolean;
  };
  canCancel: boolean;
};

export function EditEventForm({ eventId, initial, canCancel }: EditEventFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [eventDate, setEventDate] = useState(initial.event_date);
  const [eventTime, setEventTime] = useState(initial.event_time);
  const [isCancelled, setIsCancelled] = useState(initial.is_cancelled);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      unwrap(await submitEventUpdate(eventId, {
        title,
        description,
        event_date: eventDate,
        event_time: eventTime,
        is_cancelled: isCancelled,
      }));
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "העדכון נכשל");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <h3>עריכת אירוע</h3>
      <div className="form-field">
        <label htmlFor="edit-title">כותרת</label>
        <input id="edit-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="form-field">
        <label htmlFor="edit-description">תיאור</label>
        <textarea id="edit-description" rows={4} required value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="form-field">
        <label htmlFor="edit-date">תאריך</label>
        <input id="edit-date" type="date" required value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
      </div>
      <div className="form-field">
        <label htmlFor="edit-time">שעה</label>
        <input id="edit-time" type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
      </div>
      {canCancel && (
        <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input type="checkbox" checked={isCancelled} onChange={(e) => setIsCancelled(e.target.checked)} />
          סימון כבוטל
        </label>
      )}
      {error && <p className="error">{error}</p>}
      <button type="submit" className="button" disabled={loading}>{loading ? "שומר..." : "שמירת שינויים"}</button>
    </form>
  );
}

function formatDateInput(value: Date | string | null | undefined): string {
  if (!value) return "";
  return toDateKey(value);
}

function formatTimeInput(value: Date | string | null | undefined): string {
  if (!value) return "";
  const iso = typeof value === "string" ? value : value.toISOString();
  return formatEventTime(iso);
}

export function buildEditEventInitial(event: {
  title: string;
  description: string;
  event_date: Date | string | null;
  event_time: Date | string | null;
  is_cancelled: boolean;
}) {
  return {
    title: event.title,
    description: event.description,
    event_date: formatDateInput(event.event_date),
    event_time: formatTimeInput(event.event_time),
    is_cancelled: event.is_cancelled,
  };
}
