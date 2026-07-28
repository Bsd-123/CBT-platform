import type {
  Recommendation,
  RecommendationComment,
  RecommendationType,
} from "@prisma/client";
import { pickPublicUserFields } from "@/lib/models/user";

export type { Recommendation, RecommendationComment, RecommendationType };

export const RECOMMENDATION_TYPES: readonly RecommendationType[] = [
  "book",
  "game",
  "workshop",
] as const;

export type CreateRecommendationInput = {
  user_id: string;
  type?: RecommendationType | null;
  content: string;
};

export type CreateRecommendationCommentInput = {
  recommendation_id: string;
  user_id: string;
  content: string;
  parent_comment_id?: string | null;
};

export function pickPublicRecommendationFields(
  recommendation: Recommendation & {
    user?: Parameters<typeof pickPublicUserFields>[0];
    comments?: Parameters<typeof pickPublicRecommendationCommentFields>[0][];
  },
) {
  return {
    id: recommendation.id,
    user_id: recommendation.user_id,
    type: recommendation.type,
    content: recommendation.content,
    created_at: recommendation.created_at,
    user: recommendation.user ? pickPublicUserFields(recommendation.user) : undefined,
    comments: recommendation.comments?.map(pickPublicRecommendationCommentFields),
  };
}

export type PublicRecommendationComment = {
  id: string;
  recommendation_id: string;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  depth: number;
  created_at: Date;
  user?: ReturnType<typeof pickPublicUserFields>;
  replies?: PublicRecommendationComment[];
};

export function pickPublicRecommendationCommentFields(
  comment: RecommendationComment & {
    user?: Parameters<typeof pickPublicUserFields>[0];
    replies?: Parameters<typeof pickPublicRecommendationCommentFields>[0][];
  },
): PublicRecommendationComment {
  return {
    id: comment.id,
    recommendation_id: comment.recommendation_id,
    user_id: comment.user_id,
    content: comment.content,
    parent_comment_id: comment.parent_comment_id,
    depth: comment.depth,
    created_at: comment.created_at,
    user: comment.user ? pickPublicUserFields(comment.user) : undefined,
    replies: comment.replies?.map(pickPublicRecommendationCommentFields),
  };
}

export type PublicRecommendation = ReturnType<typeof pickPublicRecommendationFields>;
