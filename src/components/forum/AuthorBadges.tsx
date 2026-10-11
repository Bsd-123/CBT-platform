import type { AuthorBadge } from "@/lib/forum/thread";

/** OP / expert / admin badges shown beside an author's name. */
export function AuthorBadges({ badges }: { badges: AuthorBadge[] }) {
  if (badges.length === 0) return null;

  return (
    <>
      {badges.map((badge) => (
        <span key={badge.kind} className="ui-badge" data-kind={badge.kind}>
          {badge.label}
        </span>
      ))}
    </>
  );
}
