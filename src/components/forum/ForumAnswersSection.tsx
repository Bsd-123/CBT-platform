import { AnswerSortSelect } from "@/components/forum/AnswerSortSelect";
import { ForumAnswerCard } from "@/components/forum/ForumAnswerCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { pickTopAnswer, sortAnswers, type AnswerSort } from "@/lib/forum/thread";
import type { PublicForumAnswerWithLikes } from "@/lib/services/forum-likes";
import { countLabel } from "@/lib/utils/format";

type ForumAnswersSectionProps = {
  questionId: string;
  questionOwnerId: string;
  /** Top-level answers (each with its nested replies). */
  answers: PublicForumAnswerWithLikes[];
  sort: AnswerSort;
};

/**
 * Section bar (count + sorting), then the most-liked answer in a highlighted card directly
 * above the remaining answers, which follow the chosen order.
 */
export function ForumAnswersSection({
  questionId,
  questionOwnerId,
  answers,
  sort,
}: ForumAnswersSectionProps) {
  const top = pickTopAnswer(answers);
  const others = sortAnswers(
    answers.filter((answer) => answer.id !== top?.id),
    sort,
  );

  return (
    <section className="fq-answers" aria-labelledby="answers-title">
      <div className="fq-section-bar">
        <h2 id="answers-title">{countLabel(answers.length, "תשובה", "תשובות")}</h2>
        {answers.length > 1 && <AnswerSortSelect value={sort} />}
      </div>

      {answers.length === 0 ? (
        <EmptyState
          icon="chat_bubble"
          title="עדיין אין תשובות"
          description="היו הראשונים לענות ולעזור לעמית."
        />
      ) : (
        <>
          {top && (
            <ForumAnswerCard
              questionId={questionId}
              questionOwnerId={questionOwnerId}
              answer={top}
              highlighted
            />
          )}
          {others.length > 0 && (
            <ol className="fq-answer-list">
              {others.map((answer) => (
                <li key={answer.id}>
                  <ForumAnswerCard
                    questionId={questionId}
                    questionOwnerId={questionOwnerId}
                    answer={answer}
                  />
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </section>
  );
}
