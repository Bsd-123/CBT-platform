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
import { prisma } from "@/lib/db";
import { notifyRecommendationComment } from "@/lib/services/notifications";
import { visibleContentWhere } from "@/lib/db/visibility";

const recommendationInclude = {
  user: true,
  comments: {
    where: { parent_comment_id: null },
    include: {
      user: true,
      replies: { include: { user: true }, orderBy: { created_at: "asc" as const } },
    },
    orderBy: { created_at: "asc" as const },
  },
} as const;

export async function getRecommendationById(
  id: string,
  include_hidden = false,
): Promise<PublicRecommendation | null> {
  const recommendation = await prisma.recommendation.findFirst({
    where: { id, ...visibleContentWhere(include_hidden) },
    include: recommendationInclude,
  });
  return recommendation ? pickPublicRecommendationFields(recommendation) : null;
}

export async function listRecommendations(include_hidden = false): Promise<PublicRecommendation[]> {
  const recommendations = await prisma.recommendation.findMany({
    where: visibleContentWhere(include_hidden),
    include: { user: true },
    orderBy: { created_at: "desc" },
  });
  return recommendations.map(pickPublicRecommendationFields);
}

export type RecommendationFeedItem = PublicRecommendation & {
  tags: ReturnType<typeof import("@/lib/models/tag").pickPublicTagFields>[];
};

export async function listRecommendationsFeed(
  include_hidden = false,
): Promise<RecommendationFeedItem[]> {
  const recommendations = await prisma.recommendation.findMany({
    where: visibleContentWhere(include_hidden),
    include: recommendationInclude,
    orderBy: { created_at: "asc" },
  });

  if (recommendations.length === 0) {
    return [];
  }

  const recommendationIds = recommendations.map((item) => item.id);
  const entityTags = await prisma.entityTag.findMany({
    where: {
      entity_type: "recommendation",
      entity_id: { in: recommendationIds },
    },
    include: { tag: true },
  });

  const tagsByRecommendation = new Map<
    string,
    RecommendationFeedItem["tags"]
  >();

  for (const entityTag of entityTags) {
    if (!entityTag.tag) continue;
    const current = tagsByRecommendation.get(entityTag.entity_id) ?? [];
    current.push({
      id: entityTag.tag.id,
      name: entityTag.tag.name,
      color: entityTag.tag.color,
    });
    tagsByRecommendation.set(entityTag.entity_id, current);
  }

  return recommendations.map((recommendation) => ({
    ...pickPublicRecommendationFields(recommendation),
    tags: tagsByRecommendation.get(recommendation.id) ?? [],
  }));
}

export async function createRecommendation(
  input: CreateRecommendationInput,
): Promise<PublicRecommendation> {
  const recommendation = await prisma.recommendation.create({
    data: {
      user_id: input.user_id,
      type: input.type ?? null,
      content: input.content,
    },
    include: { user: true },
  });
  return pickPublicRecommendationFields(recommendation);
}

export async function createRecommendationComment(
  input: CreateRecommendationCommentInput,
): Promise<PublicRecommendationComment> {
  const recommendation = await prisma.recommendation.findFirst({
    where: { id: input.recommendation_id, ...visibleContentWhere() },
  });

  if (!recommendation) {
    throw new Error("Recommendation not found.");
  }

  let depth = 0;

  if (input.parent_comment_id) {
    const parent = await prisma.recommendationComment.findUnique({
      where: { id: input.parent_comment_id },
    });

    if (!parent || parent.recommendation_id !== input.recommendation_id) {
      throw new Error("Invalid parent comment.");
    }

    if (parent.depth !== 0) {
      throw new Error("Recommendation comments allow only one reply level.");
    }

    depth = 1;
  }

  const comment = await prisma.recommendationComment.create({
    data: {
      recommendation_id: input.recommendation_id,
      user_id: input.user_id,
      content: input.content,
      parent_comment_id: input.parent_comment_id ?? null,
      depth,
    },
    include: { user: true },
  });

  await notifyRecommendationComment(
    recommendation.user_id,
    recommendation.id,
    input.user_id,
  );

  return pickPublicRecommendationCommentFields(comment);
}

export async function listRecommendationComments(
  recommendation_id: string,
): Promise<PublicRecommendationComment[]> {
  const comments = await prisma.recommendationComment.findMany({
    where: { recommendation_id, parent_comment_id: null },
    include: {
      user: true,
      replies: { include: { user: true }, orderBy: { created_at: "asc" } },
    },
    orderBy: { created_at: "asc" },
  });
  return comments.map(pickPublicRecommendationCommentFields);
}
