import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchEventById, fetchEventComments } from "@/lib/actions";
import { fetchAuthenticatedProfile } from "@/lib/actions/auth";
import { EventCommentForm } from "@/components/events/EventCommentForm";
import { EditEventForm, buildEditEventInitial } from "@/components/events/EditEventForm";
import { ReportForm } from "@/components/shared/ReportForm";

type EventDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;
  const [event, comments, auth] = await Promise.all([
    fetchEventById(id),
    fetchEventComments(id),
    fetchAuthenticatedProfile(),
  ]);

  if (!event) notFound();

  const isOwner = auth?.userId === event.user_id;
  const isAdmin = auth?.profile.role === "admin";

  return (
    <div className="stack">
      <section className="card stack">
        <Link href="/events">← חזרה לאירועים</Link>
        <h1>{event.title}</h1>
        {event.is_cancelled && <span className="badge">בוטל</span>}
        <p className="muted">{event.user?.full_name}</p>
        <p>{event.description}</p>
        {event.event_date && (
          <p className="muted">
            {new Date(event.event_date).toLocaleDateString("he-IL")}
            {event.event_time &&
              ` · ${new Date(event.event_time).toLocaleTimeString("he-IL", {
                hour: "2-digit",
                minute: "2-digit",
              })}`}
          </p>
        )}
        <ReportForm targetType="event" targetId={event.id} />
      </section>

      {(isOwner || isAdmin) && (
        <section className="card">
          <EditEventForm
            eventId={event.id}
            initial={buildEditEventInitial(event)}
            canCancel={isOwner || isAdmin}
          />
        </section>
      )}

      <section className="card stack">
        <h2>עדכונים ותגובות ({comments.length})</h2>
        <EventCommentForm eventId={event.id} />
        <ul className="list-plain">
          {comments.map((comment) => (
            <li key={comment.id}>
              <p>{comment.content}</p>
              <p className="muted">{comment.user?.full_name}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
