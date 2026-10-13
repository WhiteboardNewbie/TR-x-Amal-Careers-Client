"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import { deactivateShareLink, getShareLinks } from "@/lib/staff-api";
import type { ShareLink } from "@/lib/types";
import { EditShareLinkModal } from "./ShareApplicationModal";
import { CareersBackLink } from "./CareersBackLink";
import {
  CopyIcon,
  ExternalLinkIcon,
  EyeIcon,
  LinkIcon,
  PencilIcon,
  ScrollTextIcon,
} from "./icons";
import { TablePager } from "./ui";

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

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
  });
}

function statusTone(status: string): string {
  if (status === "active") return "bg-emerald-50 text-emerald-700";
  if (status === "expired") return "bg-amber-50 text-amber-700";
  return "bg-zinc-100 text-zinc-600";
}

function formatShareStatus(status: string | undefined): string {
  if (!status) return "—";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

export function ShareLinksScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobApplicationFilter = searchParams.get("job_application")?.trim() || "";
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(search.trim());
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ShareLink[]>([]);
  const [count, setCount] = useState(0);
  const [notice, setNotice] = useState("");
  const [editingLink, setEditingLink] = useState<ShareLink | null>(null);
  const filterKey = `${debouncedSearch}|${jobApplicationFilter}|${statusFilter}|${pageSize}`;
  const [seenFilterKey, setSeenFilterKey] = useState(filterKey);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  let effectivePage = page;
  if (seenFilterKey !== filterKey) {
    setSeenFilterKey(filterKey);
    if (page !== 1) setPage(1);
    effectivePage = 1;
  }

  const effectiveQueryKey = `${effectivePage}|${filterKey}`;
  if (loadedKey !== effectiveQueryKey) {
    setLoadedKey(effectiveQueryKey);
    setLoading(true);
    setNotice("");
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setNotice("");
    try {
      const data = await getShareLinks({
        page,
        page_size: pageSize,
        job_application: jobApplicationFilter || undefined,
        search: debouncedSearch || undefined,
        is_active:
          statusFilter === "active"
            ? true
            : statusFilter === "inactive"
              ? false
              : undefined,
      });
      setRows(data.results);
      setCount(data.count);
    } catch (error) {
      setNotice(errorText(error));
      setRows([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, jobApplicationFilter, debouncedSearch, statusFilter]);

  useEffect(() => {
    let ignore = false;
    getShareLinks({
      page: effectivePage,
      page_size: pageSize,
      job_application: jobApplicationFilter || undefined,
      search: debouncedSearch || undefined,
      is_active:
        statusFilter === "active"
          ? true
          : statusFilter === "inactive"
            ? false
            : undefined,
    })
      .then((data) => {
        if (ignore) return;
        setRows(data.results);
        setCount(data.count);
      })
      .catch((error) => {
        if (ignore) return;
        setNotice(errorText(error));
        setRows([]);
        setCount(0);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [
    effectivePage,
    pageSize,
    jobApplicationFilter,
    debouncedSearch,
    statusFilter,
  ]);

  const subtitle = useMemo(() => {
    if (jobApplicationFilter) {
      return `Filtered to application #${jobApplicationFilter}`;
    }
    return "All generated share links for job applications";
  }, [jobApplicationFilter]);

  const clearApplicationFilter = () => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("job_application");
    const qs = next.toString();
    router.push(qs ? `/staff/share-links?${qs}` : "/staff/share-links");
  };

  const logsHref = (id: string) => {
    const qs = jobApplicationFilter
      ? `?job_application=${encodeURIComponent(jobApplicationFilter)}`
      : "";
    return `/staff/share-links/${id}/logs${qs}`;
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CareersBackLink
            href="/staff"
            className="text-sm font-semibold text-amal-red"
          >
            ← Careers
          </CareersBackLink>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            Shared links
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600">{subtitle}</p>
        </div>
        {jobApplicationFilter ? (
          <button
            type="button"
            onClick={clearApplicationFilter}
            className="rounded-lg border border-black/15 bg-amal-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-amal-sheet"
          >
            Clear application filter
          </button>
        ) : null}
      </div>

      {notice ? (
        <p
          className={`mt-4 text-sm ${
            notice.startsWith("Could") || notice.includes("failed")
              ? "text-amal-red"
              : "text-zinc-600"
          }`}
        >
          {notice}
        </p>
      ) : null}

      <div className="mt-6 rounded-2xl border border-black/10 bg-amal-white p-4 md:p-6">
        <h2 className="text-sm font-semibold text-zinc-900">Filters</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Search by applicant, role, or comment
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search…"
            className="h-10 min-w-[220px] flex-1 rounded-lg border border-black/15 bg-amal-white px-3 text-sm outline-none focus:border-amal-red focus:ring-2 focus:ring-amal-red/20"
            aria-label="Search share links"
          />
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "all" | "active" | "inactive")
            }
            className="h-10 w-auto shrink-0 rounded-lg border border-black/15 bg-amal-white px-3 text-sm outline-none focus:border-amal-red focus:ring-2 focus:ring-amal-red/20"
            aria-label="Filter by active status"
          >
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-black/10 bg-amal-white p-4 md:p-6">
        <div className="mb-4 flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-amal-red" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Share links</h2>
            <p className="text-xs text-zinc-500">{count} total</p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500">Loading share links…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Create a share link from a job application to see it here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-3 py-2 font-semibold">Applicant</th>
                  <th className="px-3 py-2 font-semibold">Role</th>
                  <th className="px-3 py-2 font-semibold">Created</th>
                  <th className="px-3 py-2 font-semibold">Expires</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Opens</th>
                  <th className="px-3 py-2 font-semibold">Comment</th>
                  <th className="px-3 py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const appId = row.job_application_id ?? row.job_application;
                  return (
                    <tr key={row.id} className="border-b border-black/5">
                      <td className="px-3 py-3">
                        <div className="font-medium text-zinc-900">
                          {row.applicant_name ?? "—"}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {row.applicant_email ?? "—"}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-zinc-700">
                        {row.job_opening_title ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-zinc-600">
                        <div>{formatDateTime(row.created_at)}</div>
                        <div className="text-xs text-zinc-400">
                          {row.created_by_username ?? "—"}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-zinc-600">
                        {formatDateTime(row.expires_at)}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTone(row.status ?? "")}`}
                        >
                          {formatShareStatus(row.status)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-zinc-700">
                        <div>{row.access_count ?? 0}</div>
                        <div className="text-xs text-zinc-400">
                          Last {formatDateTime(row.last_accessed_at)}
                        </div>
                      </td>
                      <td className="max-w-[180px] truncate px-3 py-3 text-zinc-600">
                        {row.comment || "—"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap items-center gap-1">
                          <button
                            type="button"
                            title="Copy link"
                            className="rounded-lg border border-black/15 p-1.5 text-zinc-600 hover:bg-amal-sheet"
                            onClick={() => {
                              void navigator.clipboard
                                .writeText(row.share_url)
                                .then(() => setNotice("Link copied."))
                                .catch(() => setNotice("Could not copy link."));
                            }}
                          >
                            <CopyIcon className="h-3.5 w-3.5" />
                          </button>
                          <a
                            href={row.share_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open public link"
                            className="rounded-lg border border-black/15 p-1.5 text-zinc-600 hover:bg-amal-sheet"
                          >
                            <ExternalLinkIcon className="h-3.5 w-3.5" />
                          </a>
                          {appId ? (
                            <Link
                              href={`/staff/applications/${appId}`}
                              title="Open application"
                              className="rounded-lg border border-black/15 p-1.5 text-zinc-600 hover:bg-amal-sheet"
                            >
                              <EyeIcon className="h-3.5 w-3.5" />
                            </Link>
                          ) : null}
                          <button
                            type="button"
                            title="Edit link"
                            className="rounded-lg border border-black/15 p-1.5 text-zinc-600 hover:bg-amal-sheet"
                            onClick={() => setEditingLink(row)}
                          >
                            <PencilIcon className="h-3.5 w-3.5" />
                          </button>
                          <Link
                            href={logsHref(row.id)}
                            title="Access logs"
                            className="rounded-lg border border-black/15 p-1.5 text-zinc-600 hover:bg-amal-sheet"
                          >
                            <ScrollTextIcon className="h-3.5 w-3.5" />
                          </Link>
                          {row.is_active ? (
                            <button
                              type="button"
                              className="rounded-lg border border-amal-red/30 px-2 py-1 text-xs font-semibold text-amal-red hover:bg-amal-red/5"
                              onClick={() => {
                                void deactivateShareLink(row.id)
                                  .then(() => {
                                    setNotice("Link deactivated.");
                                    void load();
                                  })
                                  .catch((error) =>
                                    setNotice(errorText(error)),
                                  );
                              }}
                            >
                              Deactivate
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
          onPageSizeChange={setPageSize}
        />
      </div>

      {editingLink ? (
        <EditShareLinkModal
          link={editingLink}
          onClose={() => setEditingLink(null)}
          onSaved={(updated) => {
            setEditingLink(updated);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}
