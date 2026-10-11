import { EventsCalendar } from "@/components/events/EventsCalendar";
import { EventsViewNav } from "@/components/events/EventsViewNav";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHero } from "@/components/ui/PageHero";
import { fetchEvents } from "@/lib/data";
import { parseMonthParam, serializeCalendarEvents } from "@/lib/utils/calendar";

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
    <>
      <PageHero
        title="אירועים וסדנאות"
        subtitle="מוצגים רק אירועים עם תאריך שלא בוטלו. לחצו על יום לראות את כל אירועיו."
      />

      <EventsViewNav active="calendar" />

      {calendarEvents.length === 0 ? (
        <EmptyState
          icon="calendar_month"
          title="אין אירועים פעילים בלוח השנה"
          description="אירועים עם תאריך יופיעו כאן."
        />
      ) : (
        <section className="ui-section">
          <EventsCalendar
            events={calendarEvents}
            initialYear={initialYear}
            initialMonth={initialMonth}
          />
        </section>
      )}
    </>
  );
}
