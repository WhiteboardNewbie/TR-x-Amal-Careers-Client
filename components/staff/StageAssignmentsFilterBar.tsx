"use client";

import { useMemo } from "react";
import {
  DatePresetField,
  SearchableFilterDropdown,
  type FilterOption,
} from "@/components/staff/JobApplicationsFilterBar";
import {
  ChevronDownIcon,
  FilterIcon,
  SearchIcon,
  XIcon,
} from "@/components/staff/icons";
import {
  buildActiveStageAssignmentFilterChips,
  dateRangeForPreset,
  hasActiveStageAssignmentFilters,
  matchesStageAssignmentsPreset,
  type StageAssignmentsDatePreset,
  type StageAssignmentsFilterPresetId,
  type StageAssignmentsFilterState,
} from "@/lib/stage-assignments-filters";
import { FUNNEL_STATUSES, STATUS_LABEL, TERMINAL_STATUSES } from "@/lib/status";
import type { StaffJobOpening } from "@/lib/types";

const SCORE_INPUT_CLASS =
  "w-full rounded-lg border border-black/15 bg-amal-sheet px-3 py-2 text-sm outline-none focus:border-amal-red focus:ring-2 focus:ring-amal-red/20";

const STAGE_STATUS_PILLS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "requested_interview", label: "Requested interview" },
  { value: "interview", label: "Interview" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
] as const;

const PRESET_VIEWS: { id: StageAssignmentsFilterPresetId; label: string }[] = [
  { id: "awaiting-schedule", label: "Awaiting schedule" },
  { id: "pending-stages", label: "Pending stages" },
  { id: "in-interview", label: "In interview" },
  { id: "manager-queue", label: "Manager queue" },
  { id: "pre-screening-complete", label: "Pre-screening complete" },
  { id: "high-ai-match", label: "High AI match" },
];

