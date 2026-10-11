/**
 * Runs the real repositories against PostgREST + a scratch Postgres that has the migration
 * applied, signing in as different users with HS256 JWTs. Run with tests/integration/run.sh.
 */
import { createHmac } from "node:crypto";
import { PostgrestClient } from "@supabase/postgrest-js";
import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ client: null as unknown }));

vi.mock("@/lib/db/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/db/client")>();
  return { ...actual, getDb: async () => state.client };
});
vi.mock("@/lib/r2", () => ({ deleteObjectFromR2: vi.fn(async () => {}) }));

import { deleteObjectFromR2 } from "@/lib/r2";
import { getPendingApprovalState, getRegistrationStatus, isReferralCodeRequired, registerProfile } from "@/lib/auth/register";
import * as events from "@/lib/repositories/event.repository";
import * as approvals from "@/lib/repositories/expert-approval.repository";
import * as forum from "@/lib/repositories/forum.repository";
import * as likes from "@/lib/repositories/forum-like.repository";
import * as materialRequests from "@/lib/repositories/material-request.repository";
import * as ratings from "@/lib/repositories/material-rating.repository";
import * as materialTypes from "@/lib/repositories/material-type.repository";
import * as materials from "@/lib/repositories/material.repository";
import * as moderation from "@/lib/repositories/moderation.repository";
import * as notifications from "@/lib/repositories/notification.repository";
import * as professional from "@/lib/repositories/professional-request.repository";
import * as profile from "@/lib/repositories/profile.repository";
import * as recommendations from "@/lib/repositories/recommendation.repository";
import * as reports from "@/lib/repositories/report.repository";
import * as tags from "@/lib/repositories/tag.repository";
import * as users from "@/lib/repositories/user.repository";
import { syncEntityTags } from "@/lib/services/tags";

const URL_BASE = process.env.POSTGREST_URL!;
const SECRET = process.env.POSTGREST_JWT_SECRET!;

const ID = {
  admin: "a0000000-0000-4000-8000-000000000001",
  expert: "e0000000-0000-4000-8000-000000000002",
  m1: "b1000000-0000-4000-8000-000000000003",
  m2: "b2000000-0000-4000-8000-000000000004",
  pending: "c1000000-0000-4000-8000-000000000005",
  newcomer: "d0000000-0000-4000-8000-000000000007",
} as const;
type Who = keyof typeof ID | "anon";

function b64(value: object | Buffer): string {
  return Buffer.from(value instanceof Buffer ? value : JSON.stringify(value)).toString("base64url");
}

function token(sub: string): string {
  const head = b64({ alg: "HS256", typ: "JWT" });
  const body = b64({ sub, role: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 });
  const sig = b64(createHmac("sha256", SECRET).update(`${head}.${body}`).digest());
  return `${head}.${body}.${sig}`;
}

/** Subsequent repository calls run as this user. */
function as(who: Who) {
  const headers: Record<string, string> = who === "anon" ? {} : { Authorization: `Bearer ${token(ID[who])}` };
  state.client = new PostgrestClient(URL_BASE, { headers });
}

const shared: Record<string, string> = {};

