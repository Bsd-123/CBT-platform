import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchAuthenticatedProfile } from "@/lib/actions/auth";
import { fetchEventById, fetchEventComments } from "@/lib/data";
import { EventCommentForm } from "@/components/events/EventCommentForm";
import { EditEventForm, buildEditEventInitial } from "@/components/events/EditEventForm";
import { MaterialIcon } from "@/components/shared/MaterialIcon";
import { ReportForm } from "@/components/shared/ReportForm";
import { Disclosure } from "@/components/ui/Disclosure";
import { formatEventDate, formatEventTimeValue } from "@/lib/utils/calendar";
import { formatDate } from "@/lib/utils/format";

type EventPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;
  const auth = await fetchAuthenticatedProfile();
  const [event, comments] = await Promise.all([fetchEventById(id), fetchEventComments(id)]);

  if (!event) notFound();

  const isOwner = auth?.userId === event.user_id;
  const isAdmin = auth?.profile.role === "admin";

  return (
    <>
      <p>
        <Link href="/events">
          <MaterialIcon name="arrow_forward" /> חזרה לאירועים
        </Link>
      </p>

      <section className="ui-section">
        <h1>
          {event.title}{" "}
          {event.is_cancelled && (
            <span className="ui-badge" data-kind="danger">
              בוטל
            </span>
          )}
        </h1>
        <div className="thread-meta">
          <strong>{event.user?.full_name}</strong>
          {event.event_date && (
            <span>
              {formatEventDate(event.event_date)}
              {event.event_time && ` · ${formatEventTimeValue(event.event_time)}`}
            </span>
          )}
        </div>
        <p>{event.description}</p>
        <div className="thread-actions">
          {(isOwner || isAdmin) && (
            <Disclosure label="עריכת האירוע">
              <EditEventForm
                eventId={event.id}
                initial={buildEditEventInitial(event)}
                canCancel={isOwner || isAdmin}
              />
            </Disclosure>
          )}
          <ReportForm targetType="event" targetId={event.id} />
        </div>
      </section>

      <section className="ui-section">
        <h2>עדכונים ותגובות ({comments.length})</h2>
        <EventCommentForm eventId={event.id} />
      </section>

      {comments.length > 0 && (
        <ul className="thread-list">
          {comments.map((comment) => (
            <li key={comment.id} className="thread-card">
              <div className="thread-meta">
                <strong>{comment.user?.full_name}</strong>
                <span>{formatDate(comment.created_at)}</span>
              </div>
              <p>{comment.content}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
