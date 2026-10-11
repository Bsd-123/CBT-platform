import type { UserRole } from "@/lib/db/types";

export const ANSWER_SORTS = ["top", "newest", "oldest"] as const;
export type AnswerSort = (typeof ANSWER_SORTS)[number];

export const ANSWER_SORT_LABELS: Record<AnswerSort, string> = {
  top: "המדורגות ביותר",
  newest: "החדשות ביותר",
  oldest: "הישנות ביותר",
};

/** Reads the `?sort=` value; anything unknown falls back to the default ordering. */
export function parseAnswerSort(value: string | string[] | undefined): AnswerSort {
  const raw = Array.isArray(value) ? value[0] : value;
  return (ANSWER_SORTS as readonly string[]).includes(raw ?? "") ? (raw as AnswerSort) : "top";
}

type SortableAnswer = { id: string; created_at: Date; like_count: number };

/** Orders answers; equal scores keep the older answer first so the order is stable. */
export function sortAnswers<T extends SortableAnswer>(answers: T[], sort: AnswerSort): T[] {
  const byDate = (a: T, b: T) => a.created_at.getTime() - b.created_at.getTime();
  const sorted = [...answers];
  if (sort === "newest") return sorted.sort((a, b) => byDate(b, a));
  if (sort === "oldest") return sorted.sort(byDate);
  return sorted.sort((a, b) => b.like_count - a.like_count || byDate(a, b));
}

/**
 * The answer shown in the highlighted card: the one with the most likes. An answer nobody has
 * liked is not "top", so a thread without any likes has no highlighted answer.
 */
export function pickTopAnswer<T extends SortableAnswer>(answers: T[]): T | null {
  const [best] = sortAnswers(answers, "top");
  return best && best.like_count > 0 ? best : null;
}

/** Number of nested replies under an answer, at every depth. */
export function countReplies(answer: { replies?: { replies?: unknown[] }[] }): number {
  return (answer.replies ?? []).reduce(
    (total, reply) => total + 1 + countReplies(reply as { replies?: { replies?: unknown[] }[] }),
    0,
  );
}

export type AuthorBadge = { label: string; kind: "op" | "expert" | "admin" };

/** Badges shown next to an author: OP for the asker, plus a role badge for experts and admins. */
export function authorBadges(options: {
  authorId: string;
  questionOwnerId: string;
  role?: UserRole | null;
}): AuthorBadge[] {
  const badges: AuthorBadge[] = [];
  if (options.authorId === options.questionOwnerId) badges.push({ label: "שואל/ת השאלה", kind: "op" });
  if (options.role === "expert") badges.push({ label: "מומחה", kind: "expert" });
  if (options.role === "admin") badges.push({ label: "מנהל/ת", kind: "admin" });
  return badges;
}

/** Up to two initials for an avatar ("דנה לוי" -> "דל"). */
export function initialsOf(name: string | null | undefined): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return words
    .slice(0, 2)
    .map((word) => [...word][0])
    .join("");
}
