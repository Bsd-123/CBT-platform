import { prisma } from "@/lib/db";
import { pickPublicEventFields } from "@/lib/models/event";
import { pickPublicForumAnswerFields, pickPublicForumQuestionFields } from "@/lib/models/forum";
import { pickPublicMaterialFields } from "@/lib/models/material";
import { pickPublicRecommendationFields } from "@/lib/models/recommendation";
import { pickPublicTagFields, type PublicTag } from "@/lib/models/tag";

export type ProfileForumQuestion = ReturnType<typeof pickPublicForumQuestionFields> & {
  like_count: number;
  answer_count: number;
};

export type ProfileForumAnswer = ReturnType<typeof pickPublicForumAnswerFields> & {
  like_count: number;
  reply_count: number;
};

export type UserProfilePageData = {
  materials: ReturnType<typeof pickPublicMaterialFields>[];
  recommendations: ReturnType<typeof pickPublicRecommendationFields>[];
  forum_questions: ProfileForumQuestion[];
  forum_answers: ProfileForumAnswer[];
  events: ReturnType<typeof pickPublicEventFields>[];
  focus_tags: PublicTag[];
};

async function countForumLikes(
  target_type: "question" | "answer",
  target_ids: string[],
): Promise<Map<string, number>> {
  if (target_ids.length === 0) return new Map();

  const rows = await prisma.forumLike.groupBy({
    by: ["target_id"],
    where: { target_type, target_id: { in: target_ids } },
    _count: { _all: true },
  });

  return new Map(rows.map((row) => [row.target_id, row._count._all]));
}

async function getUserFocusTags(user_id: string): Promise<PublicTag[]> {
  const [materials, recommendations, forumQuestions] = await Promise.all([
    prisma.material.findMany({ where: { user_id }, select: { id: true } }),
    prisma.recommendation.findMany({ where: { user_id }, select: { id: true } }),
    prisma.forumQuestion.findMany({ where: { user_id }, select: { id: true } }),
  ]);

  const materialIds = materials.map((item) => item.id);
  const recommendationIds = recommendations.map((item) => item.id);
  const forumQuestionIds = forumQuestions.map((item) => item.id);

  if (
    materialIds.length === 0 &&
    recommendationIds.length === 0 &&
    forumQuestionIds.length === 0
  ) {
    return [];
  }

  const entityTags = await prisma.entityTag.findMany({
    where: {
      OR: [
        ...(materialIds.length
          ? [{ entity_type: "material" as const, entity_id: { in: materialIds } }]
          : []),
        ...(recommendationIds.length
          ? [{ entity_type: "recommendation" as const, entity_id: { in: recommendationIds } }]
          : []),
        ...(forumQuestionIds.length
          ? [{ entity_type: "forum" as const, entity_id: { in: forumQuestionIds } }]
          : []),
      ],
    },
    include: { tag: true },
  });

  const tagsById = new Map<string, PublicTag>();
  for (const entityTag of entityTags) {
    if (entityTag.tag) {
      tagsById.set(entityTag.tag.id, pickPublicTagFields(entityTag.tag));
    }
  }

  return [...tagsById.values()].sort((a, b) => a.name.localeCompare(b.name, "he"));
}

export async function getUserActivity(user_id: string) {
  return getUserProfilePageData(user_id);
}

export async function getUserProfilePageData(user_id: string): Promise<UserProfilePageData> {
  const [materials, recommendations, forumQuestions, forumAnswers, events, focus_tags] =
    await Promise.all([
      prisma.material.findMany({
        where: { user_id },
        include: { user: true, material_type: true },
        orderBy: { created_at: "desc" },
      }),
      prisma.recommendation.findMany({
        where: { user_id },
        include: { user: true, comments: true },
        orderBy: { created_at: "desc" },
      }),
      prisma.forumQuestion.findMany({
        where: { user_id },
        include: { user: true, answers: true },
        orderBy: { created_at: "desc" },
      }),
      prisma.forumAnswer.findMany({
        where: { user_id },
        include: { user: true, replies: true },
        orderBy: { created_at: "desc" },
      }),
      prisma.event.findMany({
        where: { user_id },
        include: { user: true, comments: { include: { user: true } } },
        orderBy: { created_at: "desc" },
      }),
      getUserFocusTags(user_id),
    ]);

  const questionIds = forumQuestions.map((item) => item.id);
  const answerIds = forumAnswers.map((item) => item.id);

  const [questionLikes, answerLikes] = await Promise.all([
    countForumLikes("question", questionIds),
    countForumLikes("answer", answerIds),
  ]);

  return {
    materials: materials.map(pickPublicMaterialFields),
    recommendations: recommendations.map(pickPublicRecommendationFields),
    forum_questions: forumQuestions.map((question) => ({
      ...pickPublicForumQuestionFields(question),
      like_count: questionLikes.get(question.id) ?? 0,
      answer_count: question.answers.length,
    })),
    forum_answers: forumAnswers.map((answer) => ({
      ...pickPublicForumAnswerFields(answer),
      like_count: answerLikes.get(answer.id) ?? 0,
      reply_count: answer.replies.length,
    })),
    events: events.map(pickPublicEventFields),
    focus_tags,
  };
}
