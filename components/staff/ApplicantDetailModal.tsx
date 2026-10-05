"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError } from "@/lib/api";
import { getApplicantJobs, updateApplicantNote } from "@/lib/staff-api";
import { STATUS_BADGE, labelFor } from "@/lib/status";
import type { ApplicantRow, StaffApplication } from "@/lib/types";
import { MailIcon, MapPinIcon, PhoneIcon, UserIcon } from "./icons";
import { inputClass } from "./ui";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

function phoneTelHref(raw: string): string | null {
  const trimmed = raw.trim();
  if (!/^\+?[\d\s().-]{7,}$/.test(trimmed)) {
    return null;
  }
  const digits = trimmed.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : null;
}

function ContactRow({
  icon: Icon,
  label,
  children,
}: {
  icon: (props: { className?: string }) => ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-zinc-500">{label}</p>
        <div className="text-sm font-semibold">{children}</div>
      </div>
    </div>
  );
}

export function ApplicantDetailModal({
  applicant,
  onClose,
  onSaved,
  onError,
  onViewApplications,
}: {
  applicant: ApplicantRow;
  onClose: () => void;
  onSaved: (notes: string) => void;
  onError: (value: string) => void;
  onViewApplications: (slug: string) => void;
}) {
  const [notes, setNotes] = useState(applicant.notes ?? "");
  const [jobs, setJobs] = useState<StaffApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let ignore = false;
    getApplicantJobs(applicant.id)
      .then((data) => {
        if (!ignore) {
          setJobs(data);
          setLoading(false);
        }
      })
      .catch((error) => {
        if (!ignore) {
          onError(errorText(error));
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [applicant.id, onError]);

  const roleCount = useMemo(
    () => new Set(jobs.map((job) => job.job_opening)).size,
    [jobs],
  );

  async function save() {
    setBusy(true);
    try {
      const updated = await updateApplicantNote(applicant.id, notes);
      onSaved(updated.notes);
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  const phoneHref = applicant.contact ? phoneTelHref(applicant.contact) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-amal-black/60 px-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl min-w-0 flex-col overflow-hidden rounded-2xl bg-amal-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="applicant-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between bg-gradient-to-r from-amal-staff-banner to-amal-red px-6 py-5 text-amal-white">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amal-white/20">
              <UserIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h2
                id="applicant-detail-title"
                className="text-xl font-bold wrap-break-word"
              >
                {applicant.name || "—"}
              </h2>
              <p className="mt-0.5 text-sm text-amal-white/80">
                Applicant profile
              </p>
              {!loading && jobs.length > 0 ? (
                <p className="mt-2 inline-flex rounded-full bg-amal-white/15 px-3 py-1 text-xs font-medium">
                  {jobs.length} application{jobs.length === 1 ? "" : "s"} across{" "}
                  {roleCount} role{roleCount === 1 ? "" : "s"}
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg px-2 text-2xl text-amal-white/80 hover:bg-amal-white/10 hover:text-amal-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
          <div>
            <h3 className="mb-3 text-lg font-bold">Contact information</h3>
            <div className="space-y-3 rounded-xl bg-amal-sheet p-4">
              <ContactRow icon={UserIcon} label="Full name">
                {applicant.name?.trim() || "—"}
              </ContactRow>
              <ContactRow icon={MailIcon} label="Email">
                {applicant.email?.trim() ? (
                  <a
                    className="break-all text-amal-red hover:underline"
                    href={`mailto:${applicant.email.trim()}`}
                  >
                    {applicant.email.trim()}
                  </a>
                ) : (
                  "—"
                )}
              </ContactRow>
              <ContactRow icon={MapPinIcon} label="City">
                {applicant.city?.trim() || "—"}
              </ContactRow>
              <ContactRow icon={PhoneIcon} label="Phone">
                {applicant.contact?.trim() ? (
                  phoneHref ? (
                    <a
                      className="wrap-break-word text-amal-red hover:underline"
                      href={phoneHref}
                    >
                      {applicant.contact.trim()}
                    </a>
                  ) : (
                    applicant.contact.trim()
                  )
                ) : (
                  "—"
                )}
              </ContactRow>
              <div className="border-t border-black/10 pt-3">
                <p className="mb-2 text-xs text-zinc-500">Notes</p>
                <textarea
                  className={`${inputClass} h-24 py-2`}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Add internal notes about this applicant…"
                  rows={4}
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void save()}
                    className="rounded-lg bg-amal-red px-3 py-1.5 text-xs font-semibold text-amal-white hover:bg-amal-ink disabled:opacity-60"
                  >
                    {busy ? "Saving…" : "Save notes"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-zinc-700">
              Job applications
            </h3>
            {loading ? (
              <div className="rounded-xl bg-amal-sheet p-8 text-center">
                <p className="text-sm text-zinc-500">Loading applications...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="rounded-xl bg-amal-sheet p-8 text-center">
                <p className="text-sm text-zinc-500">
                  No job applications for this applicant.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-black/10">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-black/10 bg-amal-sheet">
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Role
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Applied
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Status
                      </th>
                      <th className="w-[1%] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr
                        key={job.id}
                        className="border-b border-black/5 last:border-0"
                      >
                        <td className="px-4 py-3">
                          {job.job_opening ? (
                            <button
                              type="button"
                              onClick={() => onViewApplications(job.job_opening)}
                              className="font-medium text-amal-red hover:underline"
                            >
                              {job.job_opening_name || job.job_opening}
                            </button>
                          ) : (
                            job.job_opening_name || "—"
                          )}
                        </td>
                        <td className="px-4 py-3 text-zinc-600">
                          {job.applied_at.slice(0, 10)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              STATUS_BADGE[job.status] ??
                              "bg-amal-sheet text-zinc-700"
                            }`}
                          >
                            {labelFor(job.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/staff/applications/${job.id}`}
                            className="inline-flex items-center rounded-lg bg-amal-red px-3 py-1.5 text-xs font-semibold text-amal-white hover:bg-amal-ink"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
