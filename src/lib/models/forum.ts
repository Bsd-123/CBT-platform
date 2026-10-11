import type { ForumAnswer, ForumQuestion, Tag } from "@/lib/db/types";
import { pickPublicTagFields } from "@/lib/models/tag";
import { pickPublicUserFields } from "@/lib/models/user";

export type { ForumQuestion, ForumAnswer };

export type CreateForumQuestionInput = {
  user_id: string;
  title: string;
  content: string;
  /** Id of the tag chosen as the question's domain. */
  domain_tag_id: string;
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
  skip?: number;
  take?: number;
};

export function pickPublicForumQuestionFields(
  question: ForumQuestion & {
    user?: Parameters<typeof pickPublicUserFields>[0];
    domain?: Tag | null;
    answers?: Parameters<typeof pickPublicForumAnswerFields>[0][];
    _count?: { answers: number };
  },
) {
  return {
    id: question.id,
    user_id: question.user_id,
    title: question.title,
    content: question.content,
    created_at: question.created_at,
    user: question.user ? pickPublicUserFields(question.user) : undefined,
    domain: question.domain ? pickPublicTagFields(question.domain) : null,
    answers: question.answers?.map(pickPublicForumAnswerFields),
    answer_count: question._count?.answers,
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
