"use client";

import Link from "next/link";
import type { KeyboardEvent, MouseEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  dateRangeForPreset,
  hasActiveJobApplicationFilters,
  matchesJobApplicationsPreset,
  type JobApplicationsDatePreset,
  type JobApplicationsFilterPresetId,
  type JobApplicationsFilterState,
} from "@/lib/job-applications-filters";
import { FUNNEL_STATUSES, STATUS_LABEL, TERMINAL_STATUSES } from "@/lib/status";
import type { StaffJobOpening } from "@/lib/types";
import {
  CheckIcon,
  ChevronDownIcon,
  FilterIcon,
  SearchIcon,
  XIcon,
} from "./icons";

const SCORE_INPUT_CLASS =
  "w-full rounded-lg border border-black/15 bg-amal-white px-3 py-2 text-sm outline-none focus:border-amal-red focus:ring-2 focus:ring-amal-red/20";

const DATE_PRESET_OPTIONS: {
  value: JobApplicationsDatePreset;
  label: string;
}[] = [
  { value: "any", label: "Any time" },
  { value: "last7", label: "Last 7 days" },
  { value: "last30", label: "Last 30 days" },
  { value: "quarter", label: "This quarter" },
  { value: "custom", label: "Custom range" },
];

const PRESET_VIEWS: { id: JobApplicationsFilterPresetId; label: string }[] = [
  { id: "needs-review", label: "Needs review" },
  { id: "manager-queue", label: "Manager queue" },
  { id: "pre-screening-complete", label: "Pre-screening complete" },
  { id: "high-ai-match", label: "High AI match" },
  { id: "shortlisted-plus", label: "Shortlisted+" },
];

