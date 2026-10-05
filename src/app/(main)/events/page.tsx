import Link from "next/link";
import { fetchEvents } from "@/lib/data";
import { CreateEventForm } from "@/components/events/CreateEventForm";
import { EventsViewNav } from "@/components/events/EventsViewNav";

export default async function EventsPage() {
  const [allEvents, calendarEvents] = await Promise.all([
    fetchEvents(),
    fetchEvents({ calendar_only: true }),
  ]);

  return (
    <div className="stack">
      <section className="card">
        <h1>אירועים וסדנאות</h1>
        <p className="muted">עדכוני אירועים מתפרסמים כתגובות שטוחות.</p>
        <EventsViewNav active="list" />
      </section>

      <section className="card">
        <CreateEventForm />
      </section>

      <section className="card stack">
        <h2>כל האירועים ({allEvents.length})</h2>
        {allEvents.length === 0 ? (
          <p className="muted">עדיין לא פורסמו אירועים.</p>
        ) : (
          <ul className="list-plain">
            {allEvents.map((event) => (
              <li key={event.id}>
                <Link href={`/events/${event.id}`}>
                  <strong>{event.title}</strong>
                </Link>
                {event.is_cancelled && <span className="badge"> בוטל</span>}
                <p className="muted">{event.description}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card stack">
        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
          <h2>אירועים בלוח השנה ({calendarEvents.length})</h2>
          <Link href="/events/calendar" className="button secondary">
            פתיחת לוח שנה
          </Link>
        </div>
        {calendarEvents.length === 0 ? (
          <p className="muted">אין אירועים פעילים בלוח השנה.</p>
        ) : (
          <ul className="list-plain">
            {calendarEvents.map((event) => (
              <li key={event.id}>
                <Link href={`/events/${event.id}`}>
                  <strong>{event.title}</strong>
                </Link>
                {event.event_date && (
                  <span className="muted">
                    {" "}
                    — {new Date(event.event_date).toLocaleDateString("he-IL")}
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
