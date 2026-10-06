"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MAX_MATERIAL_RATING, MIN_MATERIAL_RATING } from "@/lib/models/material-rating";
import { submitMaterialRating } from "@/lib/actions/submit";
import { StarRating } from "@/components/shared/StarRating";
import { unwrap } from "@/lib/actions/result";

type MaterialRatingFormProps = {
  materialId: string;
  currentRating?: number | null;
};

export function MaterialRatingForm({ materialId, currentRating }: MaterialRatingFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(currentRating ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRate(nextRating: number) {
    if (loading) return;

    setRating(nextRating);
    setError(null);
    setLoading(true);

    try {
      unwrap(await submitMaterialRating(materialId, nextRating));
      router.refresh();
    } catch (submitError) {
      setRating(currentRating ?? 0);
      setError(submitError instanceof Error ? submitError.message : "הדירוג נכשל");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <h3>דירוג חומר</h3>
      <p className="muted">
        {rating > 0
          ? `הדירוג שלך: ${rating} מתוך ${MAX_MATERIAL_RATING}`
          : `לחצו על הכוכבים לדירוג (${MIN_MATERIAL_RATING}–${MAX_MATERIAL_RATING})`}
      </p>
      <StarRating value={rating} onChange={handleRate} />
      {loading && <p className="muted">שומר דירוג...</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
