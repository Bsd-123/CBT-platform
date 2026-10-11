import "server-only";
import { getEmailConfig, type EmailConfig } from "@/lib/email/config";
import { runInBackground } from "@/lib/email/dispatch";
import type { EventChange } from "@/lib/email/event-changes";
import {
  getDisplayName,
  getFavoriteUserIds,
  getRecipient,
  getRow,
  snapshotContent,
  type ContentSnapshot,
  type Recipient,
} from "@/lib/email/lookup";
import { sendEmail, sendEmails, type EmailMessage } from "@/lib/email/resend";
import {
  contentModeratedEmail,
  eventUpdatedEmail,
  forumAnswerEmail,
  materialResponseEmail,
  professionalCommentEmail,
  type EmailTemplate,
  type ModeratedKind,
  type ModerationAction,
} from "@/lib/email/templates";
import { logger } from "@/lib/logger";

/**
 * One function per kind of email. Each `notify…` call returns immediately: the lookups, the
 * rendering and the sending all happen after the response (see `runInBackground`). With email
 * not configured every call is a no-op. The `deliver…` functions hold the logic and are what the
 * tests exercise.
 */

const toMessage = (recipient: Recipient, template: EmailTemplate): EmailMessage => ({
  to: recipient.email,
  subject: template.subject,
  html: template.html,
  text: template.text,
});

/** Mails one member, unless they are the person who caused the notification. */
async function mailMember(
  config: EmailConfig,
  userId: string,
  actorId: string | null,
  build: (recipient: Recipient) => EmailTemplate,
  label: string,
): Promise<void> {
  if (actorId && userId === actorId) return;
  const recipient = await getRecipient(config, userId);
  if (!recipient) {
    logger.info("Email skipped: recipient has no address", { label, userId });
    return;
  }
  await sendEmail(config, toMessage(recipient, build(recipient)));
}

/* ---------- Replies to questions and requests ---------- */

export type ForumAnswerNotice = { questionId: string; answerId: string; authorId: string; content: string };

export async function deliverForumAnswer(config: EmailConfig, input: ForumAnswerNotice): Promise<void> {
  const question = await getRow<{ user_id: string; title: string }>(
    config,
    "forum_questions",
    input.questionId,
    "user_id, title",
  );
  if (!question) return;
  const answererName = (await getDisplayName(config, input.authorId)) ?? "חבר קהילה";

  await mailMember(
    config,
    question.user_id,
    input.authorId,
    (recipient) =>
      forumAnswerEmail({
        siteUrl: config.siteUrl,
        recipientName: recipient.name,
        answererName,
        questionTitle: question.title,
        questionId: input.questionId,
        answerId: input.answerId,
        content: input.content,
      }),
    "forum-answer",
  );
}

export type ProfessionalCommentNotice = { requestId: string; authorId: string; content: string };

export async function deliverProfessionalComment(
  config: EmailConfig,
  input: ProfessionalCommentNotice,
): Promise<void> {
  const request = await getRow<{ user_id: string; title: string }>(
    config,
    "professional_requests",
    input.requestId,
    "user_id, title",
  );
  if (!request) return;
  const commenterName = (await getDisplayName(config, input.authorId)) ?? "חבר קהילה";

  await mailMember(
    config,
    request.user_id,
    input.authorId,
    (recipient) =>
      professionalCommentEmail({
        siteUrl: config.siteUrl,
        recipientName: recipient.name,
        commenterName,
        requestTitle: request.title,
        requestId: input.requestId,
        content: input.content,
      }),
    "professional-comment",
  );
}

/* ---------- Fulfilled material requests ---------- */

export type MaterialResponseNotice = {
  requestId: string;
  responderId: string;
  text?: string | null;
  hasFile: boolean;
};

export async function deliverMaterialResponse(config: EmailConfig, input: MaterialResponseNotice): Promise<void> {
  const request = await getRow<{ user_id: string; title: string }>(
    config,
    "material_requests",
    input.requestId,
    "user_id, title",
  );
  if (!request) return;
  const responderName = (await getDisplayName(config, input.responderId)) ?? "חבר קהילה";

  await mailMember(
    config,
    request.user_id,
    input.responderId,
    (recipient) =>
      materialResponseEmail({
        siteUrl: config.siteUrl,
        recipientName: recipient.name,
        responderName,
        requestTitle: request.title,
        requestId: input.requestId,
        text: input.text,
        hasFile: input.hasFile,
      }),
    "material-response",
  );
}

