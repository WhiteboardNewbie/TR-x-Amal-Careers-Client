"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import { getClientRoles } from "@/lib/client-api";
import type { ClientRole } from "@/lib/types";
import {
  BriefcaseIcon,
  SearchIcon,
  UsersIcon,
  XIcon,
} from "@/components/staff/icons";
import { StaffBanner } from "@/components/staff/StaffBanner";
import { TablePager } from "@/components/staff/ui";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

const PAGE_SIZE = 10;

type StatusFilter = "all" | "active" | "inactive";

const FILTER_SELECT_CLASS =
  "rounded-lg border border-black/15 bg-amal-sheet py-2 pl-3 pr-8 text-sm outline-none focus:border-amal-red focus:ring-2 focus:ring-amal-red/20";

export function ClientHiring() {
  const [rows, setRows] = useState<ClientRole[]>([]);
  const [notice, setNotice] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [requesterFilter, setRequesterFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let ignore = false;
    getClientRoles()
      .then((data) => {
        if (!ignore) {
          setRows(data);
        }
      })
      .catch((error) => {
        if (!ignore) {
          setNotice(errorText(error));
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  const requesters = useMemo(() => {
    const byId = new Map<number, string>();
    for (const row of rows) {
      const requester = row.requested_by_client_user_display;
      if (requester?.id != null && requester.display_name) {
        byId.set(requester.id, requester.display_name);
      }
    }
    return [...byId.entries()]
      .map(([id, display_name]) => ({ id, display_name }))
      .sort((a, b) => a.display_name.localeCompare(b.display_name));
  }, [rows]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return rows.filter((row) => {
      if (statusFilter === "active" && row.is_active === false) {
        return false;
      }
      if (statusFilter === "inactive" && row.is_active !== false) {
        return false;
      }
      if (
        requesterFilter !== "all" &&
        String(row.requested_by_client_user_display?.id ?? "") !==
          requesterFilter
      ) {
        return false;
      }
      if (!q) {
        return true;
      }
      return [row.title, row.department_name, row.location]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [debouncedSearch, requesterFilter, rows, statusFilter]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasActive =
    debouncedSearch.length > 0 ||
    statusFilter !== "all" ||
    requesterFilter !== "all";
  const kpis = {
    openRoles: rows.filter((row) => row.is_active !== false).length,
    awaiting: rows.reduce(
      (sum, row) => sum + (row.awaiting_client_review_count ?? 0),
      0,
    ),
  };

  return (
    <div className="staff-container space-y-4 py-8">
      <StaffBanner eyebrow="Client portal" title="Hiring">
        Review candidates HR has sent for your decision on roles your
        organization requested.
      </StaffBanner>
      {notice ? (
        <p className="rounded-lg border border-amal-red/30 bg-amal-white px-3 py-2 text-sm text-amal-red">
          {notice}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          {
            label: "Open roles",
            value: String(kpis.openRoles),
            Icon: BriefcaseIcon,
          },
          {
            label: "Awaiting your review",
            value: String(kpis.awaiting),
            Icon: UsersIcon,
          },
        ].map(({ label, value, Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-black/10 bg-amal-white p-4 shadow-sm"
          >
            <div className="mb-1 flex items-center gap-2">
              <div className="rounded-md bg-amal-red/10 p-1.5 text-amal-red">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-medium text-zinc-600">{label}</span>
            </div>
            <p className="text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-black/10 bg-amal-white shadow-sm">
        <div className="space-y-3 border-b border-black/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Requested roles</h2>
            {hasActive ? (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setDebouncedSearch("");
                  setStatusFilter("all");
                  setRequesterFilter("all");
                  setPage(1);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-amal-sheet"
              >
                <XIcon className="h-3.5 w-3.5" />
                Clear filters
              </button>
            ) : null}
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => {
                  setSearchInput(event.target.value);
                  setPage(1);
                }}
                placeholder="Search job roles by title, location, department…"
                aria-label="Search job roles"
                className="w-full rounded-lg border border-black/15 bg-amal-sheet py-2.5 pl-9 pr-3 text-sm outline-none focus:border-amal-red focus:ring-2 focus:ring-amal-red/20"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Status
                </span>
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value as StatusFilter);
                    setPage(1);
                  }}
                  aria-label="Filter by status"
                  className={FILTER_SELECT_CLASS}
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <label className="flex min-w-[180px] flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Requested by
                </span>
                <select
                  value={requesterFilter}
                  onChange={(event) => {
                    setRequesterFilter(event.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter by requester"
                  className={FILTER_SELECT_CLASS}
                >
                  <option value="all">All</option>
                  {requesters.map((user) => (
                    <option key={user.id} value={String(user.id)}>
                      {user.display_name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-zinc-500">
            {hasActive
              ? "No roles match your filters."
              : "No published roles are linked to your organization yet."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-amal-sheet text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Awaiting review</th>
                  <th className="px-4 py-3 font-medium">Requested by</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-black/5 hover:bg-amal-sheet/80"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/client/roles/${row.slug}`}
                        className="block text-left"
                        aria-label={`View applicants for ${row.title}`}
                      >
                        <p className="font-medium text-amal-ink hover:text-amal-red hover:underline">
                          {row.title}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {row.location || "—"}
                        </p>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          row.is_active === false
                            ? "bg-zinc-100 text-zinc-600"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {row.is_active === false ? "Inactive" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {row.awaiting_client_review_count ?? 0}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {row.requested_by_client_user_display?.display_name ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 pb-4">
          <TablePager
            page={page}
            pageSize={PAGE_SIZE}
            count={filtered.length}
            onPage={setPage}
          />
        </div>
      </div>
    </div>
  );
}
