"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminCreateTag, adminDeleteTag } from "@/lib/actions/admin";
import { EmptyState } from "@/components/ui/EmptyState";
import { useUi } from "@/components/ui/UiProvider";
import type { PublicTag } from "@/lib/models/tag";
import { DEFAULT_TAG_COLOR, TAG_COLORS, getTagBadgeStyle } from "@/lib/utils/tag-colors";
import { unwrap } from "@/lib/actions/result";

type AdminTagsManagerProps = {
  tags: PublicTag[];
};

export function AdminTagsManager({ tags }: AdminTagsManagerProps) {
  const router = useRouter();
  const { toast, confirm } = useUi();
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_TAG_COLOR);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    try {
      unwrap(await adminCreateTag({ name: name.trim(), color }));
      setName("");
      setColor(DEFAULT_TAG_COLOR);
      toast("התגית נוצרה");
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "יצירת התגית נכשלה", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(tag: PublicTag) {
    const approved = await confirm({
      title: `מחיקת התגית "${tag.name}"`,
      message: "התגית תוסר מכל התכנים שמסומנים בה.",
      confirmLabel: "מחיקה",
      danger: true,
    });
    if (!approved) return;

    setDeletingId(tag.id);
    try {
      unwrap(await adminDeleteTag(tag.id));
      toast("התגית נמחקה");
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "מחיקת התגית נכשלה", "error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <section className="ui-section">
        <h2>תגית חדשה</h2>
        <form className="ui-inline-form" onSubmit={handleCreate}>
          <div className="form-field">
            <label htmlFor="tag-name">שם תגית</label>
            <input
              id="tag-name"
              required
              maxLength={40}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="form-field">
            <span className="form-label" id="tag-color-label">צבע</span>
            <div className="tag-color-picker" role="radiogroup" aria-labelledby="tag-color-label">
              {TAG_COLORS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  role="radio"
                  aria-checked={color === option.key}
                  className="tag-color-swatch"
                  style={getTagBadgeStyle(option.key)}
                  onClick={() => setColor(option.key)}
                >
                  <span className="tag-color-dot" aria-hidden="true" />
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {name.trim() && (
            <p className="tag-color-preview">
              <span className="form-hint">תצוגה מקדימה:</span>
              <span className="tag" style={getTagBadgeStyle(color)}>
                {name.trim()}
              </span>
            </p>
          )}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "שומר..." : "הוספת תגית"}
          </button>
        </form>
      </section>

      <section className="ui-section">
        <h2>תגיות קיימות ({tags.length})</h2>
        {tags.length === 0 ? (
          <EmptyState icon="sell" title="אין תגיות" description="צרו את התגית הראשונה." />
        ) : (
          <ul className="ui-chip-list">
            {tags.map((tag) => (
              <li key={tag.id} className="ui-chip">
                <span className="tag" style={getTagBadgeStyle(tag.color)}>
                  {tag.name}
                </span>
                <button
                  type="button"
                  className="btn btn-danger-quiet btn-icon btn-sm"
                  aria-label={`מחיקת התגית ${tag.name}`}
                  disabled={deletingId === tag.id}
                  onClick={() => void handleDelete(tag)}
                >
                  <span className="material-symbol" aria-hidden="true">
                    delete
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
