"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ApiError, mediaUrl } from "@/lib/api";
import {
  buildCvSearchSearchParams,
  filtersFromCvSearchUrl,
  parseCvSearchSearchParams,
} from "@/lib/cv-search-url";
import {
  DEFAULT_JOB_APPLICATIONS_FILTERS,
  jobApplicationsFiltersToApiParams,
  type JobApplicationsFilterState,
} from "@/lib/job-applications-filters";
import { getStaffJobOpenings, searchResumes } from "@/lib/staff-api";
import { STATUS_TONE, labelFor } from "@/lib/status";
import type {
  StaffApplicationCvSearchResult,
  StaffJobOpening,
} from "@/lib/types";
import { ApplicationAssessmentCells } from "./ApplicationAssessmentCells";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JobApplicationsFilterBar } from "./JobApplicationsFilterBar";
import { AssessmentCell } from "./assessment-status";
import { ExternalLinkIcon, EyeIcon, FilterIcon, SearchIcon } from "./icons";
import { TablePager } from "./ui";

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
const MATCH_TYPE_LABEL: Record<string, string> = {
  exact: "Exact",
  starts_with: "Starts with",
  ends_with: "Ends with",
  contains: "Includes",
};
const MATCH_TYPE_TONE: Record<string, string> = {
  exact: "border-emerald-200 bg-emerald-50 text-emerald-800",
  starts_with: "border-black/10 bg-amal-sheet text-zinc-700",
  ends_with: "border-amal-ink/20 bg-amal-ink/10 text-amal-ink",
  contains: "border-amber-200 bg-amber-50 text-amber-800",
};

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

function formatAppliedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function CvSearchScreen() {
  const searchParams = useSearchParams();
  const writtenQuery = useRef(searchParams.toString());
  const initial = parseCvSearchSearchParams(searchParams);
  const [filters, setFilters] = useState<JobApplicationsFilterState>(() =>
    filtersFromCvSearchUrl(initial),
  );
  const [submittedQuery, setSubmittedQuery] = useState(
    () => (initial.q ?? "").trim(),
  );
  const [page, setPage] = useState(() => initial.page ?? 1);
  const [pageSize, setPageSize] = useState(() => initial.pageSize ?? 25);
  const [rows, setRows] = useState<StaffApplicationCvSearchResult[]>([]);
  const [count, setCount] = useState(0);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(
    () => (initial.q ?? "").trim().length >= 2,
  );
  const [searchTick, setSearchTick] = useState(0);
  const [jobs, setJobs] = useState<StaffJobOpening[]>([]);

  const hasSearched = submittedQuery.length >= 2;
  const apiParams = useMemo(
    () =>
      jobApplicationsFiltersToApiParams("", {
        ...DEFAULT_JOB_APPLICATIONS_FILTERS,
        searchInput: "",
        statusFilter: filters.statusFilter,
        jobFilter: filters.jobFilter,
        appliedFrom: filters.appliedFrom,
        appliedTo: filters.appliedTo,
        firstTestScoreMin: filters.firstTestScoreMin,
        firstTestScoreMax: filters.firstTestScoreMax,
        aiRelevanceScoreMin: filters.aiRelevanceScoreMin,
        aiRelevanceScoreMax: filters.aiRelevanceScoreMax,
        requireFirstTest: filters.requireFirstTest,
        requireVideo: filters.requireVideo,
        requireQuestionnaire: filters.requireQuestionnaire,
      }),
    [
      filters.statusFilter,
      filters.jobFilter,
      filters.appliedFrom,
      filters.appliedTo,
      filters.firstTestScoreMin,
      filters.firstTestScoreMax,
      filters.aiRelevanceScoreMin,
      filters.aiRelevanceScoreMax,
      filters.requireFirstTest,
      filters.requireVideo,
      filters.requireQuestionnaire,
    ],
  );

  useEffect(() => {
    void getStaffJobOpenings({ status: "all", page_size: 150 })
      .then((pageData) => setJobs(pageData.results ?? []))
      .catch(() => setJobs([]));
  }, []);

  useEffect(() => {
    const next = buildCvSearchSearchParams({
      q: submittedQuery,
      jobFilter: filters.jobFilter,
      statusFilter: filters.statusFilter,
      datePreset: filters.datePreset,
      appliedFrom: filters.appliedFrom,
      appliedTo: filters.appliedTo,
      firstTestScoreMin: filters.firstTestScoreMin,
      firstTestScoreMax: filters.firstTestScoreMax,
      aiRelevanceScoreMin: filters.aiRelevanceScoreMin,
      aiRelevanceScoreMax: filters.aiRelevanceScoreMax,
      requireFirstTest: filters.requireFirstTest,
      requireVideo: filters.requireVideo,
      requireQuestionnaire: filters.requireQuestionnaire,
      advancedOpen: filters.advancedOpen,
      page,
      pageSize,
    }).toString();
    if (next === writtenQuery.current) {
      return;
    }
    writtenQuery.current = next;
    const href = next ? `/staff/cv-search?${next}` : "/staff/cv-search";
    window.history.replaceState(window.history.state, "", href);
  }, [
    submittedQuery,
    filters.jobFilter,
    filters.statusFilter,
    filters.datePreset,
    filters.appliedFrom,
    filters.appliedTo,
    filters.firstTestScoreMin,
    filters.firstTestScoreMax,
    filters.aiRelevanceScoreMin,
    filters.aiRelevanceScoreMax,
    filters.requireFirstTest,
    filters.requireVideo,
    filters.requireQuestionnaire,
    filters.advancedOpen,
    page,
    pageSize,
  ]);

  useEffect(() => {
    if (!hasSearched) {
      return;
    }
    let ignore = false;
    searchResumes({
      q: submittedQuery,
      page,
      page_size: pageSize,
      ...apiParams,
    })
      .then((data) => {
        if (ignore) {
          return;
        }
        setRows(data.results);
        setCount(data.count);
        setNotice("");
        setBusy(false);
      })
      .catch((error) => {
        if (ignore) {
          return;
        }
        setRows([]);
        setCount(0);
        setNotice(errorText(error));
        setBusy(false);
      });
    return () => {
      ignore = true;
    };
  }, [apiParams, hasSearched, page, pageSize, searchTick, submittedQuery]);

  function submitQuery() {
    const term = filters.searchInput.trim();
    if (term.length < 2) {
      setNotice("Enter at least two characters.");
      setSubmittedQuery("");
      setRows([]);
      setCount(0);
      return;
    }
    setBusy(true);
    setNotice("");
    setPage(1);
    setSubmittedQuery(term);
    setSearchTick((current) => current + 1);
  }

  function patchFilters(patch: Partial<JobApplicationsFilterState>) {
    setFilters((current) => ({ ...current, ...patch }));
    const onlySearch =
      Object.keys(patch).length === 1 && "searchInput" in patch;
    if (!onlySearch) {
      setPage(1);
    }
    if (patch.searchInput === "") {
      setSubmittedQuery("");
      setRows([]);
      setCount(0);
    }
  }

  return (
    <div>
      <Breadcrumbs
        linkAs="careers"
        items={[
          { label: "Careers", href: "/staff" },
          { label: "CV search" },
        ]}
      />
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        Advanced CV search
      </h1>
      <p className="mt-2 whitespace-nowrap text-sm text-zinc-600">
        Search parsed resume text across job applications. Results are ranked by match quality (exact, starts with, ends with, includes).
      </p>
      {notice ? (
        <p className="mt-4 text-sm text-amal-red">{notice}</p>
      ) : null}
      <div className="mt-6 rounded-2xl border border-black/10 bg-amal-white p-4 md:p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-amal-sheet text-zinc-600">
              <FilterIcon className="h-3.5 w-3.5" />
            </span>
            <h2 className="text-base font-bold">Filters</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Search resume text, status, job opening, dates, scores, and completed assessments
          </p>
        </div>
        <JobApplicationsFilterBar
          filters={filters}
          debouncedSearch={submittedQuery}
          applicationTotalCount={count}
          jobsForFilters={jobs}
          onChange={patchFilters}
          onClearAll={() => {
            setFilters({
              ...DEFAULT_JOB_APPLICATIONS_FILTERS,
              searchInput: filters.searchInput,
            });
            setPage(1);
          }}
          searchPlaceholder="e.g. django rest postgres"
          onSearchKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submitQuery();
            }
          }}
          onSearchSubmit={submitQuery}
          hidePresets
          hideCount={!hasSearched}
          countText={`${count} match${count === 1 ? "" : "es"}`}
          showAdvancedSearch={false}
        />
      </div>
      <div className="mt-6 rounded-2xl border border-black/10 bg-amal-white p-4 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {hasSearched ? (
            <p className="text-sm text-zinc-500">
              {count} match{count === 1 ? "" : "es"} for “{submittedQuery}”
            </p>
          ) : null}
        </div>
        {!hasSearched ? (
          <div className="rounded-xl border border-dashed border-black/10 bg-amal-sheet/60 px-4 py-6 text-center">
            <span className="mx-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-amal-white text-zinc-500 shadow-sm">
              <SearchIcon className="h-4 w-4" />
            </span>
            <p className="mt-2 text-sm font-semibold">Search resume text</p>
            <p className="mt-1 text-xs text-zinc-500">
              Enter keywords and press Search to find matching applications.
            </p>
          </div>
        ) : busy && rows.length === 0 ? (
          <p className="text-sm text-zinc-500">Searching CVs…</p>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/10 bg-amal-sheet/60 px-4 py-6 text-center">
            <span className="mx-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-amal-white text-zinc-500 shadow-sm">
              <SearchIcon className="h-4 w-4" />
            </span>
            <p className="mt-2 text-sm font-semibold">No matches</p>
            <p className="mt-1 text-xs text-zinc-500">
              Try different keywords or relax job, status, or date filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1480px] text-center text-sm">
              <thead>
                <tr className="border-b border-black/10">
                  {(
                    [
                      "Applicant",
                      "Role",
                      "Resume",
                      "Status",
                      "Applied",
                      "First Test",
                      "Video Test",
                      "General Questionnaire",
                      "AI",
                      "Score",
                      "Matched",
                      "Actions",
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
                {rows.map((row) => {
                  const resumeHref = mediaUrl(row.resume);
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-black/5 align-top hover:bg-amal-sheet/80"
                    >
                      <td className="px-3 py-3 text-left">
                        <Link
                          href={`/staff/applications/${row.id}`}
                          className="font-medium hover:underline"
                        >
                          {row.applicant.name}
                        </Link>
                        <p className="text-xs text-zinc-500">
                          {row.applicant.email}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-left">
                        {row.job_opening_name}
                      </td>
                      <td className="px-3 py-3">
                        {resumeHref ? (
                          <a
                            href={resumeHref}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex justify-center text-zinc-500 hover:text-amal-ink"
                            title="View resume"
                          >
                            <ExternalLinkIcon className="h-4 w-4" />
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <AssessmentCell>
                          <span
                            className={`inline-flex h-7 items-center rounded-full px-2 text-xs font-semibold ${STATUS_TONE[row.status]}`}
                          >
                            {labelFor(row.status)}
                          </span>
                        </AssessmentCell>
                      </td>
                      <td className="px-3 py-3 text-zinc-600">
                        {formatAppliedAt(row.applied_at)}
                      </td>
                      <ApplicationAssessmentCells row={row} />
                      <td className="px-3 py-3 text-left">
                        <div className="flex max-w-md flex-col gap-1.5">
                          {(row.cv_matches ?? []).map((match) => (
                            <div
                              key={`${row.id}-${match.term}-${match.match_type}`}
                              className="space-y-0.5"
                            >
                              <span
                                className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                                  MATCH_TYPE_TONE[match.match_type] ??
                                  "border-black/10 bg-amal-sheet text-zinc-700"
                                }`}
                                title={match.snippet}
                              >
                                {match.term}
                                <span className="font-medium opacity-80">
                                  ·{" "}
                                  {MATCH_TYPE_LABEL[match.match_type] ??
                                    match.match_type}
                                </span>
                              </span>
                              {match.snippet ? (
                                <p className="line-clamp-2 text-[11px] leading-snug text-zinc-500">
                                  {match.snippet}
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Link
                          href={`/staff/applications/${row.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/15 bg-amal-white text-zinc-600 hover:bg-amal-sheet hover:text-amal-ink"
                          title="Open application"
                          aria-label={`Open application for ${row.applicant.name}`}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {hasSearched && count > 0 ? (
          <TablePager
            page={page}
            pageSize={pageSize}
            count={count}
            pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
            onPage={setPage}
            onPageSizeChange={(next) => {
              setPageSize(next);
              setPage(1);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
