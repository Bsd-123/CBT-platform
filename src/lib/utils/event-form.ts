import { formatEventTime, toDateKey } from "@/lib/utils/calendar";

// Not in the form component: server pages call this, and a "use client" module cannot be called from the server.
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
