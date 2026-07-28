import type { ForumLike, ForumLikeTargetType } from "@prisma/client";

export type { ForumLike, ForumLikeTargetType };

export type ForumLikeTarget = {
  target_type: ForumLikeTargetType;
  target_id: string;
};

export type ForumLikeSummary = {
  count: number;
  liked: boolean;
};

export type CreateForumLikeInput = {
  user_id: string;
  target_type: ForumLikeTargetType;
  target_id: string;
};

export function forumLikeKey(target_type: ForumLikeTargetType, target_id: string): string {
  return `${target_type}:${target_id}`;
}

export function pickPublicForumLikeFields(like: ForumLike) {
  return {
    id: like.id,
    user_id: like.user_id,
    target_type: like.target_type,
    target_id: like.target_id,
    created_at: like.created_at,
  };
}

export type PublicForumLike = ReturnType<typeof pickPublicForumLikeFields>;