/* ---------- Favorited events ---------- */

export type EventUpdateNotice = {
  eventId: string;
  editorId: string;
  changes: EventChange[];
};

const LOOKUP_CONCURRENCY = 10;

export async function deliverEventUpdate(config: EmailConfig, input: EventUpdateNotice): Promise<void> {
  if (input.changes.length === 0) return;

  const event = await getRow<{
    title: string;
    description: string;
    event_date: string | null;
    event_time: string | null;
    is_cancelled: boolean;
    is_hidden: boolean;
  }>(config, "events", input.eventId, "title, description, event_date, event_time, is_cancelled, is_hidden");
  if (!event || event.is_hidden) return;

  const userIds = (await getFavoriteUserIds(config, input.eventId)).filter((id) => id !== input.editorId);
  if (userIds.length === 0) return;

  const messages: EmailMessage[] = [];
  for (let start = 0; start < userIds.length; start += LOOKUP_CONCURRENCY) {
    const recipients = await Promise.all(
      userIds.slice(start, start + LOOKUP_CONCURRENCY).map((id) => getRecipient(config, id)),
    );
    for (const recipient of recipients) {
      if (!recipient) continue;
      messages.push(
        toMessage(
          recipient,
          eventUpdatedEmail({
            siteUrl: config.siteUrl,
            recipientName: recipient.name,
            eventId: input.eventId,
            title: event.title,
            description: event.description,
            event_date: event.event_date,
            event_time: event.event_time,
            is_cancelled: event.is_cancelled,
            changes: input.changes,
          }),
        ),
      );
    }
  }

  const accepted = await sendEmails(config, messages);
  logger.info("Event update emails sent", { eventId: input.eventId, recipients: messages.length, accepted });
}

/* ---------- Moderation ---------- */

export type ModerationNotice = {
  ownerId: string;
  actorId: string;
  kind: ModeratedKind;
  action: ModerationAction;
  title?: string | null;
  excerpt?: string | null;
  reason?: string | null;
};

export async function deliverModeration(config: EmailConfig, input: ModerationNotice): Promise<void> {
  await mailMember(
    config,
    input.ownerId,
    input.actorId,
    (recipient) =>
      contentModeratedEmail({
        siteUrl: config.siteUrl,
        recipientName: recipient.name,
        kind: input.kind,
        action: input.action,
        title: input.title,
        excerpt: input.excerpt,
        reason: input.reason,
      }),
    "moderation",
  );
}

/* ---------- Public, non-blocking entry points ---------- */

function enqueue<T>(label: string, input: T, deliver: (config: EmailConfig, input: T) => Promise<void>): void {
  const config = getEmailConfig();
  if (!config) return;
  runInBackground(label, () => deliver(config, input));
}

export const notifyForumAnswer = (input: ForumAnswerNotice) => enqueue("forum-answer", input, deliverForumAnswer);
export const notifyProfessionalComment = (input: ProfessionalCommentNotice) =>
  enqueue("professional-comment", input, deliverProfessionalComment);
export const notifyMaterialResponse = (input: MaterialResponseNotice) =>
  enqueue("material-response", input, deliverMaterialResponse);
export const notifyEventUpdate = (input: EventUpdateNotice) => enqueue("event-update", input, deliverEventUpdate);
export const notifyContentModerated = (input: ModerationNotice) => enqueue("moderation", input, deliverModeration);

/**
 * Captures who wrote a piece of content before an admin hides or deletes it. Returns null (and
 * does no lookup) when email is off, so moderation never pays for a feature that is not in use.
 */
export async function captureModerationTarget(
  kind: ModeratedKind,
  id: string,
): Promise<ContentSnapshot | null> {
  const config = getEmailConfig();
  if (!config) return null;
  try {
    return await snapshotContent(config, kind, id);
  } catch (error) {
    logger.warn("Could not read content before moderation", { kind, id, error });
    return null;
  }
}
