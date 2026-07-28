"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function ForumSearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) {
      params.set("q", query.trim());
    }
    router.push(`/forum?${params.toString()}`);
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="forum-search">חיפוש בפורום</label>
        <input
          id="forum-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="חיפוש לפי כותרת או תוכן..."
        />
      </div>
      <button type="submit" className="button">
        חיפוש
      </button>
    </form>
  );
}
