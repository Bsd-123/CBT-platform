"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MaterialIcon } from "@/components/shared/MaterialIcon";
import type { ForumLikeTargetType } from "@/lib/db/types";
import { submitForumLikeToggle } from "@/lib/actions/submit";
import { unwrap } from "@/lib/actions/result";

type ForumLikeButtonProps = {
  targetType: ForumLikeTargetType;
  targetId: string;
  initialCount: number;
  initialLiked: boolean;
  /**
   * classic: the pill used in forum lists. inline: heart + count for a post's action bar.
   * stacked: heart above the count, for the vote column beside an answer.
   */
  variant?: "classic" | "inline" | "stacked";
};

export function ForumLikeButton({
  targetType,
  targetId,
  initialCount,
  initialLiked,
  variant = "classic",
}: ForumLikeButtonProps) {
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setError(null);
    setLoading(true);

    try {
      const result = unwrap(await submitForumLikeToggle(targetType, targetId));
      setCount(result.count);
      setLiked(result.liked);
      router.refresh();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "הפעולה נכשלה");
    } finally {
      setLoading(false);
    }
  }

  if (variant !== "classic") {
    return (
      <div className={`fq-like fq-like--${variant}`}>
        <button
          type="button"
          className="fq-like-btn"
          disabled={loading}
          aria-pressed={liked}
          aria-label={liked ? "הסרת סימון אהבתי" : "סימון אהבתי"}
          onClick={() => void handleToggle()}
        >
          <MaterialIcon name="favorite" filled={liked} />
          <span className="fq-like-count">{count}</span>
        </button>
        {error && <span className="error" role="alert">{error}</span>}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
      <button
        type="button"
        className={`button secondary${liked ? " active" : ""}`}
        disabled={loading}
        aria-pressed={liked}
        onClick={() => void handleToggle()}
      >
        {liked ? "♥" : "♡"} {count}
      </button>
      {error && <span className="error">{error}</span>}
    </div>
  );
}
