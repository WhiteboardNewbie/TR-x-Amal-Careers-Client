"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ApiError } from "@/lib/api";
import { getShareLink, getShareLinkLogs } from "@/lib/staff-api";
import type { ShareLink } from "@/lib/types";
import { ScrollTextIcon } from "./icons";
import { TablePager } from "./ui";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

type AccessLogRow = {
  id: number;
  ip_address: string;
  host: string;
  user_agent: string;
  referer: string;
  origin: string;
  scheme: string;
  path: string;
  accessed_at: string;
};

export function ShareLinkLogsScreen({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const jobApplicationQuery =
    searchParams.get("job_application")?.trim() || "";
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [link, setLink] = useState<ShareLink | null>(null);
  const [rows, setRows] = useState<AccessLogRow[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryKey = `${id}|${page}|${pageSize}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  if (loadedKey !== queryKey) {
    setLoadedKey(queryKey);
    setLoading(true);
    setError(null);
  }

  const appId =
    jobApplicationQuery ||
    (link?.job_application_id != null
      ? String(link.job_application_id)
      : link?.job_application != null
        ? String(link.job_application)
        : "");
  const backHref = appId
    ? `/staff/share-links?job_application=${encodeURIComponent(appId)}`
    : "/staff/share-links";

  useEffect(() => {
    let cancelled = false;
    Promise.all([getShareLink(id), getShareLinkLogs(id, page, pageSize)])
      .then(([detail, logs]) => {
        if (cancelled) return;
        setLink(detail);
        setRows(logs.results);
        setCount(logs.count);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load access logs for this share link.",
        );
        setLink(null);
        setRows([]);
        setCount(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, page, pageSize]);

  return (
    <div>
      <Breadcrumbs
        linkAs="careers"
        items={[
          { label: "Careers", href: "/staff" },
          { label: "Shared links", href: backHref },
          { label: "Access logs" },
        ]}
      />
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Access logs</h1>
      {link ? (
        <div className="mt-3 space-y-1 text-sm text-zinc-600">
          <p>
            <span className="font-medium text-zinc-900">
              {link.applicant_name ?? "Applicant"}
            </span>
            {link.job_opening_title ? ` · ${link.job_opening_title}` : ""}
          </p>
          <p className="break-all text-xs text-zinc-500">{link.share_url}</p>
          <p>
            Status:{" "}
            <span className="capitalize">{link.status ?? "—"}</span> · Expires{" "}
            {formatDateTime(link.expires_at)}
            {link.comment ? ` · ${link.comment}` : ""}
          </p>
        </div>
      ) : null}

      <div className="mt-6 space-y-4 rounded-2xl border border-black/10 bg-amal-white p-4 md:p-6">
        <div className="flex items-center gap-2">
          <ScrollTextIcon className="h-4 w-4 text-amal-red" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">
              Full access log
            </h2>
            <p className="text-xs text-zinc-500">{count} opens</p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500">Loading access logs…</p>
        ) : error ? (
          <p className="text-sm text-amal-red">{error}</p>
        ) : rows.length === 0 ? (
          <div className="py-6 text-center">
            <ScrollTextIcon className="mx-auto h-8 w-8 text-zinc-300" />
            <p className="mt-3 text-sm font-semibold text-zinc-900">
              No opens yet
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Access events will appear here when someone opens the public link.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-3 py-2 font-semibold">Accessed at</th>
                  <th className="px-3 py-2 font-semibold">IP</th>
                  <th className="px-3 py-2 font-semibold">Host</th>
                  <th className="px-3 py-2 font-semibold">Scheme</th>
                  <th className="px-3 py-2 font-semibold">Path</th>
                  <th className="px-3 py-2 font-semibold">Origin</th>
                  <th className="px-3 py-2 font-semibold">Referer</th>
                  <th className="px-3 py-2 font-semibold">User agent</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-black/5 align-top"
                  >
                    <td className="whitespace-nowrap px-3 py-3 text-zinc-700">
                      {formatDateTime(row.accessed_at)}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-zinc-800">
                      {row.ip_address || "—"}
                    </td>
                    <td className="px-3 py-3 text-zinc-700">
                      {row.host || "—"}
                    </td>
                    <td className="px-3 py-3 text-zinc-700">
                      {row.scheme || "—"}
                    </td>
                    <td className="max-w-[180px] break-all px-3 py-3 text-xs text-zinc-600">
                      {row.path || "—"}
                    </td>
                    <td className="max-w-[160px] break-all px-3 py-3 text-xs text-zinc-600">
                      {row.origin || "—"}
                    </td>
                    <td className="max-w-[180px] break-all px-3 py-3 text-xs text-zinc-600">
                      {row.referer || "—"}
                    </td>
                    <td className="max-w-[260px] break-all px-3 py-3 text-xs text-zinc-600">
                      {row.user_agent || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <TablePager
          page={page}
          pageSize={pageSize}
          count={count}
          onPage={setPage}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}
