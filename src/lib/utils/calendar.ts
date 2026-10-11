import type { PublicEvent } from "@/lib/models/event";

export type CalendarEventItem = {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
};

const WEEKDAY_LABELS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"] as const;

export function serializeCalendarEvents(events: PublicEvent[]): CalendarEventItem[] {
  return events
    .filter((event) => event.event_date)
    .map((event) => ({
      id: event.id,
      title: event.title,
      event_date: toDateKey(event.event_date!),
      event_time: event.event_time ? toEventTimeIso(event.event_time) : null,
    }));
}

function toEventTimeIso(value: Date | string): string {
  if (typeof value === "string") {
    return value.includes("T") ? value : `1970-01-01T${value}Z`;
  }
  return value.toISOString();
}

export function toDateKey(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseMonthParam(value: string | undefined): { year: number; month: number } | null {
  if (!value?.match(/^\d{4}-\d{2}$/)) return null;
  const [year, month] = value.split("-").map(Number);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

export function groupEventsByDate(events: CalendarEventItem[]): Map<string, CalendarEventItem[]> {
  const map = new Map<string, CalendarEventItem[]>();
  for (const event of events) {
    const list = map.get(event.event_date) ?? [];
    list.push(event);
    map.set(event.event_date, list);
  }
  for (const [key, list] of map) {
    map.set(
      key,
      [...list].sort((a, b) => formatEventTime(a.event_time).localeCompare(formatEventTime(b.event_time))),
    );
  }
  return map;
}

export function formatEventTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
}

/**
 * event_date (@db.Date) and event_time (@db.Time) are wall-clock values that
 * Prisma returns as UTC Dates. Always format them in UTC so the viewer's
 * time zone cannot shift them (e.g. 09:00 showing as 12:00 in Israel).
 */
export function formatEventDate(value: Date | string): string {
  return new Date(value).toLocaleDateString("he-IL", { timeZone: "UTC" });
}

export function formatEventTimeValue(value: Date | string): string {
  const iso = typeof value === "string" ? toEventTimeIso(value) : value.toISOString();
  return formatEventTime(iso);
}

export function formatMonthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("he-IL", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function buildMonthCells(year: number, month: number): { dateKey: string; day: number; inMonth: boolean }[] {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const startOffset = firstOfMonth.getUTCDay();
  const gridStart = new Date(Date.UTC(year, month - 1, 1 - startOffset));

  return Array.from({ length: 42 }, (_, index) => {
    const cellDate = new Date(gridStart);
    cellDate.setUTCDate(gridStart.getUTCDate() + index);
    return {
      dateKey: toDateKey(cellDate),
      day: cellDate.getUTCDate(),
      inMonth: cellDate.getUTCMonth() === month - 1,
    };
  });
}

export function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

export function monthParam(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export { WEEKDAY_LABELS };
