type PaginationProps = {
  itemsPerPage: number;
  totalItems: number;
  activePage: number;
  onPageChange: (page: number) => void;
};

export function Pagination({
  itemsPerPage,
  totalItems,
  activePage,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const box =
    "inline-flex min-h-[46px] min-w-[46px] items-center justify-center rounded-lg border px-4 py-[9px] text-[18px] font-medium transition-colors";

  return (
    <nav
      className="mt-12 flex flex-wrap items-center justify-center gap-[5px]"
      aria-label="Pagination"
    >
      <button
        type="button"
        className={`${box} border-zinc-300 text-zinc-500 disabled:opacity-30`}
        disabled={activePage === 1}
        onClick={() => onPageChange(activePage - 1)}
        aria-label="Previous page"
      >
        ‹
      </button>
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          className={
            page === activePage
              ? `${box} border-amal-red text-amal-red`
              : `${box} border-zinc-300 text-zinc-500 hover:border-zinc-950 hover:text-zinc-950`
          }
          aria-current={page === activePage ? "page" : undefined}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        className={`${box} border-zinc-300 text-zinc-500 disabled:opacity-30`}
        disabled={activePage === totalPages}
        onClick={() => onPageChange(activePage + 1)}
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  );
}
