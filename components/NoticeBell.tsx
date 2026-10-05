"use client";

import { useEffect, useRef, useState } from "react";
import { getNotifications } from "@/lib/api";
import type { Notice } from "@/lib/types";

export function NoticeBell() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ignore = false;
    getNotifications()
      .then((rows) => {
        if (!ignore) {
          setNotices(rows);
        }
      })
      .catch(() => {
        if (!ignore) {
          setNotices([]);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, []);

  const unread = notices.filter((notice) => !notice.is_read).length;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-amal-ink hover:bg-amal-sheet"
        onClick={() => setOpen((next) => !next)}
        aria-label={unread ? `${unread} unread notices` : "Notices"}
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 22a2.4 2.4 0 0 0 2.4-2.4h-4.8A2.4 2.4 0 0 0 12 22zm7.2-6V11a7.2 7.2 0 0 0-5.4-7V3.2a1.8 1.8 0 1 0-3.6 0V4a7.2 7.2 0 0 0-5.4 7v5L3 18v1.2h18V18l-1.8-2z"
          />
        </svg>
        {unread > 0 ? (
          <span className="absolute right-1 top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-amal-red px-1 text-[0.65rem] font-semibold leading-4 text-amal-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-xl border border-black/10 bg-amal-white shadow-lg">
          <p className="border-b border-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Notices
          </p>
          {notices.length === 0 ? (
            <p className="px-4 py-6 text-sm text-zinc-500">No notices yet.</p>
          ) : (
            <ul className="max-h-80 overflow-auto">
              {notices.map((notice) => (
                <li
                  key={notice.id}
                  className="border-b border-black/5 px-4 py-3 last:border-0"
                >
                  <p className="text-sm font-semibold text-amal-ink">
                    {notice.title}
                    {!notice.is_read ? (
                      <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-amal-red align-middle" />
                    ) : null}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">{notice.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
