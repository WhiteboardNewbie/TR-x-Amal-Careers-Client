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

  return (
    <nav
      className="mt-12 flex items-center justify-center gap-3 text-sm text-zinc-500"
      aria-label="Pagination"
    >
      <button
        type="button"
        className="px-2 disabled:opacity-30"
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
              ? "font-semibold text-zinc-950"
              : "hover:text-zinc-950"
          }
          aria-current={page === activePage ? "page" : undefined}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        className="px-2 disabled:opacity-30"
        disabled={activePage === totalPages}
        onClick={() => onPageChange(activePage + 1)}
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  );
}
