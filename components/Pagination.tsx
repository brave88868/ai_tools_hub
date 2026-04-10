import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

function pageUrl(basePath: string, page: number) {
  return page === 1 ? basePath : `${basePath}?page=${page}`;
}

export default function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  // Build page number list with ellipsis
  const pages: (number | "...")[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  const btnBase =
    "inline-flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium transition-colors";
  const btnActive = "bg-indigo-600 text-white";
  const btnDefault = "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50";
  const btnDisabled = "bg-white border border-gray-200 text-gray-300 cursor-not-allowed pointer-events-none";

  return (
    <div className="flex items-center justify-center gap-1.5 mt-10">
      {currentPage === 1 ? (
        <span className={`${btnBase} ${btnDisabled} px-3 w-auto`}>← Prev</span>
      ) : (
        <Link href={pageUrl(basePath, currentPage - 1)} className={`${btnBase} ${btnDefault} px-3 w-auto`}>
          ← Prev
        </Link>
      )}

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-1 text-gray-400">…</span>
        ) : (
          <Link
            key={p}
            href={pageUrl(basePath, p)}
            className={`${btnBase} ${p === currentPage ? btnActive : btnDefault}`}
          >
            {p}
          </Link>
        )
      )}

      {currentPage === totalPages ? (
        <span className={`${btnBase} ${btnDisabled} px-3 w-auto`}>Next →</span>
      ) : (
        <Link href={pageUrl(basePath, currentPage + 1)} className={`${btnBase} ${btnDefault} px-3 w-auto`}>
          Next →
        </Link>
      )}
    </div>
  );
}
