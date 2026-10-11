import { Suspense } from "react";
import { ForumLikeButton } from "@/components/forum/ForumLikeButton";
import { ForumSearchForm } from "@/components/forum/ForumSearchForm";
import { PostForumQuestionForm } from "@/components/forum/PostForumQuestionForm";
import { ContentCard } from "@/components/ui/ContentCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ModalButton } from "@/components/ui/Modal";
import { PageHero } from "@/components/ui/PageHero";
import { Pagination } from "@/components/ui/Pagination";
import { fetchAuthenticatedProfile } from "@/lib/actions/auth";
import { fetchEntityTagsForEntities, fetchForumQuestionCount, searchForum } from "@/lib/data";
import { enrichForumQuestionsWithLikes } from "@/lib/services/forum-likes";
import { countLabel, formatDate } from "@/lib/utils/format";
import { pageWindow, parsePage, totalPages } from "@/lib/utils/pagination";

type ForumPageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function ForumPage({ searchParams }: ForumPageProps) {
  const { q, page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const auth = await fetchAuthenticatedProfile();
  const [questionsRaw, total] = await Promise.all([
    searchForum({ query: q, ...pageWindow(page) }),
    fetchForumQuestionCount({ query: q }),
  ]);
  const [questions, tagsByQuestion] = await Promise.all([
    enrichForumQuestionsWithLikes(questionsRaw, auth?.userId),
    fetchEntityTagsForEntities("forum", questionsRaw.map((question) => question.id)),
  ]);

  return (
    <>
      <PageHero
        title="פורום שאלות ותשובות"
        subtitle="התייעצו עם עמיתים, שאלו ושתפו ידע מקצועי."
        actions={
          <ModalButton label="שאלה חדשה" icon="add" title="פרסום שאלה">
            <PostForumQuestionForm />
          </ModalButton>
        }
      />

      <div className="ui-toolbar">
        <Suspense fallback={null}>
          <ForumSearchForm />
        </Suspense>
      </div>

      {q && (
        <p className="muted">
          {countLabel(total, "תוצאה", "תוצאות")} עבור &quot;{q}&quot;
        </p>
      )}

      {questions.length === 0 ? (
        <EmptyState
          icon="forum"
          title={q ? "לא נמצאו שאלות" : "עדיין אין שאלות"}
          description={q ? "נסו מילות חיפוש אחרות." : "היו הראשונים לשאול שאלה בקהילה."}
        />
      ) : (
        <ul className="ui-list">
          {questions.map((question) => (
            <li key={question.id}>
              <ContentCard
                href={`/forum/${question.id}`}
                title={question.title}
                excerpt={question.content}
                author={question.user?.full_name}
                dateLabel={formatDate(question.created_at)}
                tags={tagsByQuestion.get(question.id)}
                stats={[
                  {
                    icon: "chat_bubble",
                    label: countLabel(question.answer_count ?? 0, "תשובה", "תשובות"),
                  },
                ]}
                footer={
                  <ForumLikeButton
                    targetType="question"
                    targetId={question.id}
                    initialCount={question.like_count}
                    initialLiked={question.user_liked}
                  />
                }
              />
            </li>
          ))}
        </ul>
      )}

      <Pagination basePath="/forum" params={{ q }} page={page} totalPages={totalPages(total)} />
    </>
  );
}
