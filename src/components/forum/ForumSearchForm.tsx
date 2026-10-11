"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { MaterialIcon } from "@/components/shared/MaterialIcon";

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
    const qs = params.toString();
    router.push(qs ? `/forum?${qs}` : "/forum");
  }

  return (
    <form role="search" onSubmit={handleSubmit}>
      <input
        id="forum-search"
        type="search"
        aria-label="חיפוש בפורום"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="חיפוש לפי כותרת או תוכן..."
      />
      <button type="submit" className="materials-btn-secondary">
        <MaterialIcon name="search" />
        חיפוש
      </button>
    </form>
  );
}
