"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { CalendarEventItem } from "@/lib/utils/calendar";
import {
  WEEKDAY_LABELS,
  buildMonthCells,
  formatEventTime,
  formatMonthLabel,
  getTodayKey,
  groupEventsByDate,
  monthParam,
  shiftMonth,
} from "@/lib/utils/calendar";

type EventsCalendarProps = {
  events: CalendarEventItem[];
  initialYear: number;
  initialMonth: number;
};

export function EventsCalendar({ events, initialYear, initialMonth }: EventsCalendarProps) {
  const router = useRouter();
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);
  const cells = useMemo(() => buildMonthCells(year, month), [year, month]);
  const todayKey = getTodayKey();

  const selectedEvents = selectedDateKey ? eventsByDate.get(selectedDateKey) ?? [] : [];

  function navigateToMonth(nextYear: number, nextMonth: number) {
    setYear(nextYear);
    setMonth(nextMonth);
    setSelectedDateKey(null);
    router.replace(`/events/calendar?month=${monthParam(nextYear, nextMonth)}`, { scroll: false });
  }

  function handlePrevMonth() {
    const next = shiftMonth(year, month, -1);
    navigateToMonth(next.year, next.month);
  }

  function handleNextMonth() {
    const next = shiftMonth(year, month, 1);
    navigateToMonth(next.year, next.month);
  }

  function handleToday() {
    const now = new Date();
    navigateToMonth(now.getFullYear(), now.getMonth() + 1);
    setSelectedDateKey(getTodayKey());
  }

  return (
    <div className="stack">
      <div className="calendar-toolbar">
        <div className="calendar-toolbar-nav">
          <button type="button" className="button secondary" onClick={handlePrevMonth} aria-label="חודש קודם">
            →
          </button>
          <h2 className="calendar-month-label">{formatMonthLabel(year, month)}</h2>
          <button type="button" className="button secondary" onClick={handleNextMonth} aria-label="חודש הבא">
            ←
          </button>
        </div>
        <button type="button" className="button secondary" onClick={handleToday}>
          היום
        </button>
      </div>

      <div className="calendar-grid" role="grid" aria-label="לוח שנה אירועים">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="calendar-weekday" role="columnheader">
            {label}
          </div>
        ))}

        {cells.map((cell) => {
          const dayEvents = eventsByDate.get(cell.dateKey) ?? [];
          const isToday = cell.dateKey === todayKey;
          const isSelected = cell.dateKey === selectedDateKey;

          return (
            <div
              key={cell.dateKey}
              role="gridcell"
              tabIndex={0}
              className={[
                "calendar-day",
                !cell.inMonth && "calendar-day-other",
                isToday && "calendar-day-today",
                dayEvents.length > 0 && "calendar-day-has-events",
                isSelected && "calendar-day-selected",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setSelectedDateKey(cell.dateKey)}
              onKeyDown={(keyboardEvent) => {
                if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                  keyboardEvent.preventDefault();
                  setSelectedDateKey(cell.dateKey);
                }
              }}
              aria-label={`${cell.day}, ${dayEvents.length} אירועים`}
              aria-selected={isSelected}
            >
              <span className="calendar-day-number">{cell.day}</span>
              {dayEvents.length > 0 && (
                <ul className="calendar-day-events">
                  {dayEvents.slice(0, 2).map((event) => (
                    <li key={event.id}>
                      <Link
                        href={`/events/${event.id}`}
                        className="calendar-event-link"
                        onClick={(eventClick) => eventClick.stopPropagation()}
                      >
                        {event.event_time && (
                          <span className="calendar-event-time">{formatEventTime(event.event_time)} </span>
                        )}
                        {event.title}
                      </Link>
                    </li>
                  ))}
                  {dayEvents.length > 2 && (
                    <li className="calendar-more-events">+{dayEvents.length - 2} נוספים</li>
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <section className="calendar-day-panel">
        <h3>
          {selectedDateKey
            ? `אירועים ב-${new Date(`${selectedDateKey}T12:00:00`).toLocaleDateString("he-IL")}`
            : "בחרו יום בלוח השנה"}
        </h3>
        {selectedDateKey && selectedEvents.length === 0 && (
          <p className="muted">אין אירועים ביום זה.</p>
        )}
        {selectedEvents.length > 0 && (
          <ul className="list-plain">
            {selectedEvents.map((event) => (
              <li key={event.id}>
                <Link href={`/events/${event.id}`}>
                  <strong>{event.title}</strong>
                </Link>
                {event.event_time ? (
                  <span className="muted"> · {formatEventTime(event.event_time)}</span>
                ) : (
                  <span className="badge" style={{ marginInlineStart: "0.35rem" }}>
                    כל היום
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
