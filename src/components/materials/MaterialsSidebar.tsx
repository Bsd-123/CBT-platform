"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { MaterialTypeKey } from "@prisma/client";
import type { PublicMaterialType } from "@/lib/models/material-type";
import type { PublicTag } from "@/lib/models/tag";
import { getTagBadgeStyle } from "@/lib/utils/tag-colors";
import { getMaterialTypeIcon } from "@/lib/utils/material-type-ui";
import { MaterialIcon } from "@/components/shared/MaterialIcon";

type MaterialsSidebarProps = {
  materialTypes: PublicMaterialType[];
  typeCounts: Record<string, number>;
  totalCount: number;
  tags: PublicTag[];
  currentType?: MaterialTypeKey;
  currentTagIds: string[];
};

export function MaterialsSidebar({
  materialTypes,
  typeCounts,
  totalCount,
  tags,
  currentType,
  currentTagIds,
}: MaterialsSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function buildUrl(type?: string, tagIds?: string[]) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (type) params.set("type", type);
    else params.delete("type");

    if (tagIds && tagIds.length > 0) params.set("tags", tagIds.join(","));
    else params.delete("tags");

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  function toggleTag(tagId: string) {
    const next = currentTagIds.includes(tagId)
      ? currentTagIds.filter((id) => id !== tagId)
      : [...currentTagIds, tagId];
    router.push(buildUrl(currentType, next));
  }

  return (
    <aside className="materials-sidebar">
      <div className="materials-sidebar-panel">
        <h2 className="materials-sidebar-title">סוג חומר</h2>
        <ul className="materials-type-list">
          <li>
            <Link
              href={buildUrl(undefined, currentTagIds)}
              className={`materials-type-btn${!currentType ? " is-active" : ""}`}
            >
              <span className="materials-type-btn-label">
                <MaterialIcon name="grid_view" />
                כל החומרים
              </span>
              <span className="materials-type-count">{totalCount}</span>
            </Link>
          </li>
          {materialTypes.map((type) => (
            <li key={type.id}>
              <Link
                href={buildUrl(type.key, currentTagIds)}
                className={`materials-type-btn${currentType === type.key ? " is-active" : ""}`}
              >
                <span className="materials-type-btn-label">
                  <MaterialIcon name={getMaterialTypeIcon(type.key)} />
                  {type.label}
                </span>
                <span className="materials-type-count">{typeCounts[type.id] ?? 0}</span>
              </Link>
            </li>
          ))}
        </ul>

        <hr className="materials-sidebar-divider" />

        <div className="materials-tag-filters-header">
          <h2 className="materials-sidebar-title">
            תגיות
            {currentTagIds.length > 0 ? ` (נבחרו ${currentTagIds.length})` : ""}
          </h2>
          {currentTagIds.length > 0 && (
            <Link href={buildUrl(currentType, [])} className="materials-tag-filters-clear">
              נקה תגיות
            </Link>
          )}
        </div>
        <p className="materials-tag-filters-hint muted">
          לחצו על תגית כדי לסנן — לחיצה חוזרת מסירה מהסינון
        </p>
        {tags.length === 0 ? (
          <p className="muted">אין תגיות זמינות.</p>
        ) : (
          <div className="materials-tag-filters">
            {tags.map((tag) => {
              const active = currentTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  className={`materials-tag-filter${active ? " is-active" : ""}`}
                  style={getTagBadgeStyle(tag.color)}
                  onClick={() => toggleTag(tag.id)}
                  aria-pressed={active}
                  title={active ? "לחצו להסרה מהסינון" : "לחצו להוספה לסינון"}
                >
                  {active && <MaterialIcon name="check" className="materials-tag-filter-check" />}
                  {tag.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
