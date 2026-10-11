import Link from "next/link";
import { notFound } from "next/navigation";
import { ForumAnswerForm } from "@/components/forum/ForumAnswerForm";
import { ForumAnswersSection } from "@/components/forum/ForumAnswersSection";
import { ForumQuestionCard } from "@/components/forum/ForumQuestionCard";
import { PostForumQuestionForm } from "@/components/forum/PostForumQuestionForm";
import { MaterialIcon } from "@/components/shared/MaterialIcon";
import { ModalButton } from "@/components/ui/Modal";
import { fetchAuthenticatedProfile } from "@/lib/actions/auth";
import { fetchEntityTags, fetchForumQuestionById } from "@/lib/data";
import { parseAnswerSort } from "@/lib/forum/thread";
import { enrichForumQuestionWithLikes } from "@/lib/services/forum-likes";
import { isUuid } from "@/lib/utils/ids";

type ForumQuestionPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string }>;
};

export default async function ForumQuestionPage({ params, searchParams }: ForumQuestionPageProps) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const sort = parseAnswerSort((await searchParams).sort);
  const auth = await fetchAuthenticatedProfile();
  const [questionRaw, tags] = await Promise.all([
    fetchForumQuestionById(id),
    fetchEntityTags("forum", id),
  ]);

  if (!questionRaw) notFound();

  const question = await enrichForumQuestionWithLikes(questionRaw, auth?.userId);
  const answers = question.answers ?? [];

  return (
    <div className="fq-page">
      {/* Header and navigation */}
      <nav className="fq-breadcrumb" aria-label="נתיב ניווט">
        <ol>
          <li>
            <Link href="/">ראשי</Link>
          </li>
          <li aria-hidden="true">
            <MaterialIcon name="chevron_left" />
          </li>
          <li>
            <Link href="/forum">פורום</Link>
          </li>
          <li aria-hidden="true">
            <MaterialIcon name="chevron_left" />
          </li>
          <li className="fq-breadcrumb-current" aria-current="page">
            {question.title}
          </li>
        </ol>
      </nav>

      <div className="fq-toolbar">
        <Link href="/forum" className="ui-link-btn">
          <MaterialIcon name="arrow_forward" /> חזרה לפורום
        </Link>
        <ModalButton label="שאלה חדשה" icon="add" title="פרסום שאלה">
          <PostForumQuestionForm />
        </ModalButton>
      </div>

      {/* Main question */}
      <ForumQuestionCard
        question={question}
        tags={tags}
        answerCount={answers.length}
      />

      {/* Answers: section bar, top answer, then the rest */}
      <ForumAnswersSection
        questionId={question.id}
        questionOwnerId={question.user_id}
        answers={answers}
        sort={sort}
      />

      {/* Reply composer */}
      <section id="answer-form" className="fq-card fq-composer" aria-labelledby="composer-title">
        <h2 id="composer-title">התשובה שלך</h2>
        <ForumAnswerForm questionId={question.id} />
      </section>
    </div>
  );
}
