import type { ForumAnswer, ForumQuestion } from "@prisma/client";
import { pickPublicUserFields } from "@/lib/models/user";

export type { ForumQuestion, ForumAnswer };

export type CreateForumQuestionInput = {
  user_id: string;
  title: string;
  content: string;
};

export type CreateForumAnswerInput = {
  question_id: string;
  user_id: string;
  content: string;
  parent_answer_id?: string | null;
};

export type SearchForumQuestionsFilter = {
  query?: string;
  include_hidden?: boolean;
};

export function pickPublicForumQuestionFields(
  question: ForumQuestion & {
    user?: Parameters<typeof pickPublicUserFields>[0];
    answers?: Parameters<typeof pickPublicForumAnswerFields>[0][];
  },
) {
  return {
    id: question.id,
    user_id: question.user_id,
    title: question.title,
    content: question.content,
    created_at: question.created_at,
    user: question.user ? pickPublicUserFields(question.user) : undefined,
    answers: question.answers?.map(pickPublicForumAnswerFields),
  };
}

export type PublicForumAnswer = {
  id: string;
  question_id: string;
  user_id: string;
  content: string;
  parent_answer_id: string | null;
  created_at: Date;
  user?: ReturnType<typeof pickPublicUserFields>;
  replies?: PublicForumAnswer[];
};

export function pickPublicForumAnswerFields(
  answer: ForumAnswer & {
    user?: Parameters<typeof pickPublicUserFields>[0];
    replies?: Parameters<typeof pickPublicForumAnswerFields>[0][];
  },
): PublicForumAnswer {
  return {
    id: answer.id,
    question_id: answer.question_id,
    user_id: answer.user_id,
    content: answer.content,
    parent_answer_id: answer.parent_answer_id,
    created_at: answer.created_at,
    user: answer.user ? pickPublicUserFields(answer.user) : undefined,
    replies: answer.replies?.map(pickPublicForumAnswerFields),
  };
}

export type PublicForumQuestion = ReturnType<typeof pickPublicForumQuestionFields>;
