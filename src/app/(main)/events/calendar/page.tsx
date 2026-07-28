import Link from "next/link";
import { fetchEvents } from "@/lib/actions";
import { EventsCalendar } from "@/components/events/EventsCalendar";
import { EventsViewNav } from "@/components/events/EventsViewNav";
import {
  parseMonthParam,
  serializeCalendarEvents,
} from "@/lib/utils/calendar";

type EventsCalendarPageProps = {
  searchParams: Promise<{ month?: string }>;
};

export default async function EventsCalendarPage({ searchParams }: EventsCalendarPageProps) {
  const { month } = await searchParams;
  const events = await fetchEvents({ calendar_only: true });
  const calendarEvents = serializeCalendarEvents(events);

  const now = new Date();
  const parsedMonth = parseMonthParam(month);
  const initialYear = parsedMonth?.year ?? now.getFullYear();
  const initialMonth = parsedMonth?.month ?? now.getMonth() + 1;

  return (
    <div className="stack">
      <section className="card">
        <Link href="/events">← חזרה לאירועים</Link>
        <h1>לוח שנה — אירועים וסדנאות</h1>
        <p className="muted">
          מוצגים רק אירועים עם תאריך שלא בוטלו. לחצו על יום לראות את כל האירועים שלו.
        </p>
        <EventsViewNav active="calendar" />
      </section>

      <section className="card">
        {calendarEvents.length === 0 ? (
          <p className="muted">אין אירועים פעילים בלוח השנה.</p>
        ) : (
          <EventsCalendar
            events={calendarEvents}
            initialYear={initialYear}
            initialMonth={initialMonth}
          />
        )}
      </section>
    </div>
  );
}
