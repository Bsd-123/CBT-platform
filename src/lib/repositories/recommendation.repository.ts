import "server-only";
import type {
  CreateRecommendationCommentInput,
  CreateRecommendationInput,
  PublicRecommendation,
  PublicRecommendationComment,
} from "@/lib/models/recommendation";
import {
  pickPublicRecommendationCommentFields,
  pickPublicRecommendationFields,
} from "@/lib/models/recommendation";
import { countOf, getDb, row, rows } from "@/lib/db/client";
import { buildReplyTree } from "@/lib/db/tree";
import type { Recommendation, RecommendationComment, Tag, User, EntityTag } from "@/lib/db/types";

const WITH_AUTHOR = "*, user:users(*)";

type RecommendationRow = Recommendation & { user: User };
type CommentRow = RecommendationComment & { user: User };

async function loadComments(recommendation_ids: string[]): Promise<CommentRow[]> {
  if (recommendation_ids.length === 0) return [];
  const db = await getDb();
  return rows<CommentRow>(
    await db
      .from("recommendation_comments")
      .select(WITH_AUTHOR)
      .in("recommendation_id", recommendation_ids)
      .order("created_at", { ascending: true }),
  );
}

/** Top-level comments with their replies, for each recommendation id. */
async function commentTrees(recommendation_ids: string[]) {
  const comments = await loadComments(recommendation_ids);
  const byRecommendation = new Map<string, CommentRow[]>();
  for (const comment of comments) {
    byRecommendation.set(comment.recommendation_id, [
      ...(byRecommendation.get(comment.recommendation_id) ?? []),
      comment,
    ]);
  }
  return (id: string) =>
    buildReplyTree(byRecommendation.get(id) ?? [], (comment) => comment.parent_comment_id);
}

export async function getRecommendationById(
  id: string,
  include_hidden = false,
): Promise<PublicRecommendation | null> {
  const db = await getDb();
  let query = db.from("recommendations").select(WITH_AUTHOR).eq("id", id);
  if (!include_hidden) query = query.eq("is_hidden", false);

  const recommendation = row<RecommendationRow>(await query.maybeSingle());
  if (!recommendation) return null;

  const trees = await commentTrees([id]);
  return pickPublicRecommendationFields({ ...recommendation, comments: trees(id) });
}

export async function listRecommendations(include_hidden = false): Promise<PublicRecommendation[]> {
  const db = await getDb();
  let query = db.from("recommendations").select(WITH_AUTHOR).order("created_at", { ascending: false });
  if (!include_hidden) query = query.eq("is_hidden", false);
  return rows<RecommendationRow>(await query).map(pickPublicRecommendationFields);
}

export type RecommendationFeedItem = PublicRecommendation & {
  tags: ReturnType<typeof import("@/lib/models/tag").pickPublicTagFields>[];
};

export async function listRecommendationsFeed(
  include_hidden = false,
): Promise<RecommendationFeedItem[]> {
  const db = await getDb();
  let query = db.from("recommendations").select(WITH_AUTHOR).order("created_at", { ascending: true });
  if (!include_hidden) query = query.eq("is_hidden", false);

  const recommendations = rows<RecommendationRow>(await query);
  if (recommendations.length === 0) return [];

  const ids = recommendations.map((item) => item.id);
  const [trees, entityTags] = await Promise.all([
    commentTrees(ids),
    db
      .from("entity_tags")
      .select("*, tag:tags(*)")
      .eq("entity_type", "recommendation")
      .in("entity_id", ids),
  ]);

  const tagsByRecommendation = new Map<string, RecommendationFeedItem["tags"]>();
  for (const entityTag of rows<EntityTag & { tag: Tag | null }>(entityTags)) {
    if (!entityTag.tag) continue;
    const current = tagsByRecommendation.get(entityTag.entity_id) ?? [];
    current.push({ id: entityTag.tag.id, name: entityTag.tag.name, color: entityTag.tag.color });
    tagsByRecommendation.set(entityTag.entity_id, current);
  }

  return recommendations.map((recommendation) => ({
    ...pickPublicRecommendationFields({ ...recommendation, comments: trees(recommendation.id) }),
    tags: tagsByRecommendation.get(recommendation.id) ?? [],
  }));
}

export async function createRecommendation(
  input: CreateRecommendationInput,
): Promise<PublicRecommendation> {
  const db = await getDb();
  const recommendation = row<RecommendationRow>(
    await db
      .from("recommendations")
      .insert({ user_id: input.user_id, type: input.type ?? null, content: input.content })
      .select(WITH_AUTHOR)
      .single(),
  );
  return pickPublicRecommendationFields(recommendation!);
}

/**
 * Reply depth (one level) and the recommendation owner's notification are handled by
 * database triggers; their errors surface unchanged.
 */
export async function createRecommendationComment(
  input: CreateRecommendationCommentInput,
): Promise<PublicRecommendationComment> {
  const db = await getDb();
  const exists = countOf(
    await db
      .from("recommendations")
      .select("id", { count: "exact", head: true })
      .eq("id", input.recommendation_id)
      .eq("is_hidden", false),
  );
  if (exists === 0) throw new Error("Recommendation not found.");

  const comment = row<CommentRow>(
    await db
      .from("recommendation_comments")
      .insert({
        recommendation_id: input.recommendation_id,
        user_id: input.user_id,
        content: input.content,
        parent_comment_id: input.parent_comment_id ?? null,
      })
      .select(WITH_AUTHOR)
      .single(),
  );
  return pickPublicRecommendationCommentFields(comment!);
}

export async function listRecommendationComments(
  recommendation_id: string,
): Promise<PublicRecommendationComment[]> {
  const trees = await commentTrees([recommendation_id]);
  return trees(recommendation_id).map(pickPublicRecommendationCommentFields);
}
