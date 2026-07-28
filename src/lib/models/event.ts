import type { Event, EventComment } from "@prisma/client";
import { pickPublicUserFields } from "@/lib/models/user";

export type { Event, EventComment };

export type CreateEventInput = {
  user_id: string;
  title: string;
  description: string;
  event_date?: Date | null;
  event_time?: Date | null;
};

export type UpdateEventInput = {
  title?: string;
  description?: string;
  event_date?: Date | null;
  event_time?: Date | null;
  is_cancelled?: boolean;
};

export type ListEventsFilter = {
  user_id?: string;
  calendar_only?: boolean;
  include_hidden?: boolean;
};

export type CreateEventCommentInput = {
  event_id: string;
  user_id: string;
  content: string;
};

export function pickPublicEventFields(
  event: Event & {
    user?: Parameters<typeof pickPublicUserFields>[0];
    comments?: Parameters<typeof pickPublicEventCommentFields>[0][];
  },
) {
  return {
    id: event.id,
    user_id: event.user_id,
    title: event.title,
    description: event.description,
    event_date: event.event_date,
    event_time: event.event_time,
    is_cancelled: event.is_cancelled,
    created_at: event.created_at,
    user: event.user ? pickPublicUserFields(event.user) : undefined,
    comments: event.comments?.map(pickPublicEventCommentFields),
  };
}

export function pickPublicEventCommentFields(
  comment: EventComment & {
    user?: Parameters<typeof pickPublicUserFields>[0];
  },
) {
  return {
    id: comment.id,
    event_id: comment.event_id,
    user_id: comment.user_id,
    content: comment.content,
    created_at: comment.created_at,
    user: comment.user ? pickPublicUserFields(comment.user) : undefined,
  };
}

export type PublicEvent = ReturnType<typeof pickPublicEventFields>;
export type PublicEventComment = ReturnType<typeof pickPublicEventCommentFields>;
