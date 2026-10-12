import type { EventChange } from "@/lib/email/event-changes";
import { previewText, renderEmail, type RenderedEmail } from "@/lib/email/layout";
import { formatEventDate, formatEventTimeValue } from "@/lib/utils/calendar";

export type EmailTemplate = RenderedEmail & { subject: string };

const greeting = (name: string | null | undefined) => (name?.trim() ? `שלום ${name.trim()},` : "שלום,");

const url = (siteUrl: string, path: string) => `${siteUrl}${path}`;

/* ---------- Replies to questions and requests ---------- */

export function forumAnswerEmail(input: {
  siteUrl: string;
  recipientName?: string | null;
  answererName: string;
  questionTitle: string;
  questionId: string;
  answerId: string;
  content: string;
}): EmailTemplate {
  const heading = "התקבלה תשובה לשאלה שלך";
  return {
    subject: `תשובה חדשה לשאלה: ${previewText(input.questionTitle, 80)}`,
    ...renderEmail({
      preheader: `התקבלה תשובה חדשה מאת ${input.answererName} על השאלה שלך בפורום`,
      heading,
      greeting: greeting(input.recipientName),
      blocks: [
        { kind: "paragraph", text: `התקבלה תשובה חדשה מאת ${input.answererName} לשאלה "${previewText(input.questionTitle, 120)}":` },
        { kind: "quote", text: previewText(input.content), byline: input.answererName },
      ],
      cta: { label: "לצפייה בתשובה", url: url(input.siteUrl, `/forum/${input.questionId}#answer-${input.answerId}`) },
    }),
  };
}

export function professionalCommentEmail(input: {
  siteUrl: string;
  recipientName?: string | null;
  commenterName: string;
  requestTitle: string;
  requestId: string;
  content: string;
}): EmailTemplate {
  return {
    subject: `תגובה חדשה לפנייה: ${previewText(input.requestTitle, 80)}`,
    ...renderEmail({
      preheader: `התקבלה תגובה חדשה מאת ${input.commenterName} לפנייה המקצועית שלך`,
      heading: "התקבלה תגובה לפנייה שלך",
      greeting: greeting(input.recipientName),
      blocks: [
        { kind: "paragraph", text: `התקבלה תגובה חדשה מאת ${input.commenterName} לפנייה "${previewText(input.requestTitle, 120)}":` },
        { kind: "quote", text: previewText(input.content), byline: input.commenterName },
      ],
      cta: { label: "לצפייה בפנייה", url: url(input.siteUrl, `/professional-requests/${input.requestId}`) },
    }),
  };
}

/* ---------- Material requests ---------- */

export function materialResponseEmail(input: {
  siteUrl: string;
  recipientName?: string | null;
  responderName: string;
  requestTitle: string;
  requestId: string;
  text?: string | null;
  hasFile: boolean;
}): EmailTemplate {
  const blocks: Parameters<typeof renderEmail>[0]["blocks"] = [
    {
      kind: "paragraph",
      text: input.hasFile
        ? `חומר חדש הועלה על ידי ${input.responderName} בתגובה לבקשה שלך "${previewText(input.requestTitle, 120)}".`
        : `התקבלה תגובה מאת ${input.responderName} לבקשת החומר שלך "${previewText(input.requestTitle, 120)}".`,
    },
  ];
  if (input.text?.trim()) {
    blocks.push({ kind: "quote", text: previewText(input.text), byline: input.responderName });
  }

  return {
    subject: input.hasFile
      ? `חומר חדש לבקשה שלך: ${previewText(input.requestTitle, 80)}`
      : `תגובה חדשה לבקשת החומר: ${previewText(input.requestTitle, 80)}`,
    ...renderEmail({
      preheader: input.hasFile ? "הועלה חומר שעונה על הבקשה שלך" : "התקבלה תגובה לבקשת החומר שלך",
      heading: input.hasFile ? "הבקשה שלך נענתה" : "התקבלה תגובה לבקשת החומר",
      greeting: greeting(input.recipientName),
      blocks,
      cta: { label: input.hasFile ? "לצפייה והורדה" : "לצפייה בתגובה", url: url(input.siteUrl, `/materials/requests/${input.requestId}`) },
    }),
  };
}

/* ---------- Favorited events ---------- */

