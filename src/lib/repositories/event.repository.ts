import type {
  CreateEventCommentInput,
  CreateEventInput,
  ListEventsFilter,
  PublicEvent,
  PublicEventComment,
  UpdateEventInput,
} from "@/lib/models/event";
import {
  pickPublicEventCommentFields,
  pickPublicEventFields,
} from "@/lib/models/event";
import { prisma } from "@/lib/db";
import { notifyContentComment } from "@/lib/services/notifications";
import { visibleContentWhere } from "@/lib/db/visibility";

const eventInclude = {
  user: true,
  comments: { include: { user: true }, orderBy: { created_at: "asc" as const } },
} as const;

function buildEventsWhere(filter: ListEventsFilter) {
  return {
    ...visibleContentWhere(filter.include_hidden),
    ...(filter.user_id && { user_id: filter.user_id }),
    ...(filter.calendar_only && {
      event_date: { not: null },
      is_cancelled: false,
    }),
  };
}

export async function getEventById(
  id: string,
  include_hidden = false,
): Promise<PublicEvent | null> {
  const event = await prisma.event.findFirst({
    where: { id, ...visibleContentWhere(include_hidden) },
    include: eventInclude,
  });
  return event ? pickPublicEventFields(event) : null;
}

export async function listEvents(
  filter: ListEventsFilter = {},
): Promise<PublicEvent[]> {
  const events = await prisma.event.findMany({
    where: buildEventsWhere(filter),
    include: eventInclude,
    orderBy: [{ event_date: "asc" }, { event_time: "asc" }],
  });
  return events.map(pickPublicEventFields);
}

export async function createEvent(input: CreateEventInput): Promise<PublicEvent> {
  const event = await prisma.event.create({
    data: input,
    include: eventInclude,
  });
  return pickPublicEventFields(event);
}

export async function updateEvent(
  id: string,
  input: UpdateEventInput,
): Promise<PublicEvent> {
  const event = await prisma.event.update({
    where: { id },
    data: input,
    include: eventInclude,
  });
  return pickPublicEventFields(event);
}

export async function createEventComment(
  input: CreateEventCommentInput,
): Promise<PublicEventComment> {
  const event = await prisma.event.findUnique({
    where: { id: input.event_id },
  });

  if (!event) {
    throw new Error("Event not found.");
  }

  const comment = await prisma.eventComment.create({
    data: input,
    include: { user: true },
  });

  await notifyContentComment(
    event.user_id,
    "event",
    event.id,
    input.user_id,
  );

  return pickPublicEventCommentFields(comment);
}

export async function listEventComments(
  event_id: string,
): Promise<PublicEventComment[]> {
  const comments = await prisma.eventComment.findMany({
    where: { event_id },
    include: { user: true },
    orderBy: { created_at: "asc" },
  });
  return comments.map(pickPublicEventCommentFields);
}
