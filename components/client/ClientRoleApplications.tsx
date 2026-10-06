"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  decideClientApplication,
  getClientRoleApplications,
  getClientRoles,
} from "@/lib/client-api";
import { formatDate } from "@/components/staff/stage-row-cells";
import { labelFor } from "@/lib/status";
import type { ClientApplicationRow, ClientRole } from "@/lib/types";
import {
  MapPinIcon,
  SearchIcon,
  UsersIcon,
  XIcon,
} from "@/components/staff/icons";
import { StaffBanner } from "@/components/staff/StaffBanner";
import {
  GhostButton,
  Modal,
  TablePager,
} from "@/components/staff/ui";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

const PAGE_SIZE = 10;

const REVIEW_BADGE: Record<string, string> = {
  pending: "bg-violet-100 text-violet-700",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-amal-red/15 text-amal-red",
};

export function ClientRoleApplications({ slug }: { slug: string }) {
  const [role, setRole] = useState<ClientRole | null>(null);
  const [rows, setRows] = useState<ClientApplicationRow[]>([]);
  const [notice, setNotice] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [reviewFilter, setReviewFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [page, setPage] = useState(1);
  const [pendingDecision, setPendingDecision] = useState<{
    applicationId: number;
    decision: "approved" | "rejected";
    name: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    return Promise.all([
      getClientRoles(),
      getClientRoleApplications(slug),
    ]).then(([roles, applications]) => {
      setRole(roles.find((item) => item.slug === slug) ?? null);
      setRows(applications);
    });
  }, [slug]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let ignore = false;
    load().catch((error) => {
      if (!ignore) {
        setNotice(errorText(error));
      }
    });
    return () => {
      ignore = true;
    };
  }, [load]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return rows.filter((row) => {
      const status = row.review_status ?? "pending";
      if (reviewFilter !== "all" && status !== reviewFilter) {
        return false;
      }
      if (!q) {
        return true;
      }
      return [row.applicant_name, row.applicant_email ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [debouncedSearch, reviewFilter, rows]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasActive = debouncedSearch.length > 0 || reviewFilter !== "all";
  const counts = {
    total: rows.length,
    pending: rows.filter((row) => (row.review_status ?? "pending") === "pending")
      .length,
    approved: rows.filter((row) => row.review_status === "approved").length,
    rejected: rows.filter((row) => row.review_status === "rejected").length,
  };

  async function confirmDecision() {
    if (!pendingDecision) {
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const review = await decideClientApplication(
        pendingDecision.applicationId,
        pendingDecision.decision,
      );
      setRows((current) =>
        current.map((row) =>
          row.id === pendingDecision.applicationId
            ? { ...row, review_status: review.status }
            : row,
        ),
      );
      setPendingDecision(null);
    } catch (error) {
      setNotice(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="staff-container space-y-4 py-8">
      <Link
        href="/client"
        className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-amal-ink"
      >
        ← All roles
      </Link>
      <StaffBanner
        eyebrow="Role detail"
        title={role?.title ?? "Applications"}
        actions={
          role ? (
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                role.is_active === false
                  ? "bg-amal-white/10 text-amal-white ring-1 ring-amal-white/20"
                  : "bg-emerald-400/20 text-emerald-100 ring-1 ring-emerald-300/40"
              }`}
            >
              {role.is_active === false ? "Inactive" : "Active"}
            </span>
          ) : null
        }
      >
        {role?.location?.trim() ? (
          <span className="inline-flex items-center gap-1.5">
            <MapPinIcon className="h-4 w-4 shrink-0 text-amal-white/70" />
            {role.location.trim()}
          </span>
        ) : null}
        {role?.department_name ? (
          <>
            {role.location?.trim() ? <br /> : null}
            {role.department_name}
          </>
        ) : null}
        {!role?.location?.trim() && !role?.department_name
          ? "Applications handed to you on this role."
          : null}
      </StaffBanner>
      {notice ? (
        <p className="rounded-lg border border-amal-red/30 bg-amal-white px-3 py-2 text-sm text-amal-red">
          {notice}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            { label: "Total assigned", value: counts.total, tone: "text-amal-ink" },
            { label: "Pending", value: counts.pending, tone: "text-violet-700" },
            {
              label: "Approved",
              value: counts.approved,
              tone: "text-emerald-700",
            },
            { label: "Rejected", value: counts.rejected, tone: "text-amal-red" },
          ] as const
        ).map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-black/10 bg-amal-white px-4 py-4 shadow-sm"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              {card.label}
            </p>
            <p className={`mt-2 text-2xl font-bold tabular-nums ${card.tone}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-black/10 bg-amal-white shadow-sm">
        <div className="space-y-3 border-b border-black/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <UsersIcon className="h-5 w-5 text-amal-red" />
              Your review history
            </h2>
            {hasActive ? (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setDebouncedSearch("");
                  setReviewFilter("all");
                  setPage(1);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-amal-sheet"
              >
                <XIcon className="h-3.5 w-3.5" />
                Clear filters
              </button>
            ) : null}
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="relative min-w-0 flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by name or email…"
                className="w-full rounded-lg border border-black/15 bg-amal-sheet py-2.5 pl-9 pr-3 text-sm outline-none focus:border-amal-red focus:ring-2 focus:ring-amal-red/20"
              />
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Review status
              </span>
              <select
                value={reviewFilter}
                onChange={(event) => {
                  setReviewFilter(
                    event.target.value as typeof reviewFilter,
                  );
                  setPage(1);
                }}
                className="rounded-lg border border-black/15 bg-amal-sheet py-2 pl-3 pr-8 text-sm"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>
          </div>
        </div>
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-zinc-500">
            {hasActive
              ? "No applicants match your filters."
              : "No applicants have been sent for your review yet."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-amal-sheet text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Candidate</th>
                  <th className="px-4 py-3 font-medium">Your review</th>
                  <th className="px-4 py-3 font-medium">Applied</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((row) => {
                  const reviewStatus = row.review_status ?? "pending";
                  const canEdit = reviewStatus === "pending";
                  return (
                    <tr
                      key={row.id}
                      className="border-t border-black/5 hover:bg-amal-sheet/80"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/client/applications/${row.id}?role=${slug}`}
                          className="font-semibold text-amal-ink hover:text-amal-red"
                        >
                          {row.applicant_name}
                        </Link>
                        {row.applicant_email ? (
                          <p className="text-xs text-zinc-500">
                            {row.applicant_email}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        {canEdit ? (
                          <select
                            value={reviewStatus}
                            aria-label={`Review status for ${row.applicant_name}`}
                            onChange={(event) => {
                              const next = event.target.value;
                              if (next === "approved" || next === "rejected") {
                                setPendingDecision({
                                  applicationId: row.id,
                                  decision: next,
                                  name: row.applicant_name,
                                });
                              }
                            }}
                            className={`h-7 cursor-pointer rounded-full border-0 px-2 text-xs font-semibold ${REVIEW_BADGE[reviewStatus]}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${REVIEW_BADGE[reviewStatus] ?? "bg-slate-100 text-slate-600"}`}
                          >
                            {labelFor(reviewStatus)} (final)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {formatDate(row.applied_at)}
                      </td>
                    </tr>
                  );
                })}
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

      {pendingDecision ? (
        <Modal
          compact
          title={
            pendingDecision.decision === "approved"
              ? "Approve candidate?"
              : "Reject candidate?"
          }
          onClose={() => setPendingDecision(null)}
        >
          <p className="mt-2 text-sm text-zinc-600">
            This decision is final and cannot be changed later. HR will see your
            review status on the application.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <GhostButton onClick={() => setPendingDecision(null)}>
              Cancel
            </GhostButton>
            <button
              type="button"
              disabled={busy}
              onClick={() => void confirmDecision()}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-amal-white disabled:opacity-50 ${
                pendingDecision.decision === "approved"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-amal-red hover:bg-amal-red/90"
              }`}
            >
              {busy
                ? "Saving…"
                : pendingDecision.decision === "approved"
                  ? "Approve"
                  : "Reject"}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
