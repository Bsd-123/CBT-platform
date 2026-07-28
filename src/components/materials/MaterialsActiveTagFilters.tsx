import Link from "next/link";
import type { MaterialTypeKey } from "@prisma/client";
import type { PublicTag } from "@/lib/models/tag";
import { getTagBadgeStyle } from "@/lib/utils/tag-colors";
import { MaterialIcon } from "@/components/shared/MaterialIcon";

type MaterialsActiveTagFiltersProps = {
  selectedTags: PublicTag[];
  currentType?: MaterialTypeKey;
  currentQuery?: string;
};

function buildMaterialsUrl(options: {
  type?: MaterialTypeKey;
  q?: string;
  tagIds: string[];
}): string {
  const params = new URLSearchParams();

  if (options.type) params.set("type", options.type);
  if (options.q) params.set("q", options.q);
  if (options.tagIds.length > 0) params.set("tags", options.tagIds.join(","));

  const query = params.toString();
  return query ? `/materials?${query}` : "/materials";
}

export function MaterialsActiveTagFilters({
  selectedTags,
  currentType,
  currentQuery,
}: MaterialsActiveTagFiltersProps) {
  if (selectedTags.length === 0) {
    return null;
  }

  const clearAllHref = buildMaterialsUrl({
    type: currentType,
    q: currentQuery,
    tagIds: [],
  });

  return (
    <div className="materials-active-filters" role="status" aria-live="polite">
      <span className="materials-active-filters-label">
        <MaterialIcon name="filter_alt" />
        מסונן לפי תגיות:
      </span>
      <div className="materials-active-filters-chips">
        {selectedTags.map((tag) => {
          const nextTagIds = selectedTags
            .filter((item) => item.id !== tag.id)
            .map((item) => item.id);

          return (
            <Link
              key={tag.id}
              href={buildMaterialsUrl({
                type: currentType,
                q: currentQuery,
                tagIds: nextTagIds,
              })}
              className="materials-active-filter-chip"
              style={getTagBadgeStyle(tag.color)}
              title="הסרת תגית מהסינון"
            >
              {tag.name}
              <MaterialIcon name="close" className="materials-active-filter-chip-remove" />
            </Link>
          );
        })}
      </div>
      <Link href={clearAllHref} className="materials-active-filters-clear">
        נקה הכל
      </Link>
    </div>
  );
}
