import "server-only";
import { getDb, rows } from "@/lib/db/client";
import type {
  Event,
  EventComment,
  ForumAnswer,
  ForumQuestion,
  Material,
  MaterialType,
  Recommendation,
  RecommendationComment,
  User,
} from "@/lib/db/types";
import { pickPublicEventFields } from "@/lib/models/event";
import { pickPublicForumAnswerFields, pickPublicForumQuestionFields } from "@/lib/models/forum";
import { pickPublicMaterialFields } from "@/lib/models/material";
import { pickPublicRecommendationFields } from "@/lib/models/recommendation";
import type { PublicTag } from "@/lib/models/tag";
import { listEntityTagsForEntities } from "@/lib/repositories/tag.repository";

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
  const counts = new Map<string, number>();
  if (target_ids.length === 0) return counts;

  const db = await getDb();
  const likes = rows<{ target_id: string }>(
    await db
      .from("forum_likes")
      .select("target_id")
      .eq("target_type", target_type)
      .in("target_id", target_ids),
  );
  for (const { target_id } of likes) counts.set(target_id, (counts.get(target_id) ?? 0) + 1);
  return counts;
}

/** Distinct tags across the user's materials, recommendations and forum questions. */
async function getUserFocusTags(
  materialIds: string[],
  recommendationIds: string[],
  forumQuestionIds: string[],
): Promise<PublicTag[]> {
  const [material, recommendation, forum] = await Promise.all([
    listEntityTagsForEntities("material", materialIds),
    listEntityTagsForEntities("recommendation", recommendationIds),
    listEntityTagsForEntities("forum", forumQuestionIds),
  ]);

  const tagsById = new Map<string, PublicTag>();
  for (const tags of [...material.values(), ...recommendation.values(), ...forum.values()]) {
    for (const tag of tags) tagsById.set(tag.id, tag);
  }
  return [...tagsById.values()].sort((a, b) => a.name.localeCompare(b.name, "he"));
}

export async function getUserActivity(user_id: string) {
  return getUserProfilePageData(user_id);
}

export async function getUserProfilePageData(user_id: string): Promise<UserProfilePageData> {
  const db = await getDb();
  const newestFirst = { ascending: false } as const;

  const [materials, recommendations, forumQuestions, forumAnswers, events] = await Promise.all([
    db
      .from("materials")
      .select("*, user:users(*), material_type:material_types!inner(*)")
      .eq("user_id", user_id)
      .order("created_at", newestFirst),
    db
      .from("recommendations")
      .select("*, user:users(*), comments:recommendation_comments(*)")
      .eq("user_id", user_id)
      .order("created_at", newestFirst),
    db
      .from("forum_questions")
      .select("*, user:users(*), answers:forum_answers(*)")
      .eq("user_id", user_id)
      .order("created_at", newestFirst),
    db
      .from("forum_answers")
      .select("*, user:users(*), replies:forum_answers!forum_answers_parent_answer_id_fkey(*)")
      .eq("user_id", user_id)
      .order("created_at", newestFirst),
    db
      .from("events")
      .select("*, user:users(*), comments:event_comments(*, user:users(*))")
      .eq("user_id", user_id)
      .order("created_at", newestFirst),
  ]);

  const materialRows = rows<Material & { user: User; material_type: MaterialType }>(materials);
  const recommendationRows = rows<Recommendation & { user: User; comments: RecommendationComment[] }>(recommendations);
  const questionRows = rows<ForumQuestion & { user: User; answers: ForumAnswer[] }>(forumQuestions);
  const answerRows = rows<ForumAnswer & { user: User; replies: ForumAnswer[] }>(forumAnswers);
  const eventRows = rows<Event & { user: User; comments: (EventComment & { user: User })[] }>(events);

  const [questionLikes, answerLikes, focus_tags] = await Promise.all([
    countForumLikes("question", questionRows.map((item) => item.id)),
    countForumLikes("answer", answerRows.map((item) => item.id)),
    getUserFocusTags(
      materialRows.map((item) => item.id),
      recommendationRows.map((item) => item.id),
      questionRows.map((item) => item.id),
    ),
  ]);

  return {
    materials: materialRows.map(pickPublicMaterialFields),
    recommendations: recommendationRows.map(pickPublicRecommendationFields),
    forum_questions: questionRows.map((question) => ({
      ...pickPublicForumQuestionFields(question),
      like_count: questionLikes.get(question.id) ?? 0,
      answer_count: question.answers.length,
    })),
    forum_answers: answerRows.map((answer) => ({
      ...pickPublicForumAnswerFields(answer),
      like_count: answerLikes.get(answer.id) ?? 0,
      reply_count: answer.replies.length,
    })),
    events: eventRows.map(pickPublicEventFields),
    focus_tags,
  };
}
