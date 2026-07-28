"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { RecommendationFeedItem } from "@/lib/repositories/recommendation.repository";
import { RecommendationChatThread } from "@/components/recommendations/RecommendationChatThread";

type RecommendationsChatProps = {
  items: RecommendationFeedItem[];
};

function getHighlightId(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash.startsWith("rec-")) return null;
  return hash.slice(4);
}

export function RecommendationsChat({ items }: RecommendationsChatProps) {
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    const syncHash = () => setHighlightId(getHighlightId());
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    if (!highlightId) return;
    const element = document.getElementById(`rec-${highlightId}`);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [highlightId, items]);

  return (
    <div className="rec-chat-page">
      <header className="rec-chat-header rec-chat-header--with-action">
        <div>
          <h1>המלצות</h1>
          <p>
            שיחה מקצועית על ספרים, משחקים וסדנאות — תגובות מקושרות להמלצה עם מענה אחד לכל תגובה.
          </p>
        </div>
        <Link href="/recommendations/new" className="rec-chat-new-btn">
          <span className="material-symbols-outlined" aria-hidden="true">
            add
          </span>
          המלצה חדשה
        </Link>
      </header>

      {items.length === 0 ? (
        <div className="rec-chat-empty">
          <p>עדיין לא פורסמו המלצות.</p>
          <Link href="/recommendations/new" className="rec-chat-new-btn">
            פרסמו את ההמלצה הראשונה
          </Link>
        </div>
      ) : (
        <div className="rec-chat-feed">
          {items.map((item) => (
            <RecommendationChatThread
              key={item.id}
              item={item}
              highlighted={highlightId === item.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