export function StageAssignmentsFilterBar({
  filters,
  debouncedSearch,
  totalCount,
  jobsForFilters,
  reviewerOptions,
  reviewerLoading = false,
  onChange,
  onClearAll,
  onApplyPreset,
}: {
  filters: StageAssignmentsFilterState;
  debouncedSearch: string;
  totalCount: number;
  jobsForFilters: StaffJobOpening[];
  reviewerOptions: FilterOption[];
  reviewerLoading?: boolean;
  onChange: (patch: Partial<StageAssignmentsFilterState>) => void;
  onClearAll: () => void;
  onApplyPreset: (id: StageAssignmentsFilterPresetId) => void;
}) {
  const applicationStatusPills = useMemo(
    () => [
      { value: "all", label: "All" },
      ...FUNNEL_STATUSES.map((status) => ({
        value: status,
        label: STATUS_LABEL[status] ?? status,
      })),
      ...TERMINAL_STATUSES.map((status) => ({
        value: status,
        label: STATUS_LABEL[status] ?? status,
      })),
    ],
    [],
  );

  const jobOptions = useMemo(
    () =>
      jobsForFilters
        .filter((job) => job.slug)
        .map((job) => ({ value: job.slug, label: job.title })),
    [jobsForFilters],
  );

  const reviewerLabel = reviewerOptions.find(
    (option) => option.value === filters.assignedTo,
  )?.label;

  const chips = buildActiveStageAssignmentFilterChips(
    debouncedSearch,
    filters,
    onChange,
    reviewerLabel,
  );
  const hasActive = hasActiveStageAssignmentFilters(debouncedSearch, filters);

  function handleCreatedPresetChange(preset: StageAssignmentsDatePreset) {
    if (preset === "custom") {
      onChange({ createdDatePreset: "custom" });
      return;
    }
    const range = dateRangeForPreset(preset);
    onChange({
      createdDatePreset: preset,
      createdFrom: range.from,
      createdTo: range.to,
    });
  }

  function handleScheduledPresetChange(preset: StageAssignmentsDatePreset) {
    if (preset === "custom") {
      onChange({ scheduledDatePreset: "custom" });
      return;
    }
    const range = dateRangeForPreset(preset);
    onChange({
      scheduledDatePreset: preset,
      scheduledFrom: range.from,
      scheduledTo: range.to,
    });
  }

  function handleAppliedPresetChange(preset: StageAssignmentsDatePreset) {
    if (preset === "custom") {
      onChange({ appliedDatePreset: "custom" });
      return;
    }
    const range = dateRangeForPreset(preset);
    onChange({
      appliedDatePreset: preset,
      appliedFrom: range.from,
      appliedTo: range.to,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-black/15 bg-amal-sheet/70 px-3 py-2 focus-within:border-amal-red">
          <SearchIcon className="h-4 w-4 shrink-0 text-zinc-400" />
          <input
            id="careers-stage-assignments-search"
            value={filters.searchInput}
            onChange={(event) => onChange({ searchInput: event.target.value })}
            placeholder="Search applicant, job, or manager…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchableFilterDropdown
            buttonId="careers-stage-assignments-job"
            value={filters.jobFilter}
            onChange={(jobFilter) => {
              const patch: Partial<StageAssignmentsFilterState> = { jobFilter };
              if (jobFilter !== "all") {
                patch.assignedTo = "all";
              }
              onChange(patch);
            }}
            placeholder="Select job opening"
            allLabel="All openings"
            options={jobOptions}
          />
          <button
            type="button"
            onClick={() => onChange({ advancedOpen: !filters.advancedOpen })}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium ${
              filters.advancedOpen
                ? "border-amal-ink bg-amal-ink text-amal-white"
                : "border-black/15 bg-amal-white text-zinc-700 hover:bg-amal-sheet"
            }`}
            aria-expanded={filters.advancedOpen}
          >
            <FilterIcon className="h-3.5 w-3.5" />
            More filters
            <ChevronDownIcon
              className={`h-3.5 w-3.5 transition-transform duration-200 ${filters.advancedOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
          Stage status
        </p>
        <div className="flex min-w-max flex-wrap items-center gap-2">
          {STAGE_STATUS_PILLS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange({ stageStatusFilter: item.value })}
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                filters.stageStatusFilter === item.value
                  ? "border-amal-ink bg-amal-ink text-amal-white"
                  : "border-black/15 bg-amal-white text-zinc-600 hover:border-black/30"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
          Application status
        </p>
        <div className="flex min-w-max flex-wrap items-center gap-2">
          {applicationStatusPills.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange({ applicationStatusFilter: item.value })}
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                filters.applicationStatusFilter === item.value
                  ? "border-amal-ink bg-amal-ink text-amal-white"
                  : "border-black/15 bg-amal-white text-zinc-600 hover:border-black/30"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {filters.advancedOpen ? (
        <div className="space-y-4 rounded-xl border border-black/5 bg-amal-sheet/60 p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <DatePresetField
              label="Created date"
              preset={filters.createdDatePreset}
              from={filters.createdFrom}
              to={filters.createdTo}
              onPresetChange={handleCreatedPresetChange}
              onFromChange={(createdFrom) =>
                onChange({ createdFrom, createdDatePreset: "custom" })
              }
              onToChange={(createdTo) =>
                onChange({ createdTo, createdDatePreset: "custom" })
              }
            />
            <DatePresetField
              label="Interview scheduled"
              preset={filters.scheduledDatePreset}
              from={filters.scheduledFrom}
              to={filters.scheduledTo}
              onPresetChange={handleScheduledPresetChange}
              onFromChange={(scheduledFrom) =>
                onChange({ scheduledFrom, scheduledDatePreset: "custom" })
              }
              onToChange={(scheduledTo) =>
                onChange({ scheduledTo, scheduledDatePreset: "custom" })
              }
            />
            <DatePresetField
              label="Applied date"
              preset={filters.appliedDatePreset}
              from={filters.appliedFrom}
              to={filters.appliedTo}
              onPresetChange={handleAppliedPresetChange}
              onFromChange={(appliedFrom) =>
                onChange({ appliedFrom, appliedDatePreset: "custom" })
              }
              onToChange={(appliedTo) =>
                onChange({ appliedTo, appliedDatePreset: "custom" })
              }
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label
              htmlFor="careers-stage-assignments-reviewer"
              className="flex min-w-0 flex-col gap-1"
            >
              <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Assigned reviewer
              </span>
              <SearchableFilterDropdown
                buttonId="careers-stage-assignments-reviewer"
                className="relative w-full min-w-0"
                buttonClassName="flex w-full items-center justify-between rounded-lg border border-black/15 bg-amal-sheet px-3 py-2 text-sm"
                value={filters.assignedTo}
                onChange={(assignedTo) => onChange({ assignedTo })}
                placeholder={
                  reviewerLoading ? "Loading reviewers…" : "Select reviewer"
                }
                allLabel="All reviewers"
                options={reviewerOptions}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Sort by created
              </span>
              <select
                value={filters.sort}
                onChange={(event) =>
                  onChange({
                    sort: event.target.value === "oldest" ? "oldest" : "newest",
                  })
                }
                className={SCORE_INPUT_CLASS}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                First test min (0–100)
              </span>
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={filters.firstTestScoreMin}
                onChange={(event) =>
                  onChange({ firstTestScoreMin: event.target.value })
                }
                placeholder="Min"
                className={SCORE_INPUT_CLASS}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                First test max (0–100)
              </span>
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={filters.firstTestScoreMax}
                onChange={(event) =>
                  onChange({ firstTestScoreMax: event.target.value })
                }
                placeholder="Max"
                className={SCORE_INPUT_CLASS}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                AI relevance min (0–100)
              </span>
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={filters.aiRelevanceScoreMin}
                onChange={(event) =>
                  onChange({ aiRelevanceScoreMin: event.target.value })
                }
                placeholder="Min"
                className={SCORE_INPUT_CLASS}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                AI relevance max (0–100)
              </span>
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={filters.aiRelevanceScoreMax}
                onChange={(event) =>
                  onChange({ aiRelevanceScoreMax: event.target.value })
                }
                placeholder="Max"
                className={SCORE_INPUT_CLASS}
              />
            </label>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Completed assessments
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  {
                    key: "requireFirstTest" as const,
                    label: "First test",
                    active: filters.requireFirstTest,
                  },
                  {
                    key: "requireVideo" as const,
                    label: "Video test",
                    active: filters.requireVideo,
                  },
                  {
                    key: "requireQuestionnaire" as const,
                    label: "General questionnaire",
                    active: filters.requireQuestionnaire,
                  },
                ] as const
              ).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onChange({ [item.key]: !item.active })}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    item.active
                      ? "border-amal-red bg-amal-red text-amal-white"
                      : "border-black/15 bg-amal-white text-zinc-600 hover:border-black/30"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-snug text-zinc-500">
              Only assignments whose application has each selected step with
              session status{" "}
              <span className="font-semibold text-zinc-700">completed</span>.
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-black/5 pt-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">
              {totalCount} assignment{totalCount === 1 ? "" : "s"}
            </span>
            {hasActive ? (
              <button
                type="button"
                onClick={onClearAll}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-amal-sheet hover:text-amal-ink"
              >
                <XIcon className="h-3.5 w-3.5" />
                Clear all
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_VIEWS.map((preset) => {
              const active = matchesStageAssignmentsPreset(
                debouncedSearch,
                filters,
                preset.id,
              );
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onApplyPreset(preset.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    active
                      ? "border-amal-red bg-amal-red/10 text-amal-red"
                      : "border-black/15 bg-amal-white text-zinc-600 hover:border-black/30"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
        {chips.length > 0 ? (
          <div className="flex flex-wrap gap-2 sm:max-w-xl sm:justify-end">
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.onRemove}
                className="inline-flex items-center gap-1 rounded-full border border-black/15 bg-amal-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-amal-sheet"
              >
                {chip.label}
                <XIcon className="h-3 w-3 text-zinc-400" />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
