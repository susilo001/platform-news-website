import Link from "next/link";
import { pageSize } from "@/lib/config";
export function Pagination({
  page,
  total,
  base,
  query,
}: {
  page: number;
  total: number;
  base: string;
  query?: string;
}) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  const url = (p: number) =>
    `${base}?${new URLSearchParams({ ...(query ? { q: query } : {}), page: String(p) })}`;
  return (
    <nav aria-label="Pagination" className="pagination">
      {page > 1 && (
        <Link className="button secondary" href={url(page - 1)}>
          ← Previous
        </Link>
      )}
      <span>
        Page {page} of {pages}
      </span>
      {page < pages && (
        <Link className="button secondary" href={url(page + 1)}>
          Next →
        </Link>
      )}
    </nav>
  );
}
