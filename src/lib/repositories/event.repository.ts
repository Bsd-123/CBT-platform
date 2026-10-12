import "server-only";
import type {
  CreateEventCommentInput,
  CreateEventInput,
  ListEventsFilter,
  PublicEvent,
  PublicEventComment,
  UpdateEventInput,
} from "@/lib/models/event";
import { pickPublicEventCommentFields, pickPublicEventFields } from "@/lib/models/event";
import { toDbDate, toDbTime } from "@/lib/db/convert";
import { countOf, getDb, row, rows } from "@/lib/db/client";
import type { Event, EventComment, User } from "@/lib/db/types";

type CommentRow = EventComment & { user: User };
type EventRow = Event & { user: User; comments: CommentRow[] };

// `events_user_id_fkey` names the organizer: event_favorites also links events and users, so a bare
// `users(*)` embed would be ambiguous.
const EVENT_SELECT = "*, user:users!events_user_id_fkey(*), comments:event_comments(*, user:users(*))";

function withSortedComments(event: EventRow): EventRow {
  return {
    ...event,
    comments: [...event.comments].sort((a, b) => a.created_at.getTime() - b.created_at.getTime()),
  };
}

export async function getEventById(id: string, include_hidden = false): Promise<PublicEvent | null> {
  const db = await getDb();
  let query = db.from("events").select(EVENT_SELECT).eq("id", id);
  if (!include_hidden) query = query.eq("is_hidden", false);
  const event = row<EventRow>(await query.maybeSingle());
  return event ? pickPublicEventFields(withSortedComments(event)) : null;
}

export async function listEvents(filter: ListEventsFilter = {}): Promise<PublicEvent[]> {
  const db = await getDb();
  let query = db.from("events").select(EVENT_SELECT);
  if (!filter.include_hidden) query = query.eq("is_hidden", false);
  if (filter.user_id) query = query.eq("user_id", filter.user_id);
  if (filter.calendar_only) query = query.not("event_date", "is", null).eq("is_cancelled", false);
  if (filter.from_date) query = query.gte("event_date", filter.from_date);
  query = query.order("event_date", { ascending: true }).order("event_time", { ascending: true });
  if (filter.take !== undefined) {
    const skip = filter.skip ?? 0;
    query = query.range(skip, skip + filter.take - 1);
  }
  return rows<EventRow>(await query).map((event) => pickPublicEventFields(withSortedComments(event)));
}

export async function countEvents(filter: ListEventsFilter = {}): Promise<number> {
  const db = await getDb();
  let query = db.from("events").select("id", { count: "exact", head: true });
  if (!filter.include_hidden) query = query.eq("is_hidden", false);
  if (filter.user_id) query = query.eq("user_id", filter.user_id);
  if (filter.calendar_only) query = query.not("event_date", "is", null).eq("is_cancelled", false);
  return countOf(await query);
}

export async function createEvent(input: CreateEventInput): Promise<PublicEvent> {
  const db = await getDb();
  const event = row<EventRow>(
    await db
      .from("events")
      .insert({
        user_id: input.user_id,
        title: input.title,
        description: input.description,
        event_date: toDbDate(input.event_date) ?? null,
        event_time: toDbTime(input.event_time) ?? null,
      })
      .select(EVENT_SELECT)
      .single(),
  );
  return pickPublicEventFields(withSortedComments(event!));
}

/** Only the owner or an admin may edit (Row Level Security); `is_hidden` is not editable here. */
export async function updateEvent(id: string, input: UpdateEventInput): Promise<PublicEvent> {
  const db = await getDb();
  const changes = {
    ...(input.title !== undefined && { title: input.title }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.event_date !== undefined && { event_date: toDbDate(input.event_date) }),
    ...(input.event_time !== undefined && { event_time: toDbTime(input.event_time) }),
    ...(input.is_cancelled !== undefined && { is_cancelled: input.is_cancelled }),
  };

  const event = row<EventRow>(
    await db.from("events").update(changes).eq("id", id).select(EVENT_SELECT).maybeSingle(),
  );
  if (!event) throw new Error("Forbidden");
  return pickPublicEventFields(withSortedComments(event));
}

/** The event owner is notified by a database trigger. */
export async function createEventComment(input: CreateEventCommentInput): Promise<PublicEventComment> {
  const db = await getDb();
  const exists = countOf(
    await db
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("id", input.event_id)
      .eq("is_hidden", false),
  );
  if (exists === 0) throw new Error("Event not found.");

  const comment = row<CommentRow>(
    await db
      .from("event_comments")
      .insert({ event_id: input.event_id, user_id: input.user_id, content: input.content })
      .select("*, user:users(*)")
      .single(),
  );
  return pickPublicEventCommentFields(comment!);
}

export async function listEventComments(event_id: string): Promise<PublicEventComment[]> {
  const db = await getDb();
  const comments = rows<CommentRow>(
    await db
      .from("event_comments")
      .select("*, user:users(*)")
      .eq("event_id", event_id)
      .order("created_at", { ascending: true }),
  );
  return comments.map(pickPublicEventCommentFields);
}
