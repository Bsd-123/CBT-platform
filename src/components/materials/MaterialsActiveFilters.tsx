"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { PublicTag } from "@/lib/models/tag";
import { getTagBadgeStyle } from "@/lib/utils/tag-colors";
import { MaterialIcon } from "@/components/shared/MaterialIcon";

type MaterialsActiveFiltersProps = {
  tags: PublicTag[];
  currentTagIds: string[];
  currentTypeLabel?: string;
  searchQuery?: string;
};

export function MaterialsActiveFilters({
  tags,
  currentTagIds,
  currentTypeLabel,
  searchQuery,
}: MaterialsActiveFiltersProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedTags = tags.filter((tag) => currentTagIds.includes(tag.id));
  const hasFilters =
    selectedTags.length > 0 || Boolean(currentTypeLabel) || Boolean(searchQuery?.trim());

  if (!hasFilters) return null;

  function buildClearUrl(clearTags = false, clearType = false, clearSearch = false) {
    const params = new URLSearchParams(searchParams.toString());
    if (clearTags) params.delete("tags");
    if (clearType) params.delete("type");
    if (clearSearch) params.delete("q");
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  return (
    <div className="materials-active-filters" role="status" aria-live="polite">
      <div className="materials-active-filters-label">
        <MaterialIcon name="filter_alt" />
        <span>מציג חומרים מסוננים לפי:</span>
      </div>

      <div className="materials-active-filters-chips">
        {searchQuery?.trim() && (
          <span className="materials-active-filter-chip materials-active-filter-chip-neutral">
            חיפוש: {searchQuery.trim()}
          </span>
        )}
        {currentTypeLabel && (
          <span className="materials-active-filter-chip materials-active-filter-chip-neutral">
            סוג: {currentTypeLabel}
          </span>
        )}
        {selectedTags.map((tag) => (
          <Link
            key={tag.id}
            href={buildClearUrl(true)}
            className="materials-active-filter-chip"
            style={getTagBadgeStyle(tag.color)}
            title="הסרת תגית זו מהסינון"
          >
            {tag.name}
            <MaterialIcon name="close" />
          </Link>
        ))}
      </div>

      <Link href={pathname} className="materials-active-filters-clear">
        נקה את כל הסינון
      </Link>
    </div>
  );
}
