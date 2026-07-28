"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminCreateTag, adminDeleteTag } from "@/lib/actions/admin";
import type { PublicTag } from "@/lib/models/tag";
import { TAG_COLOR_PRESETS, getTagBadgeStyle } from "@/lib/utils/tag-colors";

type AdminTagsManagerProps = {
  tags: PublicTag[];
};

export function AdminTagsManager({ tags }: AdminTagsManagerProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(TAG_COLOR_PRESETS[0]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await adminCreateTag({ name: name.trim(), color });
      setName("");
      setColor(TAG_COLOR_PRESETS[0]);
      router.refresh();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "יצירת התגית נכשלה");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(tagId: string) {
    setError(null);
    setDeletingId(tagId);

    try {
      await adminDeleteTag(tagId);
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "מחיקת התגית נכשלה");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="stack">
      <form className="stack" onSubmit={handleCreate}>
        <h2>תגית חדשה</h2>
        <div className="form-field">
          <label htmlFor="tag-name">שם תגית</label>
          <input
            id="tag-name"
            required
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
        <button type="submit" className="button" disabled={loading}>
          {loading ? "שומר..." : "הוספת תגית"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      <section className="stack">
        <h2>תגיות קיימות ({tags.length})</h2>
        {tags.length === 0 ? (
          <p className="muted">אין תגיות.</p>
        ) : (
          <ul className="list-plain">
            {tags.map((tag) => (
              <li key={tag.id} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span className="badge tag-badge" style={getTagBadgeStyle(tag.color)}>
                  {tag.name}
                </span>
                <button
                  type="button"
                  className="button secondary"
                  disabled={deletingId === tag.id}
                  onClick={() => void handleDelete(tag.id)}
                >
                  מחיקה
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
