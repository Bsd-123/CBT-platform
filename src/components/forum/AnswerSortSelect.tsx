"use client";

import { usePathname, useRouter } from "next/navigation";
import { ANSWER_SORTS, ANSWER_SORT_LABELS, type AnswerSort } from "@/lib/forum/thread";

/** Changes `?sort=`; the server re-renders the thread in the new order (shareable URL). */
export function AnswerSortSelect({ value }: { value: AnswerSort }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="fq-sort">
      <label htmlFor="answer-sort">מיון לפי</label>
      <select
        id="answer-sort"
        value={value}
        onChange={(event) => {
          const next = event.target.value as AnswerSort;
          router.replace(next === "top" ? pathname : `${pathname}?sort=${next}`, { scroll: false });
        }}
      >
        {ANSWER_SORTS.map((sort) => (
          <option key={sort} value={sort}>
            {ANSWER_SORT_LABELS[sort]}
          </option>
        ))}
      </select>
    </div>
  );
}
