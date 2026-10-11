import "server-only";
import type {
  CreateForumLikeInput,
  ForumLikeSummary,
  ForumLikeTarget,
} from "@/lib/models/forum-like";
import { forumLikeKey } from "@/lib/models/forum-like";
import { countOf, done, getDb, isUniqueViolation, rows, toError } from "@/lib/db/client";
import type { ForumLikeTargetType } from "@/lib/db/types";

async function assertLikeTargetExists(
  target_type: ForumLikeTargetType,
  target_id: string,
): Promise<void> {
  const db = await getDb();
  const table = target_type === "question" ? "forum_questions" : "forum_answers";
  const found = countOf(
    await db.from(table).select("id", { count: "exact", head: true }).eq("id", target_id).eq("is_hidden", false),
  );
  if (found === 0) {
    throw new Error(target_type === "question" ? "Forum question not found." : "Forum answer not found.");
  }
}

function idsOfType(targets: ForumLikeTarget[], type: ForumLikeTargetType): string[] {
  return targets.filter((target) => target.target_type === type).map((target) => target.target_id);
}

type LikeRow = { target_type: ForumLikeTargetType; target_id: string; user_id: string };

/** Likes for the given targets, fetched with one query per target type. */
async function loadLikes(targets: ForumLikeTarget[], user_id?: string): Promise<LikeRow[]> {
  const db = await getDb();
  const queries = (["question", "answer"] as const)
    .map((type) => ({ type, ids: idsOfType(targets, type) }))
    .filter(({ ids }) => ids.length > 0)
    .map(async ({ type, ids }) => {
      let query = db
        .from("forum_likes")
        .select("target_type, target_id, user_id")
        .eq("target_type", type)
        .in("target_id", ids);
      if (user_id) query = query.eq("user_id", user_id);
      return rows<LikeRow>(await query);
    });
  return (await Promise.all(queries)).flat();
}

export async function getForumLikeCounts(
  targets: ForumLikeTarget[],
): Promise<Record<string, number>> {
  if (targets.length === 0) return {};

  const result: Record<string, number> = {};
  for (const target of targets) result[forumLikeKey(target.target_type, target.target_id)] = 0;
  for (const like of await loadLikes(targets)) {
    result[forumLikeKey(like.target_type, like.target_id)] += 1;
  }
  return result;
}

export async function getUserForumLikes(
  user_id: string,
  targets: ForumLikeTarget[],
): Promise<Set<string>> {
  if (targets.length === 0) return new Set();
  const likes = await loadLikes(targets, user_id);
  return new Set(likes.map((like) => forumLikeKey(like.target_type, like.target_id)));
}

export async function getForumLikeSummaries(
  targets: ForumLikeTarget[],
  user_id?: string | null,
): Promise<Record<string, ForumLikeSummary>> {
  const [counts, likedKeys] = await Promise.all([
    getForumLikeCounts(targets),
    user_id ? getUserForumLikes(user_id, targets) : Promise.resolve(new Set<string>()),
  ]);

  const result: Record<string, ForumLikeSummary> = {};
  for (const target of targets) {
    const key = forumLikeKey(target.target_type, target.target_id);
    result[key] = { count: counts[key] ?? 0, liked: likedKeys.has(key) };
  }
  return result;
}

export async function createForumLike(input: CreateForumLikeInput) {
  await assertLikeTargetExists(input.target_type, input.target_id);
  const db = await getDb();
  done(await db.from("forum_likes").insert(input));
}

export async function deleteForumLike(
  user_id: string,
  target_type: ForumLikeTargetType,
  target_id: string,
): Promise<void> {
  const db = await getDb();
  done(
    await db
      .from("forum_likes")
      .delete()
      .eq("user_id", user_id)
      .eq("target_type", target_type)
      .eq("target_id", target_id),
  );
}

export async function toggleForumLike(
  user_id: string,
  target_type: ForumLikeTargetType,
  target_id: string,
): Promise<ForumLikeSummary> {
  await assertLikeTargetExists(target_type, target_id);
  const db = await getDb();

  const existing = rows<{ id: string }>(
    await db
      .from("forum_likes")
      .select("id")
      .eq("user_id", user_id)
      .eq("target_type", target_type)
      .eq("target_id", target_id),
  );

  if (existing.length > 0) {
    done(await db.from("forum_likes").delete().eq("id", existing[0].id));
  } else {
    const inserted = await db.from("forum_likes").insert({ user_id, target_type, target_id });
    // A concurrent request already created the like (unique violation): that is the same outcome.
    if (inserted.error && !isUniqueViolation(inserted.error)) throw toError(inserted.error);
  }

  const summaries = await getForumLikeSummaries([{ target_type, target_id }], user_id);
  return summaries[forumLikeKey(target_type, target_id)]!;
}
