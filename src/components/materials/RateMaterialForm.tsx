"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitMaterialRating } from "@/lib/actions/submit";

type RateMaterialFormProps = {
  materialId: string;
  currentRating?: number | null;
};

export function RateMaterialForm({ materialId, currentRating }: RateMaterialFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(currentRating ?? 3);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await submitMaterialRating(materialId, rating);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "הדירוג נכשל");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <h3>דירוג חומר (1–5)</h3>
      <div className="form-field">
        <label htmlFor="material-rating">דירוג</label>
        <select id="material-rating" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          {[1, 2, 3, 4, 5].map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      </div>
      {error && <p className="error">{error}</p>}
      <button type="submit" className="button" disabled={loading}>
        {loading ? "שומר..." : currentRating ? "עדכון דירוג" : "שליחת דירוג"}
      </button>
    </form>
  );
}
