import Link from "next/link";
import type { ReactNode } from "react";
import { MaterialIcon } from "@/components/shared/MaterialIcon";
import { TagList } from "@/components/shared/TagList";
import type { PublicTag } from "@/lib/models/tag";

export type ContentCardStat = { icon: string; label: string };

type ContentCardProps = {
  href: string;
  title: string;
  excerpt?: string;
  author?: string | null;
  /** Pre-formatted date text, e.g. from formatDate(). */
  dateLabel?: string;
  badges?: ReactNode;
  tags?: PublicTag[];
  stats?: ContentCardStat[];
  /** Interactive content (e.g. a like button) rendered in the footer. */
  footer?: ReactNode;
  /** Optional leading element such as a date badge. */
  leading?: ReactNode;
};

/** List item card shared by Forum, Events and Professional Requests. */
export function ContentCard({
  href,
  title,
  excerpt,
  author,
  dateLabel,
  badges,
  tags,
  stats,
  footer,
  leading,
}: ContentCardProps) {
  return (
    <article className="ui-card">
      {leading}
      <div className="ui-card-body">
        <div className="ui-card-head">
          <h2 className="ui-card-title">
            <Link href={href}>{title}</Link>
          </h2>
          {badges}
        </div>

        {excerpt && <p className="ui-card-excerpt">{excerpt}</p>}

        {tags && tags.length > 0 && <TagList tags={tags} />}

        <div className="ui-card-meta">
          {author && (
            <span>
              <MaterialIcon name="person" />
              {author}
            </span>
          )}
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
          {footer}
        </div>
      </div>
    </article>
  );
}
