import Link from "next/link";

/** Previous / next links that keep other query parameters (e.g. ?q=). */
export function Pagination({
  page,
  totalPages,
  basePath,
  query = {},
}: {
  page: number;
  totalPages: number;
  basePath: string;
  query?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;
  const href = (p: number) => {
    const qs = new URLSearchParams(Object.entries({ ...query, page: p > 1 ? String(p) : undefined }).filter(([, v]) => v) as [string, string][]);
    return `${basePath}${qs.size ? `?${qs}` : ""}`;
  };
  return (
    <nav aria-label="Pages" className="mt-10 flex items-center justify-between gap-4">
      {page > 1 ? (
        <Link href={href(page - 1)} className="eyebrow rounded-button border-2 border-teal-700 px-4 py-2" rel="prev">
          Newer
        </Link>
      ) : (
        <span />
      )}
      <span className="text-small text-ink-500">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={href(page + 1)} className="eyebrow rounded-button border-2 border-teal-700 px-4 py-2" rel="next">
          Older
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
