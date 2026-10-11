import { previewText } from "@/lib/email/layout";
import { formatEventDate, formatEventTimeValue, toDateKey } from "@/lib/utils/calendar";

export type EventSnapshot = {
  title: string;
  description: string;
  event_date: Date | string | null;
  event_time: Date | string | null;
  is_cancelled: boolean;
};

export type EventChange = {
  field: "title" | "description" | "date" | "time" | "status";
  label: string;
  before: string;
  after: string;
};

const NONE = "לא צוין";

const dateText = (value: EventSnapshot["event_date"]) => (value ? formatEventDate(value) : NONE);
const timeText = (value: EventSnapshot["event_time"]) => (value ? formatEventTimeValue(value) : NONE);

/** Which of the details an organizer changed, in the order readers care about them. */
export function diffEvent(before: EventSnapshot, after: EventSnapshot): EventChange[] {
  const changes: EventChange[] = [];

  if (before.is_cancelled !== after.is_cancelled) {
    changes.push({
      field: "status",
      label: "סטטוס",
      before: before.is_cancelled ? "בוטל" : "פעיל",
      after: after.is_cancelled ? "בוטל" : "פעיל",
    });
  }

  const dateKey = (value: EventSnapshot["event_date"]) => (value ? toDateKey(value) : "");
  if (dateKey(before.event_date) !== dateKey(after.event_date)) {
    changes.push({ field: "date", label: "תאריך", before: dateText(before.event_date), after: dateText(after.event_date) });
  }

  if (timeText(before.event_time) !== timeText(after.event_time)) {
    changes.push({ field: "time", label: "שעה", before: timeText(before.event_time), after: timeText(after.event_time) });
  }

  if (before.title !== after.title) {
    changes.push({ field: "title", label: "שם האירוע", before: before.title, after: after.title });
  }

  if (before.description.trim() !== after.description.trim()) {
    changes.push({
      field: "description",
      label: "תיאור ותוכן האירוע",
      before: previewText(before.description, 160),
      after: previewText(after.description, 320),
    });
  }

  return changes;
}
