import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getRecipient: vi.fn(),
  getDisplayName: vi.fn(),
  getFavoriteUserIds: vi.fn(),
  getRow: vi.fn(),
  snapshotContent: vi.fn(),
  sendEmail: vi.fn(async () => true),
  sendEmails: vi.fn(async (_config: unknown, messages: unknown[]) => messages.length),
}));

vi.mock("@/lib/email/lookup", () => mocks);
vi.mock("@/lib/email/resend", () => ({ sendEmail: mocks.sendEmail, sendEmails: mocks.sendEmails }));
vi.mock("next/server", () => ({ after: (task: () => Promise<void>) => void task() }));

import {
  deliverEventUpdate,
  deliverForumAnswer,
  deliverMaterialResponse,
  deliverModeration,
  deliverProfessionalComment,
  notifyForumAnswer,
} from "@/lib/email/notify";

const config = {
  apiKey: "k", from: "f", siteUrl: "https://cbt.example.com", supabaseUrl: "u", serviceRoleKey: "s",
};
const person = (id: string) => ({ id, email: `${id}@x.test`, name: id.toUpperCase() });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getRecipient.mockImplementation(async (_c: unknown, id: string) => person(id));
  mocks.getDisplayName.mockResolvedValue("רבקה");
});

const sent = () => (mocks.sendEmail.mock.calls[0] as unknown as [unknown, { to: string; subject: string; html: string }])[1];

describe("replies", () => {
  it("emails the question's author with a preview and a link to the answer", async () => {
    mocks.getRow.mockResolvedValue({ user_id: "asker", title: "שאלה חשובה" });
    await deliverForumAnswer(config, { questionId: "q1", answerId: "a1", authorId: "responder", content: "תשובה מפורטת" });

    expect(mocks.sendEmail).toHaveBeenCalledTimes(1);
    expect(sent().to).toBe("asker@x.test");
    expect(sent().html).toContain("תשובה מפורטת");
    expect(sent().html).toContain("https://cbt.example.com/forum/q1#answer-a1");
  });

  it("does not email people about their own replies", async () => {
    mocks.getRow.mockResolvedValue({ user_id: "asker", title: "שאלה" });
    await deliverForumAnswer(config, { questionId: "q1", answerId: "a1", authorId: "asker", content: "x" });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("skips quietly when the question is gone or the author has no address", async () => {
    mocks.getRow.mockResolvedValueOnce(null);
    await deliverForumAnswer(config, { questionId: "q1", answerId: "a1", authorId: "x", content: "x" });
    mocks.getRow.mockResolvedValueOnce({ user_id: "asker", title: "t" });
    mocks.getRecipient.mockResolvedValueOnce(null);
    await deliverForumAnswer(config, { questionId: "q1", answerId: "a1", authorId: "x", content: "x" });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("emails a professional request's author", async () => {
    mocks.getRow.mockResolvedValue({ user_id: "owner", title: "פנייה" });
    await deliverProfessionalComment(config, { requestId: "r1", authorId: "other", content: "תגובה" });
    expect(sent().to).toBe("owner@x.test");
    expect(sent().html).toContain("https://cbt.example.com/professional-requests/r1");
  });
});

describe("material requests", () => {
  it("tells the requester when material was uploaded for their request", async () => {
    mocks.getRow.mockResolvedValue({ user_id: "requester", title: "דף עבודה" });
    await deliverMaterialResponse(config, { requestId: "m1", responderId: "helper", hasFile: true });
    expect(sent().to).toBe("requester@x.test");
    expect(sent().subject).toContain("חומר חדש");
    expect(sent().html).toContain("https://cbt.example.com/materials/requests/m1");
  });
});

describe("favorited events", () => {
  const event = {
    title: "סדנה", description: "d", event_date: "2026-10-20", event_time: "18:00:00", is_cancelled: false, is_hidden: false,
  };
  const changes = [{ field: "time" as const, label: "שעה", before: "18:00", after: "19:00" }];

  it("emails everyone who favorited the event except the editor, in one batch", async () => {
    mocks.getRow.mockResolvedValue(event);
    mocks.getFavoriteUserIds.mockResolvedValue(["fan1", "organizer", "fan2"]);
    await deliverEventUpdate(config, { eventId: "e1", editorId: "organizer", changes });

    expect(mocks.sendEmails).toHaveBeenCalledTimes(1);
    const messages = (mocks.sendEmails.mock.calls[0] as unknown as [unknown, { to: string }[]])[1];
    expect(messages.map((message) => message.to)).toEqual(["fan1@x.test", "fan2@x.test"]);
  });

  it("sends nothing when nothing changed, nobody favorited, or the event is hidden", async () => {
    await deliverEventUpdate(config, { eventId: "e1", editorId: "o", changes: [] });
    mocks.getRow.mockResolvedValue(event);
    mocks.getFavoriteUserIds.mockResolvedValue([]);
    await deliverEventUpdate(config, { eventId: "e1", editorId: "o", changes });
    mocks.getRow.mockResolvedValue({ ...event, is_hidden: true });
    mocks.getFavoriteUserIds.mockResolvedValue(["fan1"]);
    await deliverEventUpdate(config, { eventId: "e1", editorId: "o", changes });
    expect(mocks.sendEmails).not.toHaveBeenCalled();
  });

  it("skips fans without an address instead of failing the batch", async () => {
    mocks.getRow.mockResolvedValue(event);
    mocks.getFavoriteUserIds.mockResolvedValue(["fan1", "ghost"]);
    mocks.getRecipient.mockImplementation(async (_c: unknown, id: string) => (id === "ghost" ? null : person(id)));
    await deliverEventUpdate(config, { eventId: "e1", editorId: "o", changes });
    expect((mocks.sendEmails.mock.calls[0] as unknown as [unknown, unknown[]])[1]).toHaveLength(1);
  });
});

describe("moderation", () => {
  it("emails the author with the reason, but not an admin moderating their own content", async () => {
    await deliverModeration(config, {
      ownerId: "author", actorId: "admin", kind: "forum_answer", action: "hidden", excerpt: "טקסט", reason: "פרטי מטופל",
    });
    expect(sent().to).toBe("author@x.test");
    expect(sent().html).toContain("פרטי מטופל");

    mocks.sendEmail.mockClear();
    const info = vi.spyOn(console, "log").mockImplementation(() => {});
    await deliverModeration(config, { ownerId: "admin", actorId: "admin", kind: "event", action: "deleted" });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    // the skip is visible in the logs, so it is not mistaken for a failure
    expect(info.mock.calls.map(String).join(" | ")).toContain("the recipient is the person who did the action");
    info.mockRestore();
  });

  it("logs when an email was sent, without the address", async () => {
    const info = vi.spyOn(console, "log").mockImplementation(() => {});
    await deliverModeration(config, { ownerId: "author", actorId: "admin", kind: "event", action: "hidden" });
    const logged = info.mock.calls.map(String).join(" | ");
    expect(logged).toContain("Email sent");
    expect(logged).not.toContain("author@x.test");
    info.mockRestore();
  });
});

describe("not configured", () => {
  it("notify calls do nothing at all when email is not set up", async () => {
    const saved = { ...process.env };
    delete process.env.RESEND_API_KEY;
    notifyForumAnswer({ questionId: "q", answerId: "a", authorId: "u", content: "x" });
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(mocks.getRow).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    process.env = saved;
  });
});
