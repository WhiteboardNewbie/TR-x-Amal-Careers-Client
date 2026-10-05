"use client";

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-auto bg-amal-black/40 p-4 pt-16">
      <div className="w-full max-w-lg rounded-2xl bg-amal-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            type="button"
            className="text-sm font-semibold text-zinc-500 hover:text-amal-ink"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mb-3 block text-sm font-semibold text-amal-ink">
      {label}
      <div className="mt-1 font-normal">{children}</div>
    </label>
  );
}

export const inputClass =
  "h-10 w-full rounded-lg border border-black/15 bg-amal-white px-3 text-sm outline-none focus:border-amal-red focus:ring-2 focus:ring-amal-red/20";

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-lg bg-amal-red px-4 py-2 text-sm font-semibold text-amal-white disabled:opacity-60 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-lg border border-black/15 bg-amal-white px-4 py-2 text-sm font-semibold text-amal-ink hover:bg-amal-sheet disabled:opacity-60 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function TablePager({
  page,
  pageSize,
  count,
  onPage,
}: {
  page: number;
  pageSize: number;
  count: number;
  onPage: (page: number) => void;
}) {
  if (count <= 0) {
    return null;
  }
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, count);
  const last = page * pageSize >= count;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-4 text-sm">
      <p className="text-zinc-500">
        Showing {start}–{end} of {count}
      </p>
      <div className="flex gap-2">
        <GhostButton disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </GhostButton>
        <GhostButton disabled={last} onClick={() => onPage(page + 1)}>
          Next
        </GhostButton>
      </div>
    </div>
  );
}
