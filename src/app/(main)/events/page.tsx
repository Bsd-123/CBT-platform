import { CreateEventForm } from "@/components/events/CreateEventForm";
import { EventsViewNav } from "@/components/events/EventsViewNav";
import { ContentCard } from "@/components/ui/ContentCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ModalButton } from "@/components/ui/Modal";
import { PageHero } from "@/components/ui/PageHero";
import { fetchEvents } from "@/lib/data";
import { formatEventTimeValue } from "@/lib/utils/calendar";
import { countLabel } from "@/lib/utils/format";

function DateBadge({ value }: { value: Date | string }) {
  const date = new Date(value);
  const month = date.toLocaleDateString("he-IL", { month: "short", timeZone: "UTC" });
  return (
    <div className="ui-date-badge" aria-hidden="true">
      <strong>{date.getUTCDate()}</strong>
      <span>{month}</span>
    </div>
  );
}

export default async function EventsPage() {
  const events = await fetchEvents();

  return (
    <>
      <PageHero
        title="אירועים וסדנאות"
        subtitle="עדכונים על אירועים מקצועיים. עדכונים מתפרסמים כתגובות."
        actions={
          <ModalButton label="אירוע חדש" icon="add" title="יצירת אירוע / סדנה">
            <CreateEventForm />
          </ModalButton>
        }
      />

      <EventsViewNav active="list" />

      {events.length === 0 ? (
        <EmptyState
          icon="event"
          title="עדיין לא פורסמו אירועים"
          description="פרסמו סדנה או אירוע מקצועי לקהילה."
        />
      ) : (
        <ul className="ui-list">
          {events.map((event) => (
            <li key={event.id}>
              <ContentCard
                href={`/events/${event.id}`}
                title={event.title}
                excerpt={event.description}
                author={event.user?.full_name}
                leading={event.event_date ? <DateBadge value={event.event_date} /> : undefined}
                badges={
                  event.is_cancelled ? (
                    <span className="ui-badge" data-kind="danger">
                      בוטל
                    </span>
                  ) : undefined
                }
                stats={[
                  ...(event.event_time
                    ? [{ icon: "schedule", label: formatEventTimeValue(event.event_time) }]
                    : []),
                  {
                    icon: "chat_bubble",
                    label: countLabel(event.comments?.length ?? 0, "עדכון", "עדכונים"),
                  },
                ]}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
