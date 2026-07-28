"use client";

import type { PublicTag } from "@/lib/models/tag";
import { getTagBadgeStyle } from "@/lib/utils/tag-colors";

type TagSelectProps = {
  id?: string;
  tags: PublicTag[];
  value: string[];
  onChange: (value: string[]) => void;
  required?: boolean;
};

export function TagSelect({
  id = "tags",
  tags,
  value,
  onChange,
  required = false,
}: TagSelectProps) {
  function toggleTag(tagId: string) {
    if (value.includes(tagId)) {
      onChange(value.filter((item) => item !== tagId));
      return;
    }
    onChange([...value, tagId]);
  }

  return (
    <div className="form-field">
      <label id={`${id}-label`}>
        תגיות{required ? " (חובה)" : ""}
      </label>
      {tags.length === 0 ? (
        <p className="muted">אין תגיות זמינות. פנו למנהל המערכת.</p>
      ) : (
        <div
          id={id}
          className="tag-select"
          role="group"
          aria-labelledby={`${id}-label`}
          aria-required={required}
        >
          {tags.map((tag) => {
            const selected = value.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                className={`tag-chip${selected ? " is-selected" : ""}`}
                style={getTagBadgeStyle(tag.color)}
                aria-pressed={selected}
                onClick={() => toggleTag(tag.id)}
              >
                {tag.name}
              </button>
            );
          })}
        </div>
      )}
      <p className="muted">לחצו לבחירת תגית אחת או יותר.</p>
    </div>
  );
}
