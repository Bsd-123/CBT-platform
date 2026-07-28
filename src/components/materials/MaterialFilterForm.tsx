"use client";

import { useRouter } from "next/navigation";
import type { PublicMaterialType } from "@/lib/models/material-type";
import type { PublicTag } from "@/lib/models/tag";
import { getTagBadgeStyle } from "@/lib/utils/tag-colors";

type MaterialFilterFormProps = {
  materialTypes: PublicMaterialType[];
  tags: PublicTag[];
  currentType?: string;
  currentSearch?: string;
  currentTagIds?: string[];
};

export function MaterialFilterForm({
  materialTypes,
  tags,
  currentType,
  currentSearch = "",
  currentTagIds = [],
}: MaterialFilterFormProps) {
  const router = useRouter();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    const type = String(formData.get("type") ?? "").trim();
    const q = String(formData.get("q") ?? "").trim();
    const selectedTags = formData.getAll("tags").map(String).filter(Boolean);

    if (type) params.set("type", type);
    if (q) params.set("q", q);
    if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));

    const query = params.toString();
    router.push(query ? `/materials?${query}` : "/materials");
  }

  function handleReset() {
    router.push("/materials");
  }

  return (
    <form className="stack material-filter-form" onSubmit={handleSubmit}>
      <h2>סינון וחיפוש</h2>
      <div className="grid-2">
        <div className="form-field">
          <label htmlFor="material-search">שם / תיאור</label>
          <input
            id="material-search"
            name="q"
            defaultValue={currentSearch}
            placeholder="חיפוש לפי שם או תיאור"
          />
        </div>
        <div className="form-field">
          <label htmlFor="material-filter-type">סוג חומר</label>
          <select id="material-filter-type" name="type" defaultValue={currentType ?? ""}>
            <option value="">כל הסוגים</option>
            {materialTypes.map((type) => (
              <option key={type.id} value={type.key}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="tag-filter-fieldset">
        <legend>תגיות</legend>
        {tags.length === 0 ? (
          <p className="muted">אין תגיות זמינות.</p>
        ) : (
          <div className="tag-filter-options">
            {tags.map((tag) => (
              <label key={tag.id} className="tag-filter-option">
                <input
                  type="checkbox"
                  name="tags"
                  value={tag.id}
                  defaultChecked={currentTagIds.includes(tag.id)}
                />
                <span className="badge tag-badge" style={getTagBadgeStyle(tag.color)}>
                  {tag.name}
                </span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="filter-actions">
        <button type="submit" className="button">החל סינון</button>
        <button type="button" className="button secondary" onClick={handleReset}>
          נקה
        </button>
      </div>
    </form>
  );
}
