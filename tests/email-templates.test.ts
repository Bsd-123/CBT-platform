import { describe, expect, it } from "vitest";
import { diffEvent } from "@/lib/email/event-changes";
import { escapeHtml, previewText, renderEmail } from "@/lib/email/layout";
import {
  DEFAULT_MODERATION_REASON,
  contentModeratedEmail,
  eventUpdatedEmail,
  forumAnswerEmail,
  materialResponseEmail,
  professionalCommentEmail,
} from "@/lib/email/templates";

const SITE = "https://cbt.example.com";

describe("email layout", () => {
  it("is a right-to-left, responsive, table-based document with a hidden preheader", () => {
    const { html } = renderEmail({ preheader: "תצוגה מקדימה", heading: "כותרת", blocks: [] });
    expect(html).toContain('lang="he" dir="rtl"');
    expect(html).toContain('name="viewport"');
    expect(html).toContain("@media only screen and (max-width:480px)");
    expect(html).toContain("display:none");
    expect(html).toContain("תצוגה מקדימה");
    expect(html).toContain("קהילת מטפלי CBT");
  });

  it("escapes user text everywhere so a post cannot inject markup", () => {
    const evil = `<script>alert(1)</script> "quoted" & <img src=x onerror=1>`;
    const { html, text } = renderEmail({
      preheader: evil,
      heading: evil,
      greeting: evil,
      blocks: [
        { kind: "paragraph", text: evil },
        { kind: "quote", text: evil, byline: evil },
        { kind: "details", rows: [{ label: evil, value: evil }] },
        { kind: "changes", rows: [{ label: evil, before: evil, after: evil }] },
      ],
      cta: { label: evil, url: `https://x.test/?a="b"&c=<d>` },
      note: evil,
    });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&quot;");
    // the plain-text part is not HTML, so it keeps the original characters
    expect(text).toContain("<script>");
  });

  it("escapeHtml handles all five special characters", () => {
    expect(escapeHtml(`<>&"'`)).toBe("&lt;&gt;&amp;&quot;&#39;");
  });

  it("previewText flattens whitespace and truncates with an ellipsis", () => {
    expect(previewText("a  b\n\nc")).toBe("a b c");
    const long = previewText("x".repeat(500), 100);
    expect(long.length).toBe(101);
    expect(long.endsWith("…")).toBe(true);
  });

  it("includes a button, a fallback link and a plain-text alternative", () => {
    const { html, text } = renderEmail({
      preheader: "p",
      heading: "h",
      blocks: [{ kind: "paragraph", text: "גוף" }],
      cta: { label: "פתיחה", url: `${SITE}/x` },
    });
    expect(html).toContain(`href="${SITE}/x"`);
    expect(html).toContain("אם הכפתור לא נפתח");
    expect(text).toContain(`פתיחה: ${SITE}/x`);
  });
});

describe("email templates", () => {
  it("forum answer: previews the answer and links to it", () => {
    const mail = forumAnswerEmail({
      siteUrl: SITE,
      recipientName: "נועה",
      answererName: "דני",
      questionTitle: "איך בונים היררכיה?",
      questionId: "q1",
      answerId: "a1",
      content: "מומלץ להתחיל בחשיפה קצרה.",
    });
    expect(mail.subject).toContain("איך בונים היררכיה?");
    expect(mail.html).toContain("שלום נועה,");
    expect(mail.html).toContain("מומלץ להתחיל בחשיפה קצרה.");
    expect(mail.html).toContain(`href="${SITE}/forum/q1#answer-a1"`);
  });

  it("professional request: links to the request", () => {
    const mail = professionalCommentEmail({
      siteUrl: SITE,
      commenterName: "דני",
      requestTitle: "בקשה",
      requestId: "r1",
      content: "תגובה",
    });
    expect(mail.html).toContain(`href="${SITE}/professional-requests/r1"`);
    expect(mail.html).toContain("שלום,");
  });

  it("material request: says when a file was uploaded", () => {
    const withFile = materialResponseEmail({
      siteUrl: SITE, responderName: "דני", requestTitle: "דף עבודה", requestId: "m1", hasFile: true,
    });
    const textOnly = materialResponseEmail({
      siteUrl: SITE, responderName: "דני", requestTitle: "דף עבודה", requestId: "m1", hasFile: false, text: "ראו קישור",
    });
    expect(withFile.subject).toContain("חומר חדש");
    expect(withFile.html).toContain(`href="${SITE}/materials/requests/m1"`);
    expect(textOnly.subject).toContain("תגובה חדשה");
    expect(textOnly.html).toContain("ראו קישור");
  });

  it("moderation: states the outcome, the reason and asks for guideline adherence", () => {
    const mail = contentModeratedEmail({
      siteUrl: SITE, kind: "forum_question", action: "hidden", title: "שאלה", reason: "כולל פרטי מטופל",
    });
    expect(mail.html).toContain("הוסתר");
    expect(mail.html).toContain("כולל פרטי מטופל");
    expect(mail.html).toContain("הנחיות הקהילה");
  });

  it("moderation: falls back to a generic reason and words rejected materials correctly", () => {
    const mail = contentModeratedEmail({ siteUrl: SITE, kind: "material", action: "rejected", title: "מצגת" });
    expect(mail.html).toContain(DEFAULT_MODERATION_REASON);
    expect(mail.html).toContain("לא אושר לפרסום");
    expect(mail.subject).toContain("החומר שהעליתם");
  });
});

