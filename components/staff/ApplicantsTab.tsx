"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { getApplicants, getStaffJobOpenings } from "@/lib/staff-api";
import type { ApplicantRow, StaffJobOpening } from "@/lib/types";
import { ApplicantDetailModal } from "./ApplicantDetailModal";
import { TablePager, inputClass } from "./ui";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

const ORDERING_OPTIONS = [
  { value: "-last_applied_at", label: "Last applied (newest)" },
  { value: "last_applied_at", label: "Last applied (oldest)" },
  { value: "name", label: "Name (A–Z)" },
  { value: "-name", label: "Name (Z–A)" },
  { value: "-application_count", label: "Most applications" },
  { value: "application_count", label: "Fewest applications" },
] as const;

type MinApplications = "all" | "1" | "2";

const selectClass =
  "rounded-lg border border-black/15 bg-amal-white px-3 py-2 text-sm text-amal-ink";

export function ApplicantsTab({
  onError,
  onViewApplications,
}: {
  onError: (value: string) => void;
  onViewApplications: (slug: string) => void;
}) {
  const [page, setPage] = useState(1);
  const [tick, setTick] = useState(0);
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-last_applied_at");
  const [minApplications, setMinApplications] =
    useState<MinApplications>("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [roles, setRoles] = useState<StaffJobOpening[]>([]);
  const [rows, setRows] = useState<ApplicantRow[]>([]);
  const [count, setCount] = useState(0);
  const [selected, setSelected] = useState<ApplicantRow | null>(null);

  useEffect(() => {
    void getStaffJobOpenings({ status: "all", page_size: 150 })
      .then((pageData) => setRoles(pageData.results ?? []))
      .catch(() => setRoles([]));
  }, []);

  useEffect(() => {
    let ignore = false;
    getApplicants({
      page,
      page_size: 10,
      search: search.trim() || undefined,
      ordering,
      min_applications:
        minApplications === "all" ? undefined : Number(minApplications),
      job_opening: roleFilter === "all" ? undefined : roleFilter,
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
  }, [page, tick, search, ordering, minApplications, roleFilter, onError]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Applicants</h2>
        <p className="text-sm text-zinc-500">All applicant records.</p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <input
          className={`${inputClass} max-w-sm`}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search by name, email, or city"
        />
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Sort by
          <select
            id="applicant-sort"
            className={`${selectClass} font-normal`}
            value={ordering}
            onChange={(event) => {
              setOrdering(event.target.value);
              setPage(1);
            }}
          >
            {ORDERING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Applications
          <select
            id="applicant-min-apps"
            className={`${selectClass} font-normal`}
            value={minApplications}
            onChange={(event) => {
              setMinApplications(event.target.value as MinApplications);
              setPage(1);
            }}
          >
            <option value="all">All applicants</option>
            <option value="1">Has applications</option>
            <option value="2">Repeat applicants (2+)</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Applied to role
          <select
            id="applicant-role-filter"
            className={`${selectClass} min-w-[12rem] font-normal`}
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">All roles</option>
            {roles.map((role) =>
              role.slug ? (
                <option key={role.id} value={role.slug}>
                  {role.title}
                </option>
              ) : null,
            )}
          </select>
        </label>
      </div>
      <div className="pt-2">
        <h3 className="mb-4 text-lg font-bold">Applicant records</h3>
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-black/15 bg-amal-sheet px-4 py-6 text-center text-sm text-zinc-500">
            No applicants found. Applicants appear when job applications are
            created.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-center text-sm">
              <thead>
                <tr className="border-b border-black/10">
                  {(
                    [
                      "Name",
                      "Email",
                      "Applications",
                      "Last applied",
                      "City",
                      "Contact",
                    ] as const
                  ).map((heading) => (
                    <th
                      key={heading}
                      className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-zinc-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer border-b border-black/5 hover:bg-amal-sheet/80"
                    onClick={() => setSelected(row)}
                  >
                    <td className="px-3 py-3 font-medium">{row.name}</td>
                    <td className="px-3 py-3 text-zinc-600">{row.email}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex min-w-[1.75rem] justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                          row.application_count > 0
                            ? "bg-amal-red/10 text-amal-red"
                            : "bg-amal-sheet text-zinc-500"
                        }`}
                      >
                        {row.application_count}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-zinc-600">
                      {row.last_applied_at
                        ? row.last_applied_at.slice(0, 10)
                        : "—"}
                    </td>
                    <td className="px-3 py-3 text-zinc-600">
                      {row.city || "—"}
                    </td>
                    <td className="px-3 py-3 text-zinc-600">
                      {row.contact || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <TablePager page={page} pageSize={10} count={count} onPage={setPage} />
      {selected ? (
        <ApplicantDetailModal
          key={selected.id}
          applicant={selected}
          onClose={() => setSelected(null)}
          onSaved={(notes) => {
            setSelected({ ...selected, notes });
            setTick((value) => value + 1);
          }}
          onError={onError}
          onViewApplications={(slug) => {
            setSelected(null);
            onViewApplications(slug);
          }}
        />
      ) : null}
    </div>
  );
}