function SearchableFilterDropdown({
  value,
  onChange,
  options,
  buttonId,
  placeholder,
  allLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  buttonId: string;
  placeholder: string;
  allLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDown(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return options;
    }
    return options.filter((option) =>
      option.label.toLowerCase().includes(query),
    );
  }, [options, search]);

  const selectedLabel =
    options.find((option) => option.value === value)?.label ||
    (value === "all" ? allLabel : placeholder);

  return (
    <div ref={wrapRef} className="relative min-w-[12rem]">
      <button
        id={buttonId}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-lg border border-black/15 bg-amal-white px-3 py-2 text-sm"
      >
        <span className="truncate text-left">{selectedLabel}</span>
        <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
      </button>
      {open ? (
        <div className="absolute z-30 mt-1 w-full min-w-[14rem] rounded-lg border border-black/10 bg-amal-white shadow-lg">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search..."
            className="w-full border-b border-black/10 px-3 py-2 text-sm outline-none"
          />
          <div className="max-h-56 overflow-auto py-1">
            <button
              type="button"
              onClick={() => {
                onChange("all");
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-amal-sheet"
            >
              <span className="truncate">{allLabel}</span>
              {value === "all" ? <CheckIcon className="h-3.5 w-3.5" /> : null}
            </button>
            {filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-amal-sheet"
              >
                <span className="truncate">{option.label}</span>
                {option.value === value ? (
                  <CheckIcon className="h-3.5 w-3.5" />
                ) : null}
              </button>
            ))}
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-zinc-500">No matches</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function JobApplicationsFilterBar({
  filters,
  debouncedSearch,
  applicationTotalCount,
  jobsForFilters,
  onChange,
  onClearAll,
  onApplyPreset,
  searchPlaceholder = "Search applicant, email, role, notes…",
  onSearchKeyDown,
  onSearchSubmit,
  hidePresets = false,
  hideCount = false,
  countText,
  showAdvancedSearch = true,
  onAdvancedSearchClick,
}: {
  filters: JobApplicationsFilterState;
  debouncedSearch: string;
  applicationTotalCount: number;
  jobsForFilters: StaffJobOpening[];
  onChange: (patch: Partial<JobApplicationsFilterState>) => void;
  onClearAll: () => void;
  onApplyPreset?: (presetId: JobApplicationsFilterPresetId) => void;
  searchPlaceholder?: string;
  onSearchKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  onSearchSubmit?: () => void;
  hidePresets?: boolean;
  hideCount?: boolean;
  countText?: string;
  showAdvancedSearch?: boolean;
  onAdvancedSearchClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const statusPills = useMemo(
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

  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  if (debouncedSearch.trim()) {
    chips.push({
      key: "search",
      label: `Search: ${debouncedSearch.trim()}`,
      onRemove: () => onChange({ searchInput: "" }),
    });
  }
  if (filters.statusFilter !== "all") {
    const label = filters.statusFilter.includes(",")
      ? filters.statusFilter
          .split(",")
          .map((status) => STATUS_LABEL[status] ?? status)
          .join(", ")
      : (STATUS_LABEL[filters.statusFilter] ?? filters.statusFilter);
    chips.push({
      key: "status",
      label: `Status: ${label}`,
      onRemove: () => onChange({ statusFilter: "all" }),
    });
  }
  if (filters.jobFilter !== "all") {
    chips.push({
      key: "job",
      label: "Job opening filtered",
      onRemove: () => onChange({ jobFilter: "all" }),
    });
  }
  if (filters.appliedFrom || filters.appliedTo) {
    const presetLabel = DATE_PRESET_OPTIONS.find(
      (option) => option.value === filters.datePreset,
    )?.label;
    const rangeLabel =
      filters.datePreset !== "custom" && filters.datePreset !== "any"
        ? presetLabel
        : [filters.appliedFrom, filters.appliedTo].filter(Boolean).join(" – ");
    chips.push({
      key: "date",
      label: `Applied: ${rangeLabel}`,
      onRemove: () =>
        onChange({ datePreset: "any", appliedFrom: "", appliedTo: "" }),
    });
  }
  if (filters.firstTestScoreMin.trim() || filters.firstTestScoreMax.trim()) {
    const min = filters.firstTestScoreMin.trim();
    const max = filters.firstTestScoreMax.trim();
    chips.push({
      key: "first-test",
      label:
        min && max
          ? `First test ${min}–${max}`
          : min
            ? `First test ≥ ${min}`
            : `First test ≤ ${max}`,
      onRemove: () => onChange({ firstTestScoreMin: "", firstTestScoreMax: "" }),
    });
  }
  if (filters.aiRelevanceScoreMin.trim() || filters.aiRelevanceScoreMax.trim()) {
    const min = filters.aiRelevanceScoreMin.trim();
    const max = filters.aiRelevanceScoreMax.trim();
    chips.push({
      key: "ai-score",
      label:
        min && max
          ? `AI score ${min}–${max}`
          : min
            ? `AI score ≥ ${min}`
            : `AI score ≤ ${max}`,
      onRemove: () =>
        onChange({ aiRelevanceScoreMin: "", aiRelevanceScoreMax: "" }),
    });
  }
  const assessmentCount = [
    filters.requireFirstTest,
    filters.requireVideo,
    filters.requireQuestionnaire,
  ].filter(Boolean).length;
  if (assessmentCount > 0) {
    chips.push({
      key: "assessments",
      label: `Assessments: ${assessmentCount} required`,
      onRemove: () =>
        onChange({
          requireFirstTest: false,
          requireVideo: false,
          requireQuestionnaire: false,
        }),
    });
  }

  const hasActive = hasActiveJobApplicationFilters(debouncedSearch, filters);

  function handleDatePresetChange(preset: JobApplicationsDatePreset) {
    if (preset === "custom") {
      onChange({ datePreset: "custom" });
      return;
    }
    const range = dateRangeForPreset(preset);
    onChange({
      datePreset: preset,
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
            id="careers-app-search"
            value={filters.searchInput}
            onChange={(event) => onChange({ searchInput: event.target.value })}
            onKeyDown={onSearchKeyDown}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onSearchSubmit ? (
            <button
              type="button"
              onClick={onSearchSubmit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amal-ink px-3 py-2 text-sm font-semibold text-amal-white hover:bg-amal-ink/90"
            >
              <SearchIcon className="h-3.5 w-3.5" />
              Search
            </button>
          ) : null}
          <SearchableFilterDropdown
            buttonId="careers-app-job"
            value={filters.jobFilter}
            onChange={(jobFilter) => onChange({ jobFilter })}
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
              className={`h-3.5 w-3.5 ${filters.advancedOpen ? "rotate-180" : ""}`}
            />
          </button>
          {showAdvancedSearch ? (
            <Link
              href="/staff/cv-search"
              className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-amal-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-amal-sheet"
              onClick={onAdvancedSearchClick}
            >
              <SearchIcon className="h-3.5 w-3.5" />
              Advanced Search
            </Link>
          ) : null}
        </div>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-max flex-wrap items-center gap-2">
          {statusPills.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange({ statusFilter: item.value })}
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                filters.statusFilter === item.value
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
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Applied date
              </span>
              <select
                value={filters.datePreset}
                onChange={(event) =>
                  handleDatePresetChange(
                    event.target.value as JobApplicationsDatePreset,
                  )
                }
                className={SCORE_INPUT_CLASS}
              >
                {DATE_PRESET_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {filters.datePreset === "custom" ? (
              <>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    From
                  </span>
                  <input
                    type="date"
                    value={filters.appliedFrom}
                    onChange={(event) =>
                      onChange({
                        appliedFrom: event.target.value,
                        datePreset: "custom",
                      })
                    }
                    className={SCORE_INPUT_CLASS}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    To
                  </span>
                  <input
                    type="date"
                    value={filters.appliedTo}
                    onChange={(event) =>
                      onChange({
                        appliedTo: event.target.value,
                        datePreset: "custom",
                      })
                    }
                    className={SCORE_INPUT_CLASS}
                  />
                </label>
              </>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(
              [
                [
                  "First test min (0–100)",
                  filters.firstTestScoreMin,
                  "firstTestScoreMin",
                ],
                [
                  "First test max (0–100)",
                  filters.firstTestScoreMax,
                  "firstTestScoreMax",
                ],
                [
                  "AI score min (0–100)",
                  filters.aiRelevanceScoreMin,
                  "aiRelevanceScoreMin",
                ],
                [
                  "AI score max (0–100)",
                  filters.aiRelevanceScoreMax,
                  "aiRelevanceScoreMax",
                ],
              ] as const
            ).map(([label, value, key]) => (
              <label key={key} className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  {label}
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={value}
                  onChange={(event) => onChange({ [key]: event.target.value })}
                  placeholder={label.includes("min") ? "Min" : "Max"}
                  className={SCORE_INPUT_CLASS}
                />
              </label>
            ))}
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
                      ? "border-amal-ink bg-amal-ink text-amal-white"
                      : "border-black/15 bg-amal-white text-zinc-600 hover:border-black/30"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-snug text-zinc-500">
              Only applications where each selected step has session status{" "}
              <span className="font-semibold text-zinc-700">completed</span>.
            </p>
          </div>
        </div>
      ) : null}

      {(!hideCount || hasActive || !hidePresets) && (
      <div className="flex flex-col gap-3 border-t border-black/5 pt-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {hideCount ? null : (
              <span className="text-sm font-semibold">
                {countText ??
                  `${applicationTotalCount} application${applicationTotalCount === 1 ? "" : "s"}`}
              </span>
            )}
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
          {hidePresets || !onApplyPreset ? null : (
          <div className="flex flex-wrap gap-2">
            {PRESET_VIEWS.map((preset) => {
              const active = matchesJobApplicationsPreset(
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
          )}
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
      )}
    </div>
  );
}
