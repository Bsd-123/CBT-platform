"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminCreateTag, adminDeleteTag } from "@/lib/actions/admin";
import { EmptyState } from "@/components/ui/EmptyState";
import { useUi } from "@/components/ui/UiProvider";
import type { PublicTag } from "@/lib/models/tag";
import { TAG_COLOR_PRESETS, getTagBadgeStyle } from "@/lib/utils/tag-colors";

type AdminTagsManagerProps = {
  tags: PublicTag[];
};

export function AdminTagsManager({ tags }: AdminTagsManagerProps) {
  const router = useRouter();
  const { toast, confirm } = useUi();
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(TAG_COLOR_PRESETS[0]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    try {
      await adminCreateTag({ name: name.trim(), color });
      setName("");
      setColor(TAG_COLOR_PRESETS[0]);
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
      await adminDeleteTag(tag.id);
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
            <label htmlFor="tag-color">צבע</label>
            <select
              id="tag-color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
            >
              {TAG_COLOR_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="materials-btn-primary" disabled={loading}>
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
                <span className="badge tag-badge" style={getTagBadgeStyle(tag.color)}>
                  {tag.name}
                </span>
                <button
                  type="button"
                  className="ui-icon-btn"
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
