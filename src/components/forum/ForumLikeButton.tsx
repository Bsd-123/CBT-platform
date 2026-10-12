"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ForumLikeTargetType } from "@/lib/db/types";
import { submitForumLikeToggle } from "@/lib/actions/submit";
import { unwrap } from "@/lib/actions/result";

type ForumLikeButtonProps = {
  targetType: ForumLikeTargetType;
  targetId: string;
  initialCount: number;
  initialLiked: boolean;
};

export function ForumLikeButton({
  targetType,
  targetId,
  initialCount,
  initialLiked,
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

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
      <button
        type="button"
        className={"btn btn-secondary"}
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
