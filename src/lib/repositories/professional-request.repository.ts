import "server-only";
import type {
  CreateProfessionalRequestCommentInput,
  CreateProfessionalRequestInput,
  PublicProfessionalRequest,
  PublicProfessionalRequestComment,
} from "@/lib/models/professional-request";
import {
  pickPublicProfessionalRequestCommentFields,
  pickPublicProfessionalRequestFields,
} from "@/lib/models/professional-request";
import { countOf, getDb, row, rows } from "@/lib/db/client";
import { buildReplyTree } from "@/lib/db/tree";
import type { ProfessionalRequest, ProfessionalRequestComment, User } from "@/lib/db/types";

const WITH_AUTHOR = "*, user:users(*)";

type RequestRow = ProfessionalRequest & { user: User };
type CommentRow = ProfessionalRequestComment & { user: User };

async function loadComments(request_id: string): Promise<CommentRow[]> {
  const db = await getDb();
  return rows<CommentRow>(
    await db
      .from("professional_request_comments")
      .select(WITH_AUTHOR)
      .eq("request_id", request_id)
      .order("created_at", { ascending: true }),
  );
}

export async function getProfessionalRequestById(
  id: string,
  include_hidden = false,
): Promise<PublicProfessionalRequest | null> {
  const db = await getDb();
  let query = db.from("professional_requests").select(WITH_AUTHOR).eq("id", id);
  if (!include_hidden) query = query.eq("is_hidden", false);

  const request = row<RequestRow>(await query.maybeSingle());
  if (!request) return null;

  const comments = await loadComments(id);
  return pickPublicProfessionalRequestFields({
    ...request,
    comments: buildReplyTree(comments, (comment) => comment.parent_comment_id),
  });
}

export async function countProfessionalRequests(include_hidden = false): Promise<number> {
  const db = await getDb();
  let query = db.from("professional_requests").select("id", { count: "exact", head: true });
  if (!include_hidden) query = query.eq("is_hidden", false);
  return countOf(await query);
}

export async function listProfessionalRequests(
  include_hidden = false,
  options: { skip?: number; take?: number } = {},
): Promise<PublicProfessionalRequest[]> {
  const db = await getDb();
  let query = db.from("professional_requests").select(WITH_AUTHOR).order("created_at", { ascending: false });
  if (!include_hidden) query = query.eq("is_hidden", false);
  if (options.take !== undefined) {
    const skip = options.skip ?? 0;
    query = query.range(skip, skip + options.take - 1);
  }
  const requests = rows<RequestRow>(await query);

  const counts = new Map<string, number>();
  if (requests.length > 0) {
    const comments = rows<{ request_id: string }>(
      await db
        .from("professional_request_comments")
        .select("request_id")
        .in("request_id", requests.map((request) => request.id)),
    );
    for (const { request_id } of comments) counts.set(request_id, (counts.get(request_id) ?? 0) + 1);
  }

  return requests.map((request) =>
    pickPublicProfessionalRequestFields({ ...request, _count: { comments: counts.get(request.id) ?? 0 } }),
  );
}

export async function createProfessionalRequest(
  input: CreateProfessionalRequestInput,
): Promise<PublicProfessionalRequest> {
  const db = await getDb();
  const request = row<RequestRow>(
    await db
      .from("professional_requests")
      .insert({ user_id: input.user_id, title: input.title, description: input.description })
      .select(WITH_AUTHOR)
      .single(),
  );
  return pickPublicProfessionalRequestFields(request!);
}

/**
 * Reply depth and the request owner's notification are handled by database triggers;
 * their errors ("Invalid parent comment.", "Maximum reply depth reached.") surface unchanged.
 */
export async function createProfessionalRequestComment(
  input: CreateProfessionalRequestCommentInput,
): Promise<PublicProfessionalRequestComment> {
  const db = await getDb();
  const exists = countOf(
    await db
      .from("professional_requests")
      .select("id", { count: "exact", head: true })
      .eq("id", input.request_id)
      .eq("is_hidden", false),
  );
  if (exists === 0) throw new Error("Professional request not found.");

  const comment = row<CommentRow>(
    await db
      .from("professional_request_comments")
      .insert({
        request_id: input.request_id,
        user_id: input.user_id,
        content: input.content,
        parent_comment_id: input.parent_comment_id ?? null,
      })
      .select(WITH_AUTHOR)
      .single(),
  );
  return pickPublicProfessionalRequestCommentFields(comment!);
}

export async function listProfessionalRequestComments(
  request_id: string,
): Promise<PublicProfessionalRequestComment[]> {
  const comments = await loadComments(request_id);
  return buildReplyTree(comments, (comment) => comment.parent_comment_id).map(
    pickPublicProfessionalRequestCommentFields,
  );
}
