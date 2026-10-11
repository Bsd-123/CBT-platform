"use client";

import { useState } from "react";
import { MaterialIcon } from "@/components/shared/MaterialIcon";
import { submitEventFavorite } from "@/lib/actions/submit";
import { unwrap } from "@/lib/actions/result";

type FavoriteEventButtonProps = {
  eventId: string;
  initialFavorited: boolean;
};

/** Star toggle: favorited events email the member when the organizer changes them. */
export function FavoriteEventButton({ eventId, initialFavorited }: FavoriteEventButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const next = !favorited;
    setError(null);
    setLoading(true);
    setFavorited(next); // optimistic; rolled back below if the server refuses
    try {
      unwrap(await submitEventFavorite(eventId, next));
    } catch (toggleError) {
      setFavorited(!next);
      setError(toggleError instanceof Error ? toggleError.message : "הפעולה נכשלה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="event-favorite">
      <button
        type="button"
        className={`event-favorite-btn${favorited ? " is-active" : ""}`}
        aria-pressed={favorited}
        disabled={loading}
        onClick={() => void toggle()}
        title="מועדפים: תקבלו אימייל כשהאירוע מתעדכן"
      >
        <MaterialIcon name="star" filled={favorited} />
        {favorited ? "במועדפים" : "הוספה למועדפים"}
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
