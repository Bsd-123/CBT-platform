import Link from "next/link";
import { buildPageHref } from "@/lib/utils/pagination";

type PaginationProps = {
  basePath: string;
  /** Other query params to preserve (search text, filters, tab...). */
  params?: Record<string, string | undefined>;
  page: number;
  totalPages: number;
};

export function Pagination({ basePath, params = {}, page, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="ui-pagination" aria-label="עימוד">
      {page > 1 ? (
        <Link className="materials-btn-secondary" href={buildPageHref(basePath, params, page - 1)}>
          הקודם
        </Link>
      ) : (
        <span />
      )}
      <span>
        עמוד {page} מתוך {totalPages}
      </span>
      {page < totalPages ? (
        <Link className="materials-btn-secondary" href={buildPageHref(basePath, params, page + 1)}>
          הבא
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
