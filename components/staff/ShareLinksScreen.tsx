"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  createShareLink,
  deactivateShareLink,
  getShareLinks,
  getStaffApplications,
  patchShareLink,
} from "@/lib/staff-api";
import type { ShareLink, StaffApplication } from "@/lib/types";
import { Field, GhostButton, Modal, PrimaryButton, TablePager, inputClass } from "./ui";
import { CareersBackLink } from "./CareersBackLink";

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: string | undefined, isActive: boolean): string {
  const value = status || (isActive ? "active" : "deactivated");
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function statusClass(status: string | undefined, isActive: boolean): string {
  const value = status || (isActive ? "active" : "deactivated");
  if (value === "active") {
    return "bg-emerald-50 text-emerald-800";
  }
  if (value === "expired") {
    return "bg-amber-50 text-amber-800";
  }
  return "bg-amal-sheet text-zinc-600";
}

export function ShareLinksScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobApplication = searchParams.get("job_application") ?? "";
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [tick, setTick] = useState(0);
  const [rows, setRows] = useState<ShareLink[]>([]);
  const [count, setCount] = useState(0);
  const [notice, setNotice] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ShareLink | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [trackedApplication, setTrackedApplication] = useState(jobApplication);
  if (jobApplication !== trackedApplication) {
    setTrackedApplication(jobApplication);
    setPage(1);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let ignore = false;
    const isActive =
      statusFilter === "active"
        ? true
        : statusFilter === "inactive"
          ? false
          : undefined;
    getShareLinks({
      page,
      page_size: pageSize,
      search: debouncedSearch || undefined,
      job_application: jobApplication ? Number(jobApplication) : undefined,
      is_active: isActive,
    })
      .then((data) => {
        if (!ignore) {
          setRows(data.results);
          setCount(data.count);
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
  }, [page, pageSize, tick, debouncedSearch, statusFilter, jobApplication]);

  function copyLink(row: ShareLink) {
    void navigator.clipboard.writeText(row.share_url).then(
      () => {
        setCopiedId(row.id);
        window.setTimeout(() => {
          setCopiedId((current) => (current === row.id ? "" : current));
        }, 1500);
      },
      () => setNotice("Could not copy link."),
    );
  }

  return (
    <div>
      <CareersBackLink
        href="/staff"
        className="text-sm font-semibold text-amal-red"
      >
        ← Careers
      </CareersBackLink>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Share links</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600">
            {jobApplication
              ? `Filtered to application #${jobApplication}.`
              : "Create a public link to an application, edit it, or turn it off."}
          </p>
        </div>
        {jobApplication ? (
          <GhostButton type="button" onClick={() => router.push("/staff/share-links")}>
            Clear application filter
          </GhostButton>
        ) : null}
      </div>
      {notice ? <p className="mt-4 text-sm text-amal-red">{notice}</p> : null}
      <div className="mt-6 flex flex-wrap items-end gap-3">
        <PrimaryButton type="button" onClick={() => setCreating(true)}>
          Create link
        </PrimaryButton>
        <label className="min-w-[220px] flex-1 text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Search
          </span>
          <input
            className={inputClass}
            value={search}
            aria-label="Search share links"
            placeholder="Applicant, role, or comment"
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Status
          </span>
          <select
            className={inputClass}
            aria-label="Filter by active status"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as "all" | "active" | "inactive");
              setPage(1);
            }}
          >
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </label>
      </div>
      <div className="mt-6 rounded-2xl border border-black/10 bg-amal-white p-4 md:p-6">
        {rows.length === 0 ? (
          <p className="text-sm text-zinc-500">No share links yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-zinc-500">
                  <th className="py-2">Applicant</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th>Opens</th>
                  <th>Comment</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-black/5">
                    <td className="py-3">
                      <div className="font-semibold">
                        {row.applicant_name ||
                          `#${row.job_application_id ?? row.job_application}`}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {row.applicant_email || "—"}
                      </div>
                    </td>
                    <td>{row.job_opening_title || "—"}</td>
                    <td>
                      <div>{formatDateTime(row.created_at)}</div>
                      <div className="text-xs text-zinc-500">
                        {row.created_by_username || "—"}
                      </div>
                    </td>
                    <td>{formatDateTime(row.expires_at)}</td>
                    <td>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass(row.status, row.is_active)}`}
                      >
                        {statusLabel(row.status, row.is_active)}
                      </span>
                    </td>
                    <td>
                      <div>{row.access_count ?? 0}</div>
                      <div className="text-xs text-zinc-500">
                        Last {formatDateTime(row.last_accessed_at)}
                      </div>
                    </td>
                    <td className="max-w-[180px] truncate">{row.comment || "—"}</td>
                    <td className="space-x-2 text-right">
                      <GhostButton type="button" onClick={() => copyLink(row)}>
                        {copiedId === row.id ? "Copied" : "Copy"}
                      </GhostButton>
                      <a
                        href={row.share_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-amal-red"
                      >
                        Open
                      </a>
                      <Link
                        href={`/staff/share-links/${row.id}/logs`}
                        className="font-semibold text-amal-red"
                      >
                        Logs
                      </Link>
                      <GhostButton type="button" onClick={() => setEditing(row)}>
                        Edit
                      </GhostButton>
                      {row.is_active ? (
                        <GhostButton
                          type="button"
                          onClick={() =>
                            void deactivateShareLink(row.id)
                              .then(() => setTick((value) => value + 1))
                              .catch((error) => setNotice(errorText(error)))
                          }
                        >
                          Deactivate
                        </GhostButton>
                      ) : null}
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
      {creating ? (
        <CreateShareModal
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            setTick((value) => value + 1);
          }}
          onError={setNotice}
        />
      ) : null}
      {editing ? (
        <EditShareModal
          link={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setTick((value) => value + 1);
          }}
          onError={setNotice}
        />
      ) : null}
    </div>
  );
}

function CreateShareModal({
  onClose,
  onSaved,
  onError,
}: {
  onClose: () => void;
  onSaved: () => void;
  onError: (value: string) => void;
}) {
  const [applications, setApplications] = useState<StaffApplication[]>([]);
  const [applicationId, setApplicationId] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getStaffApplications({ page: 1, page_size: 50 }).then((data) =>
      setApplications(data.results),
    );
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await createShareLink({
        job_application: Number(applicationId),
        comment,
      });
      onSaved();
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Create share link" onClose={onClose}>
      <form onSubmit={onSubmit}>
        <Field label="Application">
          <select
            className={inputClass}
            value={applicationId}
            onChange={(event) => setApplicationId(event.target.value)}
            required
          >
            <option value="">Select</option>
            {applications.map((row) => (
              <option key={row.id} value={row.id}>
                {row.applicant.name} · {row.job_opening_name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Comment">
          <textarea
            className={`${inputClass} h-20 py-2`}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </Field>
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? "Saving…" : "Create"}
        </PrimaryButton>
      </form>
    </Modal>
  );
}

function EditShareModal({
  link,
  onClose,
  onSaved,
  onError,
}: {
  link: ShareLink;
  onClose: () => void;
  onSaved: () => void;
  onError: (value: string) => void;
}) {
  const [comment, setComment] = useState(link.comment ?? "");
  const [expires, setExpires] = useState(
    link.expires_at ? link.expires_at.slice(0, 16) : "",
  );
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await patchShareLink(link.id, {
        comment,
        expires_at: expires ? new Date(expires).toISOString() : null,
      });
      onSaved();
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Edit share link" onClose={onClose}>
      <form onSubmit={onSubmit}>
        <p className="mb-3 break-all text-sm text-zinc-600">{link.share_url}</p>
        <Field label="Expires">
          <input
            className={inputClass}
            type="datetime-local"
            value={expires}
            onChange={(event) => setExpires(event.target.value)}
          />
        </Field>
        <Field label="Comment">
          <textarea
            className={`${inputClass} h-20 py-2`}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </Field>
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </PrimaryButton>
      </form>
    </Modal>
  );
}
