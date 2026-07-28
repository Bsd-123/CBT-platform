import type {
  CreateForumAnswerInput,
  CreateForumQuestionInput,
  PublicForumAnswer,
  PublicForumQuestion,
  SearchForumQuestionsFilter,
} from "@/lib/models/forum";
import {
  pickPublicForumAnswerFields,
  pickPublicForumQuestionFields,
} from "@/lib/models/forum";
import { prisma } from "@/lib/db";
import { notifyForumAnswer } from "@/lib/services/notifications";
import { visibleContentWhere } from "@/lib/db/visibility";

const answerVisibility = visibleContentWhere();

const questionInclude = {
  user: true,
  answers: {
    where: { parent_answer_id: null, ...answerVisibility },
    include: {
      user: true,
      replies: {
        where: answerVisibility,
        include: {
          user: true,
          replies: { where: answerVisibility, include: { user: true } },
        },
      },
    },
    orderBy: { created_at: "asc" as const },
  },
} as const;

function buildForumSearchWhere(filter: SearchForumQuestionsFilter) {
  const base = visibleContentWhere(filter.include_hidden);

  if (!filter.query?.trim()) return base;

  const query = filter.query.trim();
  return {
    ...base,
    OR: [
      { title: { contains: query, mode: "insensitive" as const } },
      { content: { contains: query, mode: "insensitive" as const } },
    ],
  };
}

export async function getForumQuestionById(
  id: string,
  include_hidden = false,
): Promise<PublicForumQuestion | null> {
  const question = await prisma.forumQuestion.findFirst({
    where: { id, ...visibleContentWhere(include_hidden) },
    include: questionInclude,
  });
  return question ? pickPublicForumQuestionFields(question) : null;
}

export async function searchForumQuestions(
  filter: SearchForumQuestionsFilter = {},
): Promise<PublicForumQuestion[]> {
  const questions = await prisma.forumQuestion.findMany({
    where: buildForumSearchWhere(filter),
    include: { user: true },
    orderBy: { created_at: "desc" },
  });
  return questions.map(pickPublicForumQuestionFields);
}

export async function createForumQuestion(
  input: CreateForumQuestionInput,
): Promise<PublicForumQuestion> {
  const question = await prisma.forumQuestion.create({
    data: input,
    include: { user: true },
  });
  return pickPublicForumQuestionFields(question);
}

export async function createForumAnswer(
  input: CreateForumAnswerInput,
): Promise<PublicForumAnswer> {
  const question = await prisma.forumQuestion.findUnique({
    where: { id: input.question_id },
  });

  if (!question) {
    throw new Error("Forum question not found.");
  }

  const answer = await prisma.forumAnswer.create({
    data: input,
    include: { user: true },
  });

  await notifyForumAnswer(question.user_id, question.id, input.user_id);

  return pickPublicForumAnswerFields(answer);
}

export async function listForumAnswersByQuestion(
  question_id: string,
): Promise<PublicForumAnswer[]> {
  const answerVisibility = visibleContentWhere();
  const answers = await prisma.forumAnswer.findMany({
    where: { question_id, parent_answer_id: null, ...answerVisibility },
    include: {
      user: true,
      replies: {
        where: answerVisibility,
        include: {
          user: true,
          replies: { where: answerVisibility, include: { user: true } },
        },
      },
    },
    orderBy: { created_at: "asc" },
  });
  return answers.map(pickPublicForumAnswerFields);
}