export function eventUpdatedEmail(input: {
  siteUrl: string;
  recipientName?: string | null;
  eventId: string;
  title: string;
  description: string;
  event_date: Date | string | null;
  event_time: Date | string | null;
  is_cancelled: boolean;
  changes: EventChange[];
}): EmailTemplate {
  const cancelled = input.is_cancelled && input.changes.some((change) => change.field === "status");
  const heading = cancelled ? "אירוע שסימנת בוטל" : "אירוע שסימנת התעדכן";

  return {
    subject: cancelled ? `האירוע בוטל: ${previewText(input.title, 80)}` : `עדכון באירוע: ${previewText(input.title, 80)}`,
    ...renderEmail({
      preheader: cancelled ? "המארגנים ביטלו את האירוע" : `עודכנו ${input.changes.length} פרטים באירוע`,
      heading,
      greeting: greeting(input.recipientName),
      blocks: [
        {
          kind: "paragraph",
          text: cancelled
            ? `המארגנים ביטלו את האירוע "${input.title}" שהוספתם למועדפים.`
            : `המארגנים עדכנו את האירוע "${input.title}" שהוספתם למועדפים. אלו השינויים:`,
        },
        { kind: "changes", rows: input.changes.map(({ label, before, after }) => ({ label, before, after })) },
        { kind: "paragraph", text: "הפרטים העדכניים:" },
        {
          kind: "details",
          rows: [
            { label: "אירוע", value: input.title },
            { label: "תאריך", value: input.event_date ? formatEventDate(input.event_date) : "לא צוין" },
            { label: "שעה", value: input.event_time ? formatEventTimeValue(input.event_time) : "לא צוין" },
            { label: "סטטוס", value: input.is_cancelled ? "בוטל" : "פעיל" },
          ],
        },
      ],
      cta: { label: "לדף האירוע", url: url(input.siteUrl, `/events/${input.eventId}`) },
      note: "קיבלתם הודעה זו כי הוספתם את האירוע למועדפים. אפשר להסיר אותו מהמועדפים בדף האירוע.",
    }),
  };
}

/* ---------- Moderation ---------- */

export type ModerationAction = "hidden" | "deleted" | "rejected";

const KIND_LABELS = {
  material: "החומר",
  forum_question: "השאלה",
  forum_answer: "התשובה",
  recommendation: "ההמלצה",
  event: "האירוע",
  professional_request: "הפנייה המקצועית",
} as const;

export type ModeratedKind = keyof typeof KIND_LABELS;

export const DEFAULT_MODERATION_REASON = "התוכן אינו עומד בהנחיות הקהילה.";

export function contentModeratedEmail(input: {
  siteUrl: string;
  recipientName?: string | null;
  kind: ModeratedKind;
  action: ModerationAction;
  title?: string | null;
  excerpt?: string | null;
  reason?: string | null;
}): EmailTemplate {
  const label = KIND_LABELS[input.kind];
  const what = input.title?.trim() || (input.excerpt ? previewText(input.excerpt, 80) : label);
  const outcome =
    input.action === "rejected"
      ? `${label} שהעליתם לא אושר לפרסום.`
      : input.action === "deleted"
        ? `${label} שפרסמתם הוסר מהקהילה.`
        : `${label} שפרסמתם הוסתר מהקהילה.`;

  const blocks: Parameters<typeof renderEmail>[0]["blocks"] = [
    { kind: "paragraph", text: "תודה שאתם חלק מהקהילה שלנו. אנחנו כותבים אליכם כי הצוות בדק תוכן שפרסמתם:" },
    { kind: "details", rows: [{ label: "התוכן", value: what }, { label: "מה קרה", value: outcome }] },
    { kind: "quote", text: input.reason?.trim() || DEFAULT_MODERATION_REASON, byline: "הסיבה" },
    {
      kind: "paragraph",
      text: "אנחנו שומרים על קהילה מקצועית, מכבדת ובטוחה לכל חברות וחברי הקהילה. נשמח אם בפעם הבאה תקפידו על הנחיות הקהילה: שיח מכבד ומכבד־ערכים, שמירה על פרטיות מטופלים, ותוכן מקצועי ורלוונטי.",
    },
    { kind: "paragraph", text: "אם לדעתכם מדובר בטעות, אפשר לפנות אלינו ונשמח לבדוק שוב." },
  ];

  return {
    subject: input.action === "rejected" ? "עדכון לגבי החומר שהעליתם" : "עדכון לגבי תוכן שפרסמתם",
    ...renderEmail({
      preheader: "הצוות בדק תוכן שפרסמתם בקהילה",
      heading: "עדכון לגבי התוכן שפרסמתם",
      greeting: greeting(input.recipientName),
      blocks,
      cta: { label: "חזרה לקהילה", url: input.siteUrl },
    }),
  };
}
