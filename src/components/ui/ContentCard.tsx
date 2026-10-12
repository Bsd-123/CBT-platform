import Link from "next/link";
import type { ReactNode } from "react";
import { MaterialIcon } from "@/components/shared/MaterialIcon";
import { TagList } from "@/components/shared/TagList";
import type { PublicTag } from "@/lib/models/tag";
import { getInitials } from "@/lib/utils/expert-approval-ui";

export type ContentCardStat = { icon: string; label: string };

type ContentCardProps = {
  href: string;
  title: string;
  excerpt?: string;
  author?: string | null;
  /** Pre-formatted date text, e.g. from formatDate(). */
  dateLabel?: string;
  /** Shows a "חדש" badge next to the title. */
  isNew?: boolean;
  badges?: ReactNode;
  tags?: PublicTag[];
  stats?: ContentCardStat[];
  /** Interactive content (e.g. a like button) rendered in the footer. */
  footer?: ReactNode;
  /** Optional leading element such as a date badge; defaults to the author's initials. */
  leading?: ReactNode;
};

/**
 * List item card shared by Forum, Events and Professional Requests.
 * The whole card is clickable (the title link is stretched over it); footer controls stay on top.
 */
export function ContentCard({
  href,
  title,
  excerpt,
  author,
  dateLabel,
  isNew = false,
  badges,
  tags,
  stats,
  footer,
  leading,
}: ContentCardProps) {
  return (
    <article className="ui-card">
      {leading ??
        (author ? (
          <span className="avatar" aria-hidden="true">
            {getInitials(author)}
          </span>
        ) : null)}
      <div className="ui-card-body">
        <div className="ui-card-head">
          <h2 className="ui-card-title">
            <Link href={href} className="ui-card-link">
              {title}
            </Link>
          </h2>
          {isNew && <span className="status status-new">חדש</span>}
          {badges}
        </div>

        {excerpt && <p className="ui-card-excerpt">{excerpt}</p>}

        {tags && tags.length > 0 && <TagList tags={tags} />}

        <div className="ui-card-meta">
          {author && <span className="ui-card-author">{author}</span>}
          {dateLabel && (
            <span>
              <MaterialIcon name="schedule" />
              {dateLabel}
            </span>
          )}
          {stats?.map((stat) => (
            <span key={stat.icon + stat.label}>
              <MaterialIcon name={stat.icon} />
              {stat.label}
            </span>
          ))}
          {footer && <span className="ui-card-actions">{footer}</span>}
        </div>
      </div>
    </article>
  );
}
