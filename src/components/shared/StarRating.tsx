"use client";

import { MAX_MATERIAL_RATING, MIN_MATERIAL_RATING } from "@/lib/models/material-rating";

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
};

export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = "md",
}: StarRatingProps) {
  const stars = Array.from(
    { length: MAX_MATERIAL_RATING - MIN_MATERIAL_RATING + 1 },
    (_, index) => index + MIN_MATERIAL_RATING,
  );

  return (
    <div
      className={`star-rating star-rating-${size}${readOnly ? " star-rating-readonly" : ""}`}
      role={readOnly ? "img" : "radiogroup"}
      aria-label={`דירוג ${value} מתוך ${MAX_MATERIAL_RATING}`}
    >
      {stars.map((starValue) => {
        const filled = starValue <= value;

        if (readOnly) {
          return (
            <span
              key={starValue}
              className={`star-rating-star${filled ? " is-filled" : ""}`}
              aria-hidden="true"
            >
              ★
            </span>
          );
        }

        return (
          <button
            key={starValue}
            type="button"
            className={`star-rating-star${filled ? " is-filled" : ""}`}
            aria-label={`${starValue} כוכבים`}
            aria-pressed={value === starValue}
            onClick={() => onChange?.(starValue)}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
