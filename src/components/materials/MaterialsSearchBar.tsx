"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { MaterialIcon } from "@/components/shared/MaterialIcon";

type MaterialsSearchBarProps = {
  defaultValue?: string;
};

export function MaterialsSearchBar({ defaultValue = "" }: MaterialsSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(defaultValue);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = query.trim();

    params.delete("page");
    if (trimmed) params.set("q", trimmed);
    else params.delete("q");

    const next = params.toString();
    router.push(next ? `/materials?${next}` : "/materials");
  }

  return (
    <form className="materials-toolbar" onSubmit={handleSubmit}>
      <div className="materials-search-wrap">
        <MaterialIcon name="search" />
        <input
          className="materials-search-input"
          type="search"
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="חיפוש בתוך ספריית החומרים..."
          aria-label="חיפוש חומרים"
        />
      </div>
      <button type="submit" className="materials-btn-secondary">
        <MaterialIcon name="filter_list" />
        חיפוש
      </button>
    </form>
  );
}
