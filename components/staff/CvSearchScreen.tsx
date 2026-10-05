"use client";

import Link from "next/link";
import { useState } from "react";
import { ApiError } from "@/lib/api";
import { searchResumes } from "@/lib/staff-api";
import { labelFor } from "@/lib/status";
import type { StaffApplication } from "@/lib/types";
import { PrimaryButton, TablePager, inputClass } from "./ui";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

export function CvSearchScreen() {
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<StaffApplication[]>([]);
  const [count, setCount] = useState(0);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(nextPage = 1, term = applied) {
    if (term.trim().length < 2) {
      setNotice("Enter at least two characters.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const data = await searchResumes(term.trim(), nextPage);
      setRows(data.results);
      setCount(data.count);
      setPage(nextPage);
      setApplied(term.trim());
    } catch (error) {
      setNotice(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Link href="/staff" className="text-sm font-semibold text-amal-red">
        ← Careers
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">CV search</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600">
        Applications whose stored resume text contains every word of the query.
      </p>
      <form
        className="mt-6 flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void run(1, query);
        }}
      >
        <input
          className={`${inputClass} max-w-md`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search resume text"
        />
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? "Searching…" : "Search"}
        </PrimaryButton>
      </form>
      {notice ? (
        <p className="mt-4 text-sm text-amal-red">{notice}</p>
      ) : null}
      <div className="mt-6 rounded-2xl border border-black/10 bg-amal-white p-4 md:p-6">
        {applied && rows.length === 0 && !busy ? (
          <p className="text-sm text-zinc-500">No matching resumes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-zinc-500">
                  <th className="py-2">Applicant</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-black/5">
                    <td className="py-3">
                      <Link
                        href={`/staff/applications/${row.id}`}
                        className="font-semibold text-amal-red"
                      >
                        {row.applicant.name}
                      </Link>
                      <p className="text-zinc-500">{row.applicant.email}</p>
                    </td>
                    <td>{row.job_opening_name}</td>
                    <td>{labelFor(row.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <TablePager
          page={page}
          pageSize={10}
          count={count}
          onPage={(next) => void run(next)}
        />
      </div>
    </div>
  );
}
