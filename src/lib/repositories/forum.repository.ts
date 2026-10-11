import "server-only";
import type {
  CreateForumAnswerInput,
  CreateForumQuestionInput,
  PublicForumAnswer,
  PublicForumQuestion,
  SearchForumQuestionsFilter,
} from "@/lib/models/forum";
import { pickPublicForumAnswerFields, pickPublicForumQuestionFields } from "@/lib/models/forum";
import { countOf, getDb, row, rows } from "@/lib/db/client";
import { ilikeAny } from "@/lib/db/search";
import { buildReplyTree } from "@/lib/db/tree";
import type { ForumAnswer, ForumQuestion, User } from "@/lib/db/types";

// The forum_answers author (user_id) is the only foreign key to users, so the embed is unambiguous.
const WITH_AUTHOR = "*, user:users(*)";

type AnswerRow = ForumAnswer & { user: User };
type QuestionRow = ForumQuestion & { user: User };

async function loadVisibleAnswers(question_id: string): Promise<AnswerRow[]> {
  const db = await getDb();
  return rows<AnswerRow>(
    await db
      .from("forum_answers")
      .select(WITH_AUTHOR)
      .eq("question_id", question_id)
      .eq("is_hidden", false)
      .order("created_at", { ascending: true }),
  );
}

export async function getForumQuestionById(
  id: string,
  include_hidden = false,
): Promise<PublicForumQuestion | null> {
  const db = await getDb();
  let query = db.from("forum_questions").select(WITH_AUTHOR).eq("id", id);
  if (!include_hidden) query = query.eq("is_hidden", false);

  const question = row<QuestionRow>(await query.maybeSingle());
  if (!question) return null;

  const answers = await loadVisibleAnswers(id);
  return pickPublicForumQuestionFields({
    ...question,
    answers: buildReplyTree(answers, (answer) => answer.parent_answer_id),
  });
}

export async function searchForumQuestions(
  filter: SearchForumQuestionsFilter = {},
): Promise<PublicForumQuestion[]> {
  const db = await getDb();
  let query = db.from("forum_questions").select(WITH_AUTHOR);
  if (!filter.include_hidden) query = query.eq("is_hidden", false);
  const text = filter.query?.trim();
  if (text) query = query.or(ilikeAny(["title", "content"], text));
  query = query.order("created_at", { ascending: false });
  if (filter.take !== undefined) {
    const skip = filter.skip ?? 0;
    query = query.range(skip, skip + filter.take - 1);
  }
  const questions = rows<QuestionRow>(await query);

  // Visible answer count per question, in one query.
  const counts = new Map<string, number>();
  if (questions.length > 0) {
    const answers = rows<{ question_id: string }>(
      await db
        .from("forum_answers")
        .select("question_id")
        .in("question_id", questions.map((question) => question.id))
        .eq("is_hidden", false),
    );
    for (const { question_id } of answers) counts.set(question_id, (counts.get(question_id) ?? 0) + 1);
  }

  return questions.map((question) =>
    pickPublicForumQuestionFields({ ...question, _count: { answers: counts.get(question.id) ?? 0 } }),
  );
}

export async function countForumQuestions(filter: SearchForumQuestionsFilter = {}): Promise<number> {
  const db = await getDb();
  let query = db.from("forum_questions").select("id", { count: "exact", head: true });
  if (!filter.include_hidden) query = query.eq("is_hidden", false);
  const text = filter.query?.trim();
  if (text) query = query.or(ilikeAny(["title", "content"], text));
  return countOf(await query);
}

export async function createForumQuestion(
  input: CreateForumQuestionInput,
): Promise<PublicForumQuestion> {
  const db = await getDb();
  const question = row<QuestionRow>(
    await db
      .from("forum_questions")
      .insert({ user_id: input.user_id, title: input.title, content: input.content })
      .select(WITH_AUTHOR)
      .single(),
  );
  return pickPublicForumQuestionFields(question!);
}

/**
 * Reply-depth rules and the question owner's notification are handled by database triggers;
 * their errors ("Invalid parent answer.", "Maximum reply depth reached.") surface unchanged.
 */
export async function createForumAnswer(input: CreateForumAnswerInput): Promise<PublicForumAnswer> {
  const db = await getDb();
  const exists = countOf(
    await db
      .from("forum_questions")
      .select("id", { count: "exact", head: true })
      .eq("id", input.question_id)
      .eq("is_hidden", false),
  );
  if (exists === 0) throw new Error("Forum question not found.");

  const answer = row<AnswerRow>(
    await db
      .from("forum_answers")
      .insert({
        question_id: input.question_id,
        user_id: input.user_id,
        content: input.content,
        parent_answer_id: input.parent_answer_id ?? null,
      })
      .select(WITH_AUTHOR)
      .single(),
  );
  return pickPublicForumAnswerFields(answer!);
}

export async function listForumAnswersByQuestion(question_id: string): Promise<PublicForumAnswer[]> {
  const answers = await loadVisibleAnswers(question_id);
  return buildReplyTree(answers, (answer) => answer.parent_answer_id).map(pickPublicForumAnswerFields);
}