describe("repositories against PostgREST + RLS", () => {
  it("users: reads, own edit, admin role change, directory and stats", async () => {
    as("m1");
    expect((await users.getUserById(ID.m1))?.full_name).toBe("Member One");
    expect((await users.listUsers()).length).toBe(5);
    expect((await users.updateUser(ID.m1, { title: "Dr" })).title).toBe("Dr");
    await expect(users.updateUser(ID.m2, { title: "x" })).rejects.toThrow();

    as("pending");
    expect((await users.listUsers()).length).toBe(1);

    as("admin");
    expect((await users.setUserRole(ID.m2, "expert")).role).toBe("expert");
    expect((await users.setUserRole(ID.m2, "user")).role).toBe("user");
    await expect(users.setUserRole(ID.admin, "user")).rejects.toThrow(/מנהל המערכת האחרון/);
    const directory = await users.listAdminUsersDirectory();
    expect(directory.find((entry) => entry.id === ID.pending)?.registration_status).toBe("pending");
    expect(directory.find((entry) => entry.id === ID.m2)?.registration_status).toBe("none");
    const stats = await users.getAdminUsersPageStats();
    expect(stats.total).toBe(5);
    expect(stats.pending_verifications).toBe(1);
    const experts = await users.listExpertDirectory();
    expect(experts).toHaveLength(1);
    expect(experts[0]).toMatchObject({ pending_referrals: 1, approved_referrals: 1, total_referrals: 2 });

    as("m1");
    await expect(users.setUserRole(ID.m1, "admin")).rejects.toThrow("Forbidden");
  });

  it("expert approvals: lists, search, decisions", async () => {
    as("admin");
    const all = await approvals.listExpertApprovals();
    expect(all).toHaveLength(2);
    expect(all[0].expert?.full_name).toBe("Expert");
    expect(await approvals.listExpertApprovals({ search: "intern" })).toHaveLength(1);
    expect(await approvals.listExpertApprovals({ status: "approved" })).toHaveLength(1);

    as("expert");
    expect(await approvals.listPendingApprovalsForExpert(ID.expert)).toHaveLength(1);
    expect(await approvals.listExpertApprovalsForExpert(ID.expert, { search: "pending" })).toHaveLength(1);

    as("m2");
    await expect(approvals.updateExpertApprovalStatus(ID.expert, ID.pending, { status: "approved" })).rejects.toThrow();

    as("expert");
    const decided = await approvals.updateExpertApprovalStatus(ID.expert, ID.pending, { status: "approved" });
    expect(decided.status).toBe("approved");
    await approvals.updateExpertApprovalStatus(ID.expert, ID.pending, { status: "rejected" });
    expect((await approvals.getExpertApprovalByExpertAndUser(ID.expert, ID.pending))?.status).toBe("rejected");
  });

  it("registration: code rules, idempotence, pending state", async () => {
    as("anon");
    expect(await isReferralCodeRequired()).toBe(true);

    as("newcomer");
    await expect(registerProfile({ id: ID.newcomer, full_name: "New", expert_code: null })).rejects.toThrow(/קוד מומחה/);
    await expect(registerProfile({ id: ID.newcomer, full_name: "New", expert_code: "#12345678" })).rejects.toThrow();
    const registered = await registerProfile({ id: ID.newcomer, full_name: " New Person ", title: "Therapist", expert_code: "#E0000000" });
    expect(registered).toMatchObject({ pending_expert_approval: true, profile: { full_name: "New Person", role: "user" } });
    expect(await getRegistrationStatus(ID.newcomer)).toBe("pending");
    expect(await getPendingApprovalState(ID.newcomer)).toEqual({ status: "pending", expert_name: "Expert" });
    expect((await registerProfile({ id: ID.newcomer, full_name: "Other", expert_code: null })).profile.full_name).toBe("New Person");
  });

  it("tags and material types", async () => {
    as("m1");
    const created = await tags.createTag({ name: "mindfulness" });
    expect(created.name).toBe("mindfulness");
    expect((await tags.createTag({ name: "mindfulness" })).id).toBe(created.id); // duplicate -> existing
    expect(await tags.getTagByName("mindfulness")).not.toBeNull();
    expect((await tags.listTags()).map((tag) => tag.name)).toEqual(["anxiety", "kids", "mindfulness"]);
    shared.tagAnxiety = (await tags.getTagByName("anxiety"))!.id;
    shared.tagKids = (await tags.getTagByName("kids"))!.id;
    shared.tagMind = created.id;

    as("m2");
    await expect(tags.deleteTag(shared.tagMind)).resolves.toBeUndefined(); // no row visible to delete => no-op
    expect(await tags.getTagById(shared.tagMind)).not.toBeNull();

    as("admin");
    await expect(materialTypes.createMaterialType({ key: "game", label: "dup" })).rejects.toThrow("Material type key already exists.");
    const video = await materialTypes.createMaterialType({ key: "video", label: " Video ", icon: "movie" });
    expect(video.label).toBe("Video");
    expect(await materialTypes.listAvailableMaterialTypeKeys()).toEqual(expect.not.arrayContaining(["game", "video"]));
    shared.typeGame = (await materialTypes.getMaterialTypeByKey("game"))!.id;
    shared.typeReading = (await materialTypes.getMaterialTypeByKey("reading"))!.id;
    expect((await materialTypes.updateMaterialType(video.id, { label: "Videos" })).label).toBe("Videos");
    await materialTypes.deleteMaterialType(video.id);
    as("m1");
    await expect(materialTypes.createMaterialType({ key: "video", label: "x" })).rejects.toThrow();
  });

  it("materials: upload, visibility, filters, review, notifications", async () => {
    as("m1");
    const pendingKey = `materials/${ID.m1}/1-pending.pdf`;
    const created = await materials.createMaterial({
      user_id: ID.m1, title: "Worksheet about anxiety", description: "For kids", file_url: pendingKey,
      material_type_id: shared.typeGame, approval_status: "pending",
    });
    shared.pendingMaterial = created.id;
    expect(created.approval_status).toBe("pending");
    await syncEntityTags("material", created.id, ["anxiety", "kids"]);

    // a member cannot self-approve or attach tags to somebody else's material
    await expect(materials.createMaterial({
      user_id: ID.m1, title: "x", description: "x", file_url: `materials/${ID.m1}/2-x.pdf`,
      material_type_id: shared.typeGame, approval_status: "approved", reviewed_by: ID.m1, reviewed_at: new Date(),
    })).rejects.toThrow();
    as("m2");
    await expect(syncEntityTags("material", created.id, ["mindfulness"])).rejects.toThrow();

    // visibility: owner sees it with the flag, others never, public lists exclude it
    as("m1");
    expect(await materials.getMaterialById(created.id)).toBeNull();
    expect((await materials.getMaterialById(created.id, false, true))?.title).toBe("Worksheet about anxiety");
    as("m2");
    expect(await materials.getMaterialById(created.id, false, true)).toBeNull();
    expect(await materials.listMaterials()).toHaveLength(0);

    // expert: auto-approved upload, then reviews the pending one
    as("expert");
    const approved = await materials.createMaterial({
      user_id: ID.expert, title: "Reading list", description: "Books", file_url: `materials/${ID.expert}/3-list.pdf`,
      material_type_id: shared.typeReading, approval_status: "approved", reviewed_by: ID.expert, reviewed_at: new Date(),
    });
    shared.approvedMaterial = approved.id;
    expect(await materials.countPendingMaterials()).toBe(1);
    const queue = await materials.listMaterialsForReview("pending");
    expect(queue.total).toBe(1);
    expect(queue.items[0].tags.map((tag) => tag.name).sort()).toEqual(["anxiety", "kids"]);

    as("m2");
    await expect(materials.reviewMaterial({ material_id: created.id, reviewer_id: ID.m2, decision: "approved" })).rejects.toThrow("Forbidden");

    as("expert");
    expect(await materials.reviewMaterial({ material_id: created.id, reviewer_id: ID.expert, decision: "rejected", rejection_reason: "needs work" }))
      .toEqual({ owner_id: ID.m1, title: "Worksheet about anxiety" });
    await expect(materials.reviewMaterial({ material_id: created.id, reviewer_id: ID.expert, decision: "approved" })).rejects.toThrow("Material already reviewed.");
    expect((await materials.listMaterialsForReview("rejected")).total).toBe(1);

    as("m1");
    const note = (await notifications.listNotificationsForUser(ID.m1)).find((item) => item.type === "material_rejected");
    expect(note).toMatchObject({ reference_type: "material", reference_id: created.id, is_read: false });
    expect(await notifications.countUnreadNotifications(ID.m1)).toBe(1);
    expect((await notifications.markNotificationAsRead(note!.id, ID.m1)).is_read).toBe(true);
    await notifications.markAllNotificationsAsRead(ID.m1);
    expect(await notifications.countUnreadNotifications(ID.m1)).toBe(0);
    as("m2");
    await expect(notifications.markNotificationAsRead(note!.id, ID.m1)).rejects.toThrow("Notification not found.");

    // filters on the approved material
    as("m2");
    expect(await materials.listMaterials()).toHaveLength(1);
    expect(await materials.listMaterials({ material_type_key: "reading" })).toHaveLength(1);
    expect(await materials.listMaterials({ material_type_key: "game" })).toHaveLength(0);
    expect(await materials.listMaterials({ search: "BOOKS" })).toHaveLength(1);
    expect(await materials.listMaterials({ search: 'x%_",y' })).toHaveLength(0);
    expect(await materials.countMaterials({ material_type_key: "reading" })).toBe(1);
    expect(await materials.countMaterials()).toBe(1);
    expect(await materials.listMaterials({ take: 1, skip: 1 })).toHaveLength(0);
    expect(await materials.countMaterialsByType()).toEqual({ [shared.typeReading]: 1 });
    await syncEntityTags("material", approved.id, []); // no-op
    as("expert");
    await syncEntityTags("material", approved.id, ["anxiety"]);
    as("m2");
    expect(await materials.listMaterials({ tag_ids: [shared.tagAnxiety] })).toHaveLength(1);
    expect(await materials.listMaterials({ tag_ids: [shared.tagAnxiety, shared.tagKids] })).toHaveLength(0);

    // ratings
    expect((await ratings.createMaterialRating({ material_id: approved.id, user_id: ID.m2, rating: 5 })).rating).toBe(5);
    expect((await ratings.createMaterialRating({ material_id: approved.id, user_id: ID.m2, rating: 3 })).rating).toBe(3);
    await expect(ratings.createMaterialRating({ material_id: approved.id, user_id: ID.m2, rating: 9 })).rejects.toThrow();
    await expect(ratings.createMaterialRating({ material_id: created.id, user_id: ID.m2, rating: 4 })).rejects.toThrow("Material not found.");
    as("m1");
    await ratings.createMaterialRating({ material_id: approved.id, user_id: ID.m1, rating: 5 });
    expect(await ratings.getMaterialAverageRating(approved.id)).toBe(4);
    expect((await ratings.getMaterialAverageRatings([approved.id, created.id])).get(approved.id)).toBe(4);
    expect((await ratings.getMaterialRating(approved.id, ID.m1))?.rating).toBe(5);
    expect(await ratings.listMaterialRatingsByMaterial(approved.id)).toHaveLength(2);
    expect((await ratings.updateMaterialRating(approved.id, ID.m1, { rating: 1 })).rating).toBe(1);
    await ratings.deleteMaterialRating(approved.id, ID.m1);
    expect(await ratings.getMaterialRating(approved.id, ID.m1)).toBeNull();

    // admin listing sees everything, with uploader and tags
    as("admin");
    const adminList = await materials.listMaterialsForAdmin({}, 10, 0);
    expect(adminList.total).toBe(2);
    expect(adminList.items.find((item) => item.id === created.id)).toMatchObject({
      approvalStatus: "rejected", uploader: { id: ID.m1 },
    });
    expect(adminList.items.find((item) => item.id === created.id)!.tags).toHaveLength(2);
  });

  it("forum: questions, nested answers, search, likes, notifications", async () => {
    as("m1");
    const question = await forum.createForumQuestion({ user_id: ID.m1, title: "How to treat panic?", content: "Looking for CBT tips" });
    shared.question = question.id;
    expect(question.user?.full_name).toBe("Member One");

    as("m2");
    const answer = await forum.createForumAnswer({ question_id: question.id, user_id: ID.m2, content: "Try exposure" });
    as("m1");
    const reply = await forum.createForumAnswer({ question_id: question.id, user_id: ID.m1, content: "Thanks", parent_answer_id: answer.id });
    as("m2");
    const reply2 = await forum.createForumAnswer({ question_id: question.id, user_id: ID.m2, content: "Welcome", parent_answer_id: reply.id });
    await expect(forum.createForumAnswer({ question_id: question.id, user_id: ID.m2, content: "too deep", parent_answer_id: reply2.id })).rejects.toThrow("Maximum reply depth reached.");
    await expect(forum.createForumAnswer({ question_id: ID.m1, user_id: ID.m2, content: "x" })).rejects.toThrow("Forum question not found.");

    const loaded = await forum.getForumQuestionById(question.id);
    expect(loaded?.answers).toHaveLength(1);
    expect(loaded?.answers?.[0].replies?.[0].replies?.[0].content).toBe("Welcome");
    expect((await forum.listForumAnswersByQuestion(question.id))[0].id).toBe(answer.id);

    as("m1");
    expect((await notifications.listNotificationsForUser(ID.m1)).some((item) => item.type === "forum_answer")).toBe(true);
    expect((await notifications.listNotificationsForUser(ID.m1)).filter((item) => item.type === "forum_answer")).toHaveLength(2); // m2 answered twice (answer + reply-to-reply)

    const found = await forum.searchForumQuestions({ query: "panic" });
    expect(found).toHaveLength(1);
    expect(found[0].answer_count).toBe(3);
    expect(await forum.searchForumQuestions({ query: 'p%"),x' })).toHaveLength(0);
    expect(await forum.countForumQuestions({ query: "cbt" })).toBe(1);
    expect(await forum.searchForumQuestions({ take: 1, skip: 1 })).toHaveLength(0);

    // likes: toggle on/off, summaries per viewer
    as("m2");
    const target = { target_type: "question" as const, target_id: question.id };
    expect(await likes.toggleForumLike(ID.m2, "question", question.id)).toEqual({ count: 1, liked: true });
    as("m1");
    const summaries = await likes.getForumLikeSummaries([target], ID.m1);
    expect(Object.values(summaries)[0]).toEqual({ count: 1, liked: false });
    as("m2");
    expect(await likes.toggleForumLike(ID.m2, "question", question.id)).toEqual({ count: 0, liked: false });
    await expect(likes.toggleForumLike(ID.m2, "answer", question.id)).rejects.toThrow("Forum answer not found.");
  });

  it("recommendations, events and professional requests", async () => {
    as("m1");
    const rec = await recommendations.createRecommendation({ user_id: ID.m1, type: "book", content: "Feeling Good" });
    await syncEntityTags("recommendation", rec.id, ["anxiety"]);
    as("m2");
    const comment = await recommendations.createRecommendationComment({ recommendation_id: rec.id, user_id: ID.m2, content: "Agree" });
    as("m1");
    const reply = await recommendations.createRecommendationComment({ recommendation_id: rec.id, user_id: ID.m1, content: "Thanks", parent_comment_id: comment.id });
    expect(reply.depth).toBe(1);
    as("m2");
    await expect(recommendations.createRecommendationComment({ recommendation_id: rec.id, user_id: ID.m2, content: "x", parent_comment_id: reply.id })).rejects.toThrow("Recommendation comments allow only one reply level.");
    const feed = await recommendations.listRecommendationsFeed();
    expect(feed[0].comments?.[0].replies?.[0].content).toBe("Thanks");
    expect(feed[0].tags.map((tag) => tag.name)).toEqual(["anxiety"]);
    expect((await recommendations.getRecommendationById(rec.id))?.comments).toHaveLength(1);
    expect(await recommendations.listRecommendations()).toHaveLength(1);
    expect(await recommendations.listRecommendationComments(rec.id)).toHaveLength(1);

    // events: dates round-trip and ordering
    as("m1");
    const later = await events.createEvent({ user_id: ID.m1, title: "Workshop", description: "d", event_date: new Date("2026-12-05T00:00:00Z"), event_time: new Date("1970-01-01T18:30:00Z") });
    await events.createEvent({ user_id: ID.m1, title: "Earlier", description: "d", event_date: new Date("2026-11-01T00:00:00Z"), event_time: null });
    await events.createEvent({ user_id: ID.m1, title: "Undated", description: "d" });
    expect(later.event_date?.toISOString()).toBe("2026-12-05T00:00:00.000Z");
    expect(later.event_time?.toISOString()).toBe("1970-01-01T18:30:00.000Z");
    const ordered = await events.listEvents();
    expect(ordered.map((event) => event.title)).toEqual(["Earlier", "Workshop", "Undated"]);
    expect((await events.listEvents({ calendar_only: true })).map((event) => event.title)).toEqual(["Earlier", "Workshop"]);
    expect(await events.countEvents({ calendar_only: true })).toBe(2);
    expect((await events.listEvents({ user_id: ID.m1, take: 1, skip: 1 }))[0].title).toBe("Workshop");
    expect((await events.updateEvent(later.id, { title: "Workshop 2", is_cancelled: true })).is_cancelled).toBe(true);
    expect((await events.getEventById(later.id))?.title).toBe("Workshop 2");
    as("m2");
    await expect(events.updateEvent(later.id, { title: "hijack" })).rejects.toThrow("Forbidden");
    await events.createEventComment({ event_id: later.id, user_id: ID.m2, content: "See you" });
    expect(await events.listEventComments(later.id)).toHaveLength(1);
    as("m1");
    expect((await events.getEventById(later.id))?.comments).toHaveLength(1);
    expect((await notifications.listNotificationsForUser(ID.m1, true)).some((item) => item.type === "comment_on_content")).toBe(true);

    // professional requests
    const request = await professional.createProfessionalRequest({ user_id: ID.m1, title: "Need supervision", description: "Anyone?" });
    as("m2");
    const c1 = await professional.createProfessionalRequestComment({ request_id: request.id, user_id: ID.m2, content: "Me" });
    const c2 = await professional.createProfessionalRequestComment({ request_id: request.id, user_id: ID.m2, content: "Also", parent_comment_id: c1.id });
    const c3 = await professional.createProfessionalRequestComment({ request_id: request.id, user_id: ID.m2, content: "Again", parent_comment_id: c2.id });
    await expect(professional.createProfessionalRequestComment({ request_id: request.id, user_id: ID.m2, content: "deep", parent_comment_id: c3.id })).rejects.toThrow("Maximum reply depth reached.");
    expect((await professional.getProfessionalRequestById(request.id))?.comments?.[0].replies?.[0].replies).toHaveLength(1);
    expect((await professional.listProfessionalRequests())[0].comment_count).toBe(3);
    expect(await professional.countProfessionalRequests()).toBe(1);
    expect(await professional.listProfessionalRequestComments(request.id)).toHaveLength(1);

    // material requests and responses
    as("m1");
    const materialRequest = await materialRequests.createMaterialRequest({ user_id: ID.m1, title: "Need a CBT diary", description: "Any template" });
    as("m2");
    await expect(materialRequests.createMaterialResponse({ request_id: materialRequest.id, user_id: ID.m2 })).rejects.toThrow();
    const response = await materialRequests.createMaterialResponse({ request_id: materialRequest.id, user_id: ID.m2, text: "Here", file_url: `material-responses/${ID.m2}/1-a.pdf` });
    expect(response.user?.full_name).toBe("Member Two");
    await expect(materialRequests.createMaterialResponse({ request_id: materialRequest.id, user_id: ID.m2, file_url: `material-responses/${ID.m1}/1-a.pdf` })).rejects.toThrow();
    expect((await materialRequests.getMaterialRequestById(materialRequest.id))?.responses).toHaveLength(1);
    expect(await materialRequests.countMaterialRequests()).toBe(1);
    expect(await materialRequests.listMaterialRequests({ take: 5 })).toHaveLength(1);
    expect(await materialRequests.listMaterialResponsesByRequest(materialRequest.id)).toHaveLength(1);
    as("m1");
    expect((await notifications.listNotificationsForUser(ID.m1)).some((item) => item.type === "material_request_response")).toBe(true);
  });

  it("profile page data", async () => {
    as("m1");
    const data = await profile.getUserProfilePageData(ID.m1);
    expect(data.materials).toHaveLength(1); // the rejected one it uploaded
    expect(data.forum_questions[0]).toMatchObject({ answer_count: 3, like_count: 0 });
    expect(data.forum_answers).toHaveLength(1);
    expect(data.events).toHaveLength(3);
    expect(data.recommendations).toHaveLength(1);
    expect(data.focus_tags.map((tag) => tag.name).sort()).toEqual(["anxiety", "kids"]);
  });

  it("reports and moderation", async () => {
    as("m2");
    await expect(reports.createReport({ user_id: ID.m2, target_type: "event", target_id: ID.m1, reason: "x" })).rejects.toThrow("Report target not found.");
    const eventId = (await events.listEvents())[0].id;
    const report = await reports.createReport({ user_id: ID.m2, target_type: "event", target_id: eventId, reason: "spam" });
    expect((await reports.createReport({ user_id: ID.m2, target_type: "event", target_id: eventId, reason: "again" })).id).toBe(report.id);
    expect(await reports.listReports()).toHaveLength(1);
    await expect(reports.updateReportStatus(report.id, { status: "resolved" })).rejects.toThrow("Forbidden");

    as("admin");
    expect(await reports.listReports({ status: "open" })).toHaveLength(1);
    expect((await reports.getReportById(report.id))?.user?.full_name).toBe("Member Two");
    expect((await reports.updateReportStatus(report.id, { status: "resolved" })).status).toBe("resolved");

    await moderation.hideReportedContent("event", eventId);
    // an admin can still read a hidden item (and its deep-link parent for answers); members cannot
    const key = reports.reportContentKey("event", eventId);
    const adminView = (await reports.getReportedContent([{ target_type: "event", target_id: eventId }])).get(key);
    expect(adminView).toMatchObject({ found: true, is_hidden: true });
    expect(adminView?.title).toBeTruthy();
    const answerId = (await forum.getForumQuestionById(shared.question, true))!.answers![0].id;
    const answerView = (await reports.getReportedContent([{ target_type: "forum_answer", target_id: answerId }]))
      .get(reports.reportContentKey("forum_answer", answerId));
    expect(answerView).toMatchObject({ found: true, parent_id: shared.question });
    expect(answerView?.excerpt).toBeTruthy();
    as("m2");
    expect((await reports.getReportedContent([{ target_type: "event", target_id: eventId }])).has(key)).toBe(false);
    expect((await events.listEvents()).some((event) => event.id === eventId)).toBe(false);
    await expect(moderation.hideReportedContent("event", eventId)).rejects.toThrow("Forbidden");
    as("admin");
    expect(await events.getEventById(eventId, true)).toMatchObject({ is_hidden: true });
    await moderation.restoreReportedContent("event", eventId);
    as("m2");
    expect((await events.listEvents()).some((event) => event.id === eventId)).toBe(true);

    // deleting a forum question removes answers and likes; deleting a material removes its file
    as("admin");
    await moderation.deleteReportedContent("forum_question", shared.question);
    expect(await forum.getForumQuestionById(shared.question, true)).toBeNull();
    await moderation.deleteReportedContent("material", shared.approvedMaterial);
    expect(deleteObjectFromR2).toHaveBeenCalledWith(`materials/${ID.expert}/3-list.pdf`);
    expect(await materials.getMaterialById(shared.approvedMaterial, true, true)).toBeNull();
    as("m1");
    await expect(moderation.deleteReportedContent("event", eventId)).rejects.toThrow("Forbidden");

    as("admin");
    await tags.deleteTag(shared.tagMind);
    expect(await tags.getTagById(shared.tagMind)).toBeNull();
  });
});
