"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

let bodyScrollLockCount = 0;
let previousBodyOverflow = "";

function lockBodyScroll() {
  bodyScrollLockCount += 1;
  if (bodyScrollLockCount === 1) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
}

function unlockBodyScroll() {
  bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1);
  if (bodyScrollLockCount === 0) {
    document.body.style.overflow = previousBodyOverflow;
    previousBodyOverflow = "";
  }
}

const escapeCloseStack: Array<() => void> = [];
let escapeListenerAttached = false;

function ensureEscapeListener() {
  if (escapeListenerAttached || typeof window === "undefined") {
    return;
  }
  escapeListenerAttached = true;
  window.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Escape") {
        return;
      }
      escapeCloseStack[escapeCloseStack.length - 1]?.();
    },
    true,
  );
}

export function CenteredOverlay({
  children,
  onClose,
  zClass = "z-50",
  backdropClassName = "bg-amal-black/40",
  closeOnBackdrop = true,
}: {
  children: ReactNode;
  onClose: () => void;
  zClass?: string;
  backdropClassName?: string;
  closeOnBackdrop?: boolean;
}) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!mounted) {
      return;
    }
    lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    ensureEscapeListener();
    escapeCloseStack.push(onClose);
    return () => {
      const index = escapeCloseStack.lastIndexOf(onClose);
      if (index >= 0) {
        escapeCloseStack.splice(index, 1);
      }
    };
  }, [mounted, onClose]);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      className={`fixed inset-0 flex min-h-dvh w-full items-center justify-center overflow-y-auto ${zClass}`}
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className={`absolute inset-0 z-0 border-0 ${closeOnBackdrop ? "cursor-pointer" : "cursor-default"} ${backdropClassName}`}
        onClick={() => {
          if (closeOnBackdrop) {
            onClose();
          }
        }}
      />
      <div className="pointer-events-none relative z-10 my-auto flex w-full min-h-0 max-h-full max-w-full justify-center p-4">
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function Modal({
  title,
  onClose,
  children,
  compact = false,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  compact?: boolean;
  wide?: boolean;
}) {
  return (
    <CenteredOverlay
      onClose={onClose}
      zClass={compact ? "z-[90]" : "z-50"}
      backdropClassName={compact ? "bg-amal-black/50" : "bg-amal-black/40"}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`pointer-events-auto max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-amal-white p-6 shadow-xl ${
          compact ? "max-w-md" : wide ? "max-w-4xl" : "max-w-lg"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        {compact ? (
          <h3 className="text-lg font-bold">{title}</h3>
        ) : (
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
        )}
        {children}
      </div>
    </CenteredOverlay>
  );
}

export function WideModal({
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <CenteredOverlay onClose={onClose} backdropClassName="bg-amal-black/45">
      <div
        role="dialog"
        aria-modal="true"
        className="pointer-events-auto flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-black/10 bg-amal-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-black/10 p-5">
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="text-sm font-semibold text-zinc-500 hover:text-amal-ink"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {footer ? (
          <div className="flex shrink-0 justify-end gap-2 border-t border-black/10 p-5">
            {footer}
          </div>
        ) : null}
      </div>
    </CenteredOverlay>
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
  pageSizeOptions,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  count: number;
  onPage: (page: number) => void;
  pageSizeOptions?: readonly number[];
  onPageSizeChange?: (size: number) => void;
}) {
  if (count <= 0) {
    return null;
  }
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, count);
  const last = page * pageSize >= count;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-4 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        {pageSizeOptions && onPageSizeChange ? (
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Rows per page
            <select
              className="rounded-lg border border-black/15 bg-amal-white px-2 py-1.5 text-sm font-normal text-amal-ink"
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              aria-label="Rows per page"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <p className="text-zinc-500">
          Showing {start}–{end} of {count}
        </p>
      </div>
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
