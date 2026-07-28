import type { ForumLikeTargetType } from "@prisma/client";
import type { PublicForumAnswer, PublicForumQuestion } from "@/lib/models/forum";
import type { ForumLikeSummary } from "@/lib/models/forum-like";
import { forumLikeKey } from "@/lib/models/forum-like";
import { getForumLikeSummaries } from "@/lib/repositories/forum-like.repository";

export type WithForumLikes = {
  like_count: number;
  user_liked: boolean;
};

export type PublicForumAnswerWithLikes = PublicForumAnswer & WithForumLikes & {
  replies?: PublicForumAnswerWithLikes[];
};

function collectAnswerTargets(answers: PublicForumAnswer[]): { target_type: ForumLikeTargetType; target_id: string }[] {
  const targets: { target_type: ForumLikeTargetType; target_id: string }[] = [];

  function walk(items: PublicForumAnswer[]) {
    for (const answer of items) {
      targets.push({ target_type: "answer", target_id: answer.id });
      if (answer.replies?.length) walk(answer.replies);
    }
  }

  walk(answers);
  return targets;
}

export function collectForumQuestionLikeTargets(question: PublicForumQuestion) {
  const targets = [
    { target_type: "question" as const, target_id: question.id },
    ...collectAnswerTargets(question.answers ?? []),
  ];
  return targets;
}

function applyLikeSummary(
  target_type: ForumLikeTargetType,
  target_id: string,
  summaries: Record<string, ForumLikeSummary>,
): WithForumLikes {
  const summary = summaries[forumLikeKey(target_type, target_id)] ?? { count: 0, liked: false };
  return { like_count: summary.count, user_liked: summary.liked };
}

function enrichAnswers(
  answers: PublicForumAnswer[],
  summaries: Record<string, ForumLikeSummary>,
): PublicForumAnswerWithLikes[] {
  return answers.map((answer) => ({
    ...answer,
    ...applyLikeSummary("answer", answer.id, summaries),
    replies: answer.replies?.length
      ? enrichAnswers(answer.replies, summaries)
      : [],
  }));
}

export async function enrichForumQuestionWithLikes(
  question: PublicForumQuestion,
  user_id?: string | null,
): Promise<PublicForumQuestion & WithForumLikes & { answers?: PublicForumAnswerWithLikes[] }> {
  const targets = collectForumQuestionLikeTargets(question);
  const summaries = await getForumLikeSummaries(targets, user_id);

  return {
    ...question,
    ...applyLikeSummary("question", question.id, summaries),
    answers: question.answers?.length
      ? enrichAnswers(question.answers, summaries)
      : [],
  };
}

export async function enrichForumQuestionsWithLikes(
  questions: PublicForumQuestion[],
  user_id?: string | null,
): Promise<(PublicForumQuestion & WithForumLikes)[]> {
  const targets = questions.map((question) => ({
    target_type: "question" as const,
    target_id: question.id,
  }));
  const summaries = await getForumLikeSummaries(targets, user_id);

  return questions.map((question) => ({
    ...question,
    ...applyLikeSummary("question", question.id, summaries),
  }));
}
