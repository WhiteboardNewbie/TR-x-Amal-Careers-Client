"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  getApplicantJobs,
  getApplicants,
  updateApplicantNote,
} from "@/lib/staff-api";
import { labelFor } from "@/lib/status";
import type { ApplicantRow, StaffApplication } from "@/lib/types";
import { Field, GhostButton, Modal, PrimaryButton, TablePager, inputClass } from "./ui";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

export function ApplicantsTab({
  onError,
}: {
  onError: (value: string) => void;
}) {
  const [page, setPage] = useState(1);
  const [tick, setTick] = useState(0);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [rows, setRows] = useState<ApplicantRow[]>([]);
  const [count, setCount] = useState(0);
  const [selected, setSelected] = useState<ApplicantRow | null>(null);

  useEffect(() => {
    let ignore = false;
    getApplicants({
      page,
      page_size: 10,
      search: appliedSearch || undefined,
      ordering: "-last_applied_at",
    })
      .then((data) => {
        if (!ignore) {
          setRows(data.results);
          setCount(data.count);
        }
      })
      .catch((error) => {
        if (!ignore) {
          onError(errorText(error));
        }
      });
    return () => {
      ignore = true;
    };
  }, [page, tick, appliedSearch, onError]);

  return (
    <div>
      <form
        className="mb-4 flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setAppliedSearch(search.trim());
        }}
      >
        <input
          className={`${inputClass} max-w-sm`}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, email, or city"
        />
        <PrimaryButton type="submit">Search</PrimaryButton>
      </form>
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No applicants on this page. They appear when applications are created.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-zinc-500">
                <th className="py-2">Name</th>
                <th>Email</th>
                <th>Applications</th>
                <th>Last applied</th>
                <th>City</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer border-t border-black/5 hover:bg-amal-sheet"
                  onClick={() => setSelected(row)}
                >
                  <td className="py-3 font-semibold">{row.name}</td>
                  <td>{row.email}</td>
                  <td>{row.application_count}</td>
                  <td>
                    {row.last_applied_at
                      ? row.last_applied_at.slice(0, 10)
                      : "—"}
                  </td>
                  <td>{row.city || "—"}</td>
                  <td>{row.contact || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <TablePager page={page} pageSize={10} count={count} onPage={setPage} />
      {selected ? (
        <ApplicantProfile
          applicant={selected}
          onClose={() => setSelected(null)}
          onSaved={(notes) => {
            setSelected({ ...selected, notes });
            setTick((value) => value + 1);
          }}
          onError={onError}
        />
      ) : null}
    </div>
  );
}

function ApplicantProfile({
  applicant,
  onClose,
  onSaved,
  onError,
}: {
  applicant: ApplicantRow;
  onClose: () => void;
  onSaved: (notes: string) => void;
  onError: (value: string) => void;
}) {
  const [notes, setNotes] = useState(applicant.notes ?? "");
  const [jobs, setJobs] = useState<StaffApplication[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let ignore = false;
    getApplicantJobs(applicant.id)
      .then((data) => {
        if (!ignore) {
          setJobs(data);
        }
      })
      .catch((error) => {
        if (!ignore) {
          onError(errorText(error));
        }
      });
    return () => {
      ignore = true;
    };
  }, [applicant.id, onError]);

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

  return (
    <Modal title={applicant.name || "Applicant"} onClose={onClose}>
      <div className="space-y-3 text-sm">
        <p>
          <span className="text-zinc-500">Email</span>
          <br />
          {applicant.email ? (
            <a className="font-semibold text-amal-red" href={`mailto:${applicant.email}`}>
              {applicant.email}
            </a>
          ) : (
            "—"
          )}
        </p>
        <p>
          <span className="text-zinc-500">City</span>
          <br />
          <span className="font-semibold">{applicant.city || "—"}</span>
        </p>
        <p>
          <span className="text-zinc-500">Phone</span>
          <br />
          <span className="font-semibold">{applicant.contact || "—"}</span>
        </p>
      </div>
      <Field label="Notes">
        <textarea
          className={`${inputClass} h-24 py-2`}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Internal notes about this applicant"
        />
      </Field>
      <PrimaryButton type="button" disabled={busy} onClick={() => void save()}>
        {busy ? "Saving…" : "Save notes"}
      </PrimaryButton>
      <h3 className="mt-6 text-sm font-bold">Applications</h3>
      {jobs.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">No applications yet.</p>
      ) : (
        <ul className="mt-2 space-y-2 text-sm">
          {jobs.map((job) => (
            <li key={job.id} className="rounded-lg bg-amal-sheet px-3 py-2">
              <p className="font-semibold">{job.job_opening_name}</p>
              <p className="text-zinc-500">
                {labelFor(job.status)} · {job.applied_at.slice(0, 10)}
              </p>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4">
        <GhostButton type="button" onClick={onClose}>
          Close
        </GhostButton>
      </div>
    </Modal>
  );
}
