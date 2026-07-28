"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { RecommendationType } from "@prisma/client";
import { TagSelect } from "@/components/shared/TagSelect";
import type { PublicTag } from "@/lib/models/tag";
import { submitRecommendation } from "@/lib/actions/submit";

type PostRecommendationFormProps = {
  tags: PublicTag[];
  stayOnPage?: boolean;
};

const TYPES: { value: RecommendationType; label: string }[] = [
  { value: "book", label: "ספר" },
  { value: "game", label: "משחק" },
  { value: "workshop", label: "סדנה" },
];

export function PostRecommendationForm({ tags, stayOnPage = false }: PostRecommendationFormProps) {
  const router = useRouter();
  const [type, setType] = useState<RecommendationType | "">("");
  const [content, setContent] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (selectedTagIds.length === 0) {
      setError("יש לבחור לפחות תגית אחת.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const item = await submitRecommendation({
        type: type || null,
        content,
        tag_ids: selectedTagIds,
      });
      setType("");
      setContent("");
      setSelectedTagIds([]);
      if (stayOnPage) {
        router.push(`/recommendations#rec-${item.id}`);
        router.refresh();
      } else {
        router.push(`/recommendations/${item.id}`);
        router.refresh();
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "הפרסום נכשל");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <h2>פרסום המלצה</h2>
      <div className="form-field">
        <label htmlFor="rec-type">סוג (אופציונלי)</label>
        <select id="rec-type" value={type} onChange={(e) => setType(e.target.value as RecommendationType | "")}>
          <option value="">ללא סוג</option>
          {TYPES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </div>
      <div className="form-field">
        <label htmlFor="rec-content">תוכן ההמלצה</label>
        <textarea id="rec-content" rows={5} required value={content} onChange={(e) => setContent(e.target.value)} />
      </div>
      <TagSelect tags={tags} value={selectedTagIds} onChange={setSelectedTagIds} required />
      {error && <p className="error">{error}</p>}
      <button type="submit" className="button" disabled={loading}>{loading ? "מפרסם..." : "פרסום המלצה"}</button>
    </form>
  );
}
