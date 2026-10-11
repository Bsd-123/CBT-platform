import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchAuthenticatedProfile } from "@/lib/actions/auth";
import { fetchEventById, fetchEventComments, fetchIsEventFavorited } from "@/lib/data";
import { EventCommentForm } from "@/components/events/EventCommentForm";
import { EditEventForm } from "@/components/events/EditEventForm";
import { FavoriteEventButton } from "@/components/events/FavoriteEventButton";
import { MaterialIcon } from "@/components/shared/MaterialIcon";
import { ReportForm } from "@/components/shared/ReportForm";
import { Disclosure } from "@/components/ui/Disclosure";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { formatEventDate, formatEventTimeValue } from "@/lib/utils/calendar";
import { buildEditEventInitial } from "@/lib/utils/event-form";
import { countLabel, formatDate } from "@/lib/utils/format";
import { isUuid } from "@/lib/utils/ids";

type EventPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const auth = await fetchAuthenticatedProfile();
  const isAdmin = auth?.profile.role === "admin";
  const [event, comments] = await Promise.all([fetchEventById(id, isAdmin), fetchEventComments(id)]);

  if (!event) notFound();

  const isOwner = auth?.userId === event.user_id;
  const isFavorited = auth ? await fetchIsEventFavorited(auth.userId, event.id) : false;

  // Same date treatment as the published-events card on the profile page.
  const eventDate = event.event_date ? new Date(event.event_date) : null;
  const monthLabel = eventDate
    ? eventDate.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase()
    : "—";
  const dayLabel = eventDate ? String(eventDate.getUTCDate()) : "—";

  return (
    <div className="event-page">
      <p>
        <Link href="/events" className="ui-link-btn">
          <MaterialIcon name="arrow_forward" /> חזרה לאירועים
        </Link>
      </p>

      {event.is_hidden && (
        <p className="banner-warning" role="status">
          האירוע מוסתר ואינו מוצג למשתמשים. רק מנהלים רואים אותו.
        </p>
      )}

      <article
        className={`event-card${event.is_cancelled ? " event-card--cancelled" : ""}`}
        aria-labelledby="event-title"
      >
        <div className="event-date-panel">
          <div>
            <p className="event-date-month">{monthLabel}</p>
            <p className="event-date-day">{dayLabel}</p>
          </div>
          {event.event_time && (
            <p className="event-date-time">
              <MaterialIcon name="schedule" />
              {formatEventTimeValue(event.event_time)}
            </p>
          )}
        </div>

        <div className="event-body">
          <div>
            <span className="event-badge">סדנה / אירוע</span>
            <h1 id="event-title" className="event-title">
              {event.title}
              {event.is_cancelled && <span className="event-cancelled-badge">בוטל</span>}
            </h1>
            <div className="event-meta">
              <span className="event-meta-item">
                <MaterialIcon name="person" />
                {event.user?.full_name ?? "משתמש"}
              </span>
              {event.event_date && (
                <span className="event-meta-item">
                  <MaterialIcon name="event" />
                  {formatEventDate(event.event_date)}
                </span>
              )}
            </div>
            <p className="event-desc">{event.description}</p>
          </div>

          <div className="event-footer">
            <span className="event-participants">
              <MaterialIcon name="forum" />
              {countLabel(comments.length, "תגובה", "תגובות")}
            </span>
            <div className="event-actions">
              {auth && <FavoriteEventButton eventId={event.id} initialFavorited={isFavorited} />}
              <ReportForm targetType="event" targetId={event.id} />
            </div>
          </div>
        </div>
      </article>

      {(isOwner || isAdmin) && (
        <div className="event-section">
          <Disclosure label="עריכת האירוע">
            <EditEventForm
              eventId={event.id}
              initial={buildEditEventInitial(event)}
              canCancel={isOwner || isAdmin}
            />
          </Disclosure>
        </div>
      )}

      <section className="event-discussion" aria-labelledby="event-discussion-title">
        <div className="event-section">
          <h2 id="event-discussion-title">עדכונים ותגובות ({comments.length})</h2>
          <EventCommentForm eventId={event.id} />
        </div>

        {comments.length > 0 && (
          <ul className="event-comments">
            {comments.map((comment) => (
              <li key={comment.id} className="event-comment">
                <UserAvatar name={comment.user?.full_name} size="md" />
                <div>
                  <div className="event-comment-head">
                    <strong>{comment.user?.full_name ?? "משתמש"}</strong>
                    <time dateTime={comment.created_at.toISOString()}>{formatDate(comment.created_at)}</time>
                  </div>
                  <p>{comment.content}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
