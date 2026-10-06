"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  DEFAULT_MANAGE_APPLICATIONS_FILTERS,
  getManageApplicationsPresetState,
  hasActiveManageApplicationFilters,
  manageApplicationsFiltersToApiParams,
  type ManageApplicationsFilterPresetId,
  type ManageApplicationsFilterState,
} from "@/lib/manage-applications-filters";
import { getAssignedStages, getStaffJobOpenings } from "@/lib/staff-api";
import { stageStatusBadge } from "@/lib/status";
import type { ApplicationStage, StaffJobOpening } from "@/lib/types";
import { ManageApplicationsFilterBar } from "./ManageApplicationsFilterBar";
import { TablePager } from "./ui";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

function StageStatusPill({ status }: { status: string }) {
  const badge = stageStatusBadge(status);
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}
    >
      {badge.label}
    </span>
  );
}

export function ManageApplicationsTab({
  onError,
}: {
  onError: (value: string) => void;
}) {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<ApplicationStage[]>([]);
  const [count, setCount] = useState(0);
  const [filters, setFilters] = useState<ManageApplicationsFilterState>(
    DEFAULT_MANAGE_APPLICATIONS_FILTERS,
  );
  const [debouncedSearch, setDebouncedSearch] = useState(filters.searchInput);
  const [jobsForFilters, setJobsForFilters] = useState<StaffJobOpening[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(filters.searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [filters.searchInput]);

  useEffect(() => {
    void getStaffJobOpenings({ status: "all", page_size: 150 })
      .then((data) => setJobsForFilters(data.results ?? []))
      .catch(() => setJobsForFilters([]));
  }, []);

  const patchFilters = useCallback(
    (patch: Partial<ManageApplicationsFilterState>) => {
      setFilters((current) => ({ ...current, ...patch }));
      setPage(1);
    },
    [],
  );

  const listFilters = useMemo(
    () => manageApplicationsFiltersToApiParams(debouncedSearch, filters),
    [debouncedSearch, filters],
  );

  const hasActive = hasActiveManageApplicationFilters(debouncedSearch, filters);

  useEffect(() => {
    let ignore = false;
    getAssignedStages({ ...listFilters, page, page_size: 10 })
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
  }, [listFilters, page, onError]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Filters</h2>
        <p className="text-sm text-zinc-500">
          Search and narrow stages assigned to you.
        </p>
        <div className="mt-4">
          <ManageApplicationsFilterBar
            filters={filters}
            debouncedSearch={debouncedSearch}
            totalCount={count}
            jobsForFilters={jobsForFilters}
            onChange={patchFilters}
            onClearAll={() => {
              setFilters(DEFAULT_MANAGE_APPLICATIONS_FILTERS);
              setDebouncedSearch("");
              setPage(1);
            }}
            onApplyPreset={(id: ManageApplicationsFilterPresetId) => {
              setFilters(getManageApplicationsPresetState(id));
              setDebouncedSearch("");
              setPage(1);
            }}
          />
        </div>
      </div>
      <div>
        <h3 className="mb-4 text-lg font-bold">Manage Applications</h3>
        {count === 0 ? (
          <p className="rounded-xl border border-dashed border-black/15 bg-amal-sheet px-4 py-6 text-center text-sm text-zinc-500">
            {hasActive
              ? "No rows match your filters."
              : "No applications assigned to you yet."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-zinc-500">
                  <th className="py-2">Stage</th>
                  <th>Application</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-black/5">
                    <td className="py-3 font-semibold">
                      {row.name || "Review"}
                    </td>
                    <td>#{row.job_application}</td>
                    <td>
                      <StageStatusPill status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <TablePager page={page} pageSize={10} count={count} onPage={setPage} />
      </div>
    </div>
  );
}
