import type { ForumLikeTargetType } from "@prisma/client";
import type {
  CreateForumLikeInput,
  ForumLikeSummary,
  ForumLikeTarget,
} from "@/lib/models/forum-like";
import { forumLikeKey } from "@/lib/models/forum-like";
import { prisma } from "@/lib/db";

async function assertLikeTargetExists(
  target_type: ForumLikeTargetType,
  target_id: string,
): Promise<void> {
  if (target_type === "question") {
    const question = await prisma.forumQuestion.findUnique({ where: { id: target_id } });
    if (!question) throw new Error("Forum question not found.");
    return;
  }

  const answer = await prisma.forumAnswer.findUnique({ where: { id: target_id } });
  if (!answer) throw new Error("Forum answer not found.");
}

export async function getForumLikeCounts(
  targets: ForumLikeTarget[],
): Promise<Record<string, number>> {
  if (targets.length === 0) return {};

  const counts = await prisma.forumLike.groupBy({
    by: ["target_type", "target_id"],
    where: {
      OR: targets.map((target) => ({
        target_type: target.target_type,
        target_id: target.target_id,
      })),
    },
    _count: { _all: true },
  });

  const result: Record<string, number> = {};
  for (const target of targets) {
    result[forumLikeKey(target.target_type, target.target_id)] = 0;
  }
  for (const row of counts) {
    result[forumLikeKey(row.target_type, row.target_id)] = row._count._all;
  }
  return result;
}

export async function getUserForumLikes(
  user_id: string,
  targets: ForumLikeTarget[],
): Promise<Set<string>> {
  if (targets.length === 0) return new Set();

  const likes = await prisma.forumLike.findMany({
    where: {
      user_id,
      OR: targets.map((target) => ({
        target_type: target.target_type,
        target_id: target.target_id,
      })),
    },
    select: { target_type: true, target_id: true },
  });

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
    result[key] = {
      count: counts[key] ?? 0,
      liked: likedKeys.has(key),
    };
  }
  return result;
}

export async function createForumLike(input: CreateForumLikeInput) {
  await assertLikeTargetExists(input.target_type, input.target_id);
  await prisma.forumLike.create({ data: input });
}

export async function deleteForumLike(
  user_id: string,
  target_type: ForumLikeTargetType,
  target_id: string,
): Promise<void> {
  await prisma.forumLike.delete({
    where: {
      user_id_target_type_target_id: { user_id, target_type, target_id },
    },
  });
}

export async function toggleForumLike(
  user_id: string,
  target_type: ForumLikeTargetType,
  target_id: string,
): Promise<ForumLikeSummary> {
  await assertLikeTargetExists(target_type, target_id);

  const existing = await prisma.forumLike.findUnique({
    where: {
      user_id_target_type_target_id: { user_id, target_type, target_id },
    },
  });

  if (existing) {
    await prisma.forumLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.forumLike.create({
      data: { user_id, target_type, target_id },
    });
  }

  const summaries = await getForumLikeSummaries(
    [{ target_type, target_id }],
    user_id,
  );
  return summaries[forumLikeKey(target_type, target_id)]!;
}