describe("event updates", () => {
  const base = {
    title: "סדנה",
    description: "תיאור",
    event_date: new Date("2026-10-20T00:00:00Z"),
    event_time: new Date("1970-01-01T18:00:00Z"),
    is_cancelled: false,
  };

  it("lists only what changed", () => {
    expect(diffEvent(base, { ...base })).toEqual([]);
    const changes = diffEvent(base, {
      ...base,
      event_date: new Date("2026-10-27T00:00:00Z"),
      event_time: new Date("1970-01-01T19:30:00Z"),
      title: "סדנה מתקדמת",
    });
    expect(changes.map((change) => change.field)).toEqual(["date", "time", "title"]);
    expect(changes.find((change) => change.field === "time")).toMatchObject({ before: "18:00", after: "19:30" });
  });

  it("reports cancellation first, and a time that was removed", () => {
    const changes = diffEvent(base, { ...base, is_cancelled: true, event_time: null });
    expect(changes[0]).toMatchObject({ field: "status", before: "פעיל", after: "בוטל" });
    expect(changes.find((change) => change.field === "time")?.after).toBe("לא צוין");
  });

  it("renders before and after plus the current details", () => {
    const changes = diffEvent(base, { ...base, title: "שם חדש" });
    const mail = eventUpdatedEmail({
      siteUrl: SITE, eventId: "e1", ...base, title: "שם חדש", changes,
    });
    expect(mail.subject).toContain("עדכון באירוע");
    expect(mail.html).toContain("שם האירוע");
    expect(mail.html).toContain("line-through");
    expect(mail.html).toContain(`href="${SITE}/events/e1"`);
    expect(mail.html).toContain("הוספתם את האירוע למועדפים");
  });

  it("uses a cancellation heading when the event was cancelled", () => {
    const changes = diffEvent(base, { ...base, is_cancelled: true });
    const mail = eventUpdatedEmail({ siteUrl: SITE, eventId: "e1", ...base, is_cancelled: true, changes });
    expect(mail.subject).toContain("האירוע בוטל");
    expect(mail.html).toContain("אירוע שסימנת בוטל");
  });
});

describe("email previews", () => {
  it("writes sample emails for visual checks when asked", async () => {
    if (!process.env.EMAIL_PREVIEW_DIR) return;
    const { mkdirSync, writeFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    mkdirSync(process.env.EMAIL_PREVIEW_DIR, { recursive: true });
    const base = {
      title: "סדנת חשיפה הדרגתית", description: "מפגש מעשי", event_date: new Date("2026-10-20T00:00:00Z"),
      event_time: new Date("1970-01-01T18:00:00Z"), is_cancelled: false,
    };
    const samples = {
      answer: forumAnswerEmail({
        siteUrl: SITE, recipientName: "נועה", answererName: "ד״ר מאיה לוי", questionTitle: "איך בונים היררכיית חשיפה לנערה עם הפרעת פאניקה?",
        questionId: "q1", answerId: "a1", content: "הסירוב הוא מידע. התחילו מהאמונה, ורק אחר כך עברו לניסוי התנהגותי קצר.\n\nשלב 1: ניבוי.",
      }),
      event: eventUpdatedEmail({
        siteUrl: SITE, recipientName: "נועה", eventId: "e1", ...base, event_time: new Date("1970-01-01T19:30:00Z"),
        changes: diffEvent(base, { ...base, event_time: new Date("1970-01-01T19:30:00Z"), event_date: new Date("2026-10-27T00:00:00Z"), title: "סדנת חשיפה מתקדמת" }),
      }),
      moderation: contentModeratedEmail({
        siteUrl: SITE, recipientName: "נועה", kind: "forum_question", action: "hidden", title: "שאלה על מטופל", reason: "השאלה כוללת פרטים מזהים של מטופל.",
      }),
    };
    for (const [name, mail] of Object.entries(samples)) writeFileSync(join(process.env.EMAIL_PREVIEW_DIR, `${name}.html`), mail.html);
  });
});
