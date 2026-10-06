"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { ApiError, getJobOpening, mediaUrl } from "@/lib/api";
import {
  persistCareersApplicationsReturn,
  type CareersApplicationsReturn,
} from "@/lib/careers-return";
import { isModifiedClick } from "@/lib/is-modified-click";
import {
  DEFAULT_JOB_APPLICATIONS_FILTERS,
  getJobApplicationsPresetState,
  hasActiveJobApplicationFilters,
  jobApplicationsFiltersToApiParams,
  type JobApplicationsFilterPresetId,
  type JobApplicationsFilterState,
} from "@/lib/job-applications-filters";
import {
  addComment,
  createStage,
  extendAssessment,
  getDepartmentManagers,
  getStaffApplications,
  getStaffJobOpenings,
  scoreResume,
  sendAssessmentInvite,
  updateApplicationStatus,
} from "@/lib/staff-api";
import { APPLICATION_STATUSES, STATUS_TONE, labelFor } from "@/lib/status";
import type {
  DepartmentManager,
  JobApplicationStatus,
  StaffApplication,
  StaffJobOpening,
} from "@/lib/types";
import { ApplicationDetailModal } from "./ApplicationDetailModal";
import {
  ASSESSMENT_BADGE_BASE,
  AssessmentCell,
  AssessmentLockedBadge,
  AssessmentNotStartedBadge,
  AssessmentStatusBadge,
  applicationHasAssessmentSession,
  applicationHasAttemptedAssessment,
  firstTestScoreBadgeClass,
  formatAssessmentDateTime,
  getAssessmentEffectiveStatus,
  getAssessmentExpiresAt,
  isAssessmentExpiryPassed,
  isPreScreeningComplete,
} from "./assessment-status";
import { JobApplicationsFilterBar } from "./JobApplicationsFilterBar";
import { ShareApplicationModal } from "./ShareApplicationModal";
import {
  ClockIcon,
  ExternalLinkIcon,
  EyeIcon,
  FileSearchIcon,
  FileTextIcon,
  MessageSquareIcon,
  MoreVerticalIcon,
  SendIcon,
  ShareIcon,
  SparklesIcon,
  VideoIcon,
} from "./icons";
import { GhostButton, PrimaryButton, TablePager } from "./ui";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

function formatAppliedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
const iconButtonClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/15 bg-amal-white text-zinc-600 hover:bg-amal-sheet hover:text-amal-ink";

export function ApplicationsTab({
  onError,
  jobOpening,
  status,
  initialFilters,
  initialPage,
  initialPageSize,
  onJobOpeningChange,
  onStatusChange,
  refreshTick,
}: {
  onError: (value: string) => void;
  jobOpening: string;
  status: string;
  initialFilters?: JobApplicationsFilterState;
  initialPage?: number;
  initialPageSize?: number;
  onJobOpeningChange: (slug: string) => void;
  onStatusChange: (status: string) => void;
  refreshTick: number;
}) {
  const [page, setPage] = useState(initialPage ?? 1);
  const [pageSize, setPageSize] = useState(initialPageSize ?? 10);
  const [tick, setTick] = useState(0);
  const [filters, setFilters] = useState<JobApplicationsFilterState>(() =>
    initialFilters ?? {
      ...DEFAULT_JOB_APPLICATIONS_FILTERS,
      jobFilter: jobOpening || "all",
      statusFilter: status || "all",
    },
  );
  const [debouncedSearch, setDebouncedSearch] = useState(
    filters.searchInput,
  );
  const [roles, setRoles] = useState<StaffJobOpening[]>([]);
  const [rows, setRows] = useState<StaffApplication[]>([]);
  const [count, setCount] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [statusDraftById, setStatusDraftById] = useState<Record<number, string>>(
    {},
  );
  const [rejection, setRejection] = useState<StaffApplication | null>(null);
  const [managerReview, setManagerReview] = useState<StaffApplication | null>(
    null,
  );
  const [clientReview, setClientReview] = useState<StaffApplication | null>(
    null,
  );
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [shareTarget, setShareTarget] = useState<StaffApplication | null>(null);
  const [commentTarget, setCommentTarget] = useState<StaffApplication | null>(
    null,
  );
  const [commentText, setCommentText] = useState("");
  const [resendTarget, setResendTarget] = useState<StaffApplication | null>(
    null,
  );
  const [extendTarget, setExtendTarget] = useState<StaffApplication | null>(
    null,
  );
  const [extendDays, setExtendDays] = useState<3 | 5 | 7 | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(filters.searchInput);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [filters.searchInput]);

  useEffect(() => {
    void getStaffJobOpenings({ status: "all", page_size: 150 })
      .then((pageData) => setRoles(pageData.results ?? []))
      .catch(() => setRoles([]));
  }, []);

  const apiParams = useMemo(
    () => jobApplicationsFiltersToApiParams(debouncedSearch, filters),
    [debouncedSearch, filters],
  );

  useEffect(() => {
    let ignore = false;
    getStaffApplications({
      page,
      page_size: pageSize,
      ...apiParams,
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
  }, [page, pageSize, tick, refreshTick, apiParams, onError]);

  useEffect(() => {
    function onDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function patchFilters(patch: Partial<JobApplicationsFilterState>) {
    setFilters((current) => {
      const next = { ...current, ...patch };
      if (patch.jobFilter !== undefined) {
        onJobOpeningChange(patch.jobFilter === "all" ? "" : patch.jobFilter);
      }
      if (patch.statusFilter !== undefined) {
        onStatusChange(
          patch.statusFilter === "all" ? "" : patch.statusFilter,
        );
      }
      return next;
    });
    setPage(1);
  }

  function clearFilters() {
    setFilters({
      ...DEFAULT_JOB_APPLICATIONS_FILTERS,
      advancedOpen: filters.advancedOpen,
    });
    onJobOpeningChange("");
    onStatusChange("");
    setPage(1);
  }

  function applyPreset(presetId: JobApplicationsFilterPresetId) {
    const next = getJobApplicationsPresetState(presetId);
    setFilters(next);
    onJobOpeningChange("");
    onStatusChange(next.statusFilter === "all" ? "" : next.statusFilter);
    setPage(1);
  }

  async function applyStatus(row: StaffApplication, next: JobApplicationStatus) {
    if (next === "rejected") {
      setRejection(row);
      return;
    }
    if (next === "manager-review") {
      setManagerReview(row);
      return;
    }
    if (next === "client-review") {
      setClientReview(row);
      return;
    }
    setStatusUpdatingId(row.id);
    try {
      await updateApplicationStatus(row.id, next);
      setTick((value) => value + 1);
    } catch (error) {
      onError(errorText(error));
    } finally {
      setStatusUpdatingId(null);
    }
  }

  async function confirmRejection() {
    if (!rejection) {
      return;
    }
    const row = rejection;
    setRejection(null);
    setStatusUpdatingId(row.id);
    try {
      await updateApplicationStatus(row.id, "rejected");
      setTick((value) => value + 1);
    } catch (error) {
      onError(errorText(error));
    } finally {
      setStatusUpdatingId(null);
    }
  }

  async function confirmManagerReview(payload: {
    managerIds: number[];
    stageName: string;
    stageNotes: string;
  }) {
    if (!managerReview || payload.managerIds.length === 0) {
      return;
    }
    const row = managerReview;
    setStatusUpdatingId(row.id);
    try {
      const results = await Promise.allSettled(
        payload.managerIds.map((id) =>
          createStage(row.id, {
            assigned_to: id,
            name: payload.stageName.trim() || undefined,
            hr_notes: payload.stageNotes.trim() || undefined,
          }),
        ),
      );
      if (results.every((result) => result.status === "rejected")) {
        const first = results[0];
        onError(
          first.status === "rejected"
            ? errorText(first.reason)
            : "Could not create stage or update status",
        );
        return;
      }
      await updateApplicationStatus(row.id, "manager-review");
      setManagerReview(null);
      setTick((value) => value + 1);
    } catch (error) {
      onError(errorText(error));
    } finally {
      setStatusUpdatingId(null);
    }
  }

  async function confirmClientReview(clientIds: number[]) {
    if (!clientReview || clientIds.length === 0) {
      return;
    }
    const row = clientReview;
    setStatusUpdatingId(row.id);
    try {
      await updateApplicationStatus(row.id, "client-review", {
        client_users: clientIds,
      });
      setClientReview(null);
      setTick((value) => value + 1);
    } catch (error) {
      onError(errorText(error));
    } finally {
      setStatusUpdatingId(null);
    }
  }

  async function sendTest(row: StaffApplication) {
    setProcessingId(row.id);
    try {
      await sendAssessmentInvite(row.id);
      setResendTarget(null);
      setTick((value) => value + 1);
    } catch (error) {
      onError(errorText(error));
    } finally {
      setProcessingId(null);
    }
  }

  const menuRow = rows.find((row) => row.id === menuOpenId) ?? null;
  const hasActive = hasActiveJobApplicationFilters(debouncedSearch, filters);

  function applicationsReturn(): CareersApplicationsReturn {
    return {
      tab: "applications",
      filters,
      page,
      pageSize,
    };
  }

  function persistReturn() {
    persistCareersApplicationsReturn(applicationsReturn());
  }

  function handleApplicationLinkClick(
    event: MouseEvent<HTMLAnchorElement>,
    id: number,
  ) {
    event.stopPropagation();
    if (isModifiedClick(event)) {
      persistReturn();
      return;
    }
    event.preventDefault();
    setSelectedId(id);
  }

  function handleRowClick(event: MouseEvent<HTMLTableRowElement>, id: number) {
    const target = event.target as HTMLElement | null;
    if (target?.closest("a, button, select, input, textarea, label")) {
      return;
    }
    if (isModifiedClick(event)) {
      persistReturn();
      window.open(`/staff/applications/${id}`, "_blank", "noopener,noreferrer");
      return;
    }
    setSelectedId(id);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Filters</h2>
        <p className="text-sm text-zinc-500">
          Search, status, job opening, dates, scores, and completed assessments
        </p>
        <div className="mt-4">
          <JobApplicationsFilterBar
            filters={filters}
            debouncedSearch={debouncedSearch}
            applicationTotalCount={count}
            jobsForFilters={roles}
            onChange={patchFilters}
            onClearAll={clearFilters}
            onApplyPreset={applyPreset}
            onAdvancedSearchClick={() => persistReturn()}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-bold">Job Applications</h3>
          <Link
            href="/staff/share-links"
            className="inline-flex items-center gap-2 rounded-lg border border-black/15 bg-amal-white px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-amal-sheet"
            onClick={() => persistReturn()}
          >
            <ShareIcon className="h-4 w-4" />
            Shared links
          </Link>
        </div>
        {rows.length === 0 ? (
          <div className="space-y-3">
            <p className="rounded-xl border border-dashed border-black/15 bg-amal-sheet px-4 py-6 text-center text-sm text-zinc-500">
              No applications found. Try adjusting filters or clear all filters
              to see every application.
            </p>
            {hasActive ? (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border border-black/15 bg-amal-white px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-amal-sheet"
              >
                Clear all filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-center text-sm">
              <thead>
                <tr className="border-b border-black/10">
                  {(
                    [
                      "View Job Opening",
                      "Applicant Name",
                      "Resume",
                      "Applied At",
                      "Status",
                      "First Test",
                      "Video Test",
                      "General Questionnaire",
                      "AI",
                      "Score",
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
                  const firstStatus = getAssessmentEffectiveStatus(
                    row.test_session,
                  );
                  const videoStatus = getAssessmentEffectiveStatus(
                    row.video_test_session,
                  );
                  const questionnaireStatus = getAssessmentEffectiveStatus(
                    row.general_questionnaire_session,
                  );
                  const firstScore = Number(
                    row.test_session?.score_percentage ?? Number.NaN,
                  );
                  const videoGated = Boolean(row.test_session) && firstStatus !== "completed";
                  const questionnaireGated =
                    Boolean(row.test_session) &&
                    (!row.video_test_session || videoStatus !== "completed");
                  return (
                    <tr
                      key={row.id}
                      className="cursor-pointer border-b border-black/5 hover:bg-amal-sheet/80"
                      onClick={(event) => handleRowClick(event, row.id)}
                    >
                      <td className="px-3 py-3">
                        <Link
                          href={`/staff/applications/${row.id}`}
                          className="font-medium text-amal-red hover:underline"
                          onClick={(event) =>
                            handleApplicationLinkClick(event, row.id)
                          }
                        >
                          {row.job_opening_name}
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <Link
                          href={`/staff/applications/${row.id}`}
                          className="font-medium hover:underline"
                          onClick={(event) =>
                            handleApplicationLinkClick(event, row.id)
                          }
                        >
                          {row.applicant.name}
                        </Link>
                      </td>
                      <td
                        className="px-3 py-3"
                        onClick={(event) => event.stopPropagation()}
                      >
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
                      <td className="px-3 py-3 text-zinc-600">
                        {formatAppliedAt(row.applied_at)}
                      </td>
                      <td
                        className="px-3 py-3"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <AssessmentCell>
                          <select
                            value={statusDraftById[row.id] ?? row.status}
                            disabled={statusUpdatingId === row.id}
                            onFocus={() => {
                              if (
                                row.status === "manager-review" ||
                                row.status === "client-review"
                              ) {
                                setStatusDraftById((current) => ({
                                  ...current,
                                  [row.id]: "",
                                }));
                              }
                            }}
                            onBlur={() => {
                              setStatusDraftById((current) => {
                                if (!(row.id in current)) {
                                  return current;
                                }
                                const next = { ...current };
                                delete next[row.id];
                                return next;
                              });
                            }}
                            onChange={(event) => {
                              setStatusDraftById((current) => {
                                if (!(row.id in current)) {
                                  return current;
                                }
                                const next = { ...current };
                                delete next[row.id];
                                return next;
                              });
                              void applyStatus(
                                row,
                                event.target.value as JobApplicationStatus,
                              );
                            }}
                            className={`h-7 cursor-pointer rounded-full border-0 px-2 text-xs font-semibold leading-none ${STATUS_TONE[row.status]}`}
                          >
                            {statusDraftById[row.id] === "" ? (
                              <option value="" disabled>
                                Select status…
                              </option>
                            ) : null}
                            {APPLICATION_STATUSES.map((item) => (
                              <option key={item} value={item}>
                                {labelFor(item)}
                              </option>
                            ))}
                          </select>
                        </AssessmentCell>
                      </td>
                      <td
                        className="px-3 py-3"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <AssessmentCell>
                          {!row.test_session ? (
                            <AssessmentNotStartedBadge />
                          ) : firstStatus === "completed" ? (
                            <Link
                              href={`/staff/applications/${row.id}/results/first-test`}
                              className={`${ASSESSMENT_BADGE_BASE} ${
                                Number.isNaN(firstScore)
                                  ? "border-black/10 bg-amal-sheet text-zinc-700"
                                  : firstTestScoreBadgeClass(firstScore)
                              }`}
                            >
                              <FileSearchIcon className="h-3.5 w-3.5" />
                              {Number.isNaN(firstScore)
                                ? "View"
                                : `${firstScore.toFixed(0)}%`}
                            </Link>
                          ) : (
                            <AssessmentStatusBadge
                              status={firstStatus}
                              expiresAt={row.test_session.expires_at}
                            />
                          )}
                        </AssessmentCell>
                      </td>
                      <td
                        className="px-3 py-3"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <AssessmentCell>
                          {!row.video_test_session ? (
                            videoGated &&
                            (firstStatus === "pending" ||
                              firstStatus === "in_progress" ||
                              firstStatus === "expired") ? (
                              <AssessmentLockedBadge />
                            ) : (
                              <AssessmentNotStartedBadge />
                            )
                          ) : videoStatus === "completed" ? (
                            <Link
                              href={`/staff/applications/${row.id}/results/video`}
                              className={`${ASSESSMENT_BADGE_BASE} border-emerald-200 bg-emerald-100 text-emerald-800`}
                            >
                              <VideoIcon className="h-3 w-3" />
                              Completed
                            </Link>
                          ) : videoGated &&
                            (videoStatus === "pending" ||
                              videoStatus === "in_progress") ? (
                            <AssessmentLockedBadge />
                          ) : (
                            <AssessmentStatusBadge
                              status={videoStatus}
                              expiresAt={row.video_test_session.expires_at}
                              icon={<VideoIcon className="h-3 w-3" />}
                            />
                          )}
                        </AssessmentCell>
                      </td>
                      <td
                        className="px-3 py-3"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <AssessmentCell>
                          {!row.general_questionnaire_session ? (
                            questionnaireGated ? (
                              <AssessmentLockedBadge />
                            ) : (
                              <AssessmentNotStartedBadge />
                            )
                          ) : questionnaireStatus === "completed" ? (
                            <Link
                              href={`/staff/applications/${row.id}/results/questionnaire`}
                              className={`${ASSESSMENT_BADGE_BASE} border-emerald-200 bg-emerald-100 text-emerald-800`}
                            >
                              <MessageSquareIcon className="h-3 w-3" />
                              Completed
                            </Link>
                          ) : questionnaireGated &&
                            (questionnaireStatus === "pending" ||
                              questionnaireStatus === "in_progress") ? (
                            <AssessmentLockedBadge />
                          ) : (
                            <AssessmentStatusBadge
                              status={questionnaireStatus}
                              expiresAt={
                                row.general_questionnaire_session.expires_at
                              }
                              icon={<MessageSquareIcon className="h-3 w-3" />}
                            />
                          )}
                        </AssessmentCell>
                      </td>
                      <td
                        className="px-3 py-3"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <AssessmentCell>
                          <div className="inline-flex items-center justify-center gap-1.5">
                            {row.ai_relevance_score == null ? (
                              <span className="inline-flex items-center gap-1 text-zinc-400">
                                <FileTextIcon className="h-3 w-3" />—
                              </span>
                            ) : (
                              <span
                                className={`${ASSESSMENT_BADGE_BASE} ${firstTestScoreBadgeClass(row.ai_relevance_score)}`}
                              >
                                <FileTextIcon className="h-3 w-3" />
                                {row.ai_relevance_score}%
                              </span>
                            )}
                            <span className="text-xs text-zinc-300">/</span>
                            <span className="inline-flex items-center gap-1 text-zinc-400">
                              <VideoIcon className="h-3 w-3" />—
                            </span>
                          </div>
                        </AssessmentCell>
                      </td>
                      <td className="px-3 py-3">
                        <AssessmentCell>
                          {row.manager_score_avg != null &&
                          String(row.manager_score_avg).trim() !== "" ? (
                            <span
                              className={`${ASSESSMENT_BADGE_BASE} border-transparent bg-amal-sheet text-zinc-800`}
                            >
                              {Number(row.manager_score_avg).toFixed(2)} / 10
                            </span>
                          ) : (
                            <span className="text-zinc-400">—</span>
                          )}
                        </AssessmentCell>
                      </td>
                      <td
                        className="relative px-3 py-3"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={`/staff/applications/${row.id}`}
                            className={iconButtonClass}
                            title="Open unified application view"
                            aria-label={`Open unified application view for ${row.applicant.name}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              persistReturn();
                            }}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            className={iconButtonClass}
                            title="Share application"
                            onClick={() => setShareTarget(row)}
                          >
                            <ShareIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className={iconButtonClass}
                            title="More actions"
                            aria-expanded={menuOpenId === row.id}
                            onClick={() =>
                              setMenuOpenId((current) =>
                                current === row.id ? null : row.id,
                              )
                            }
                          >
                            <MoreVerticalIcon className="h-4 w-4" />
                          </button>
                        </div>
                        {menuOpenId === row.id && menuRow ? (
                          <div
                            ref={menuRef}
                            className="absolute right-3 top-12 z-20 w-56 rounded-lg border border-black/10 bg-amal-white py-1 text-left shadow-lg"
                          >
                            <button
                              type="button"
                              disabled={processingId === menuRow.id}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-amal-sheet disabled:opacity-50"
                              onClick={() => {
                                setMenuOpenId(null);
                                if (applicationHasAttemptedAssessment(menuRow)) {
                                  setResendTarget(menuRow);
                                } else {
                                  void sendTest(menuRow);
                                }
                              }}
                            >
                              <SendIcon className="h-3.5 w-3.5" />
                              {processingId === menuRow.id
                                ? "Sending..."
                                : applicationHasAttemptedAssessment(menuRow)
                                  ? "Resend New Test"
                                  : "Send Test"}
                            </button>
                            <button
                              type="button"
                              disabled={
                                !applicationHasAssessmentSession(menuRow) ||
                                isPreScreeningComplete(menuRow) ||
                                !isAssessmentExpiryPassed(menuRow)
                              }
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-amal-sheet disabled:opacity-50"
                              onClick={() => {
                                setMenuOpenId(null);
                                setExtendDays(null);
                                setExtendTarget(menuRow);
                              }}
                            >
                              <ClockIcon className="h-3.5 w-3.5" />
                              Extend Test Expiry
                            </button>
                            <button
                              type="button"
                              disabled={!menuRow.resume}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-amal-sheet disabled:opacity-50"
                              onClick={() => {
                                setMenuOpenId(null);
                                setProcessingId(menuRow.id);
                                void scoreResume(menuRow.id)
                                  .then((result) => {
                                    setRows((current) =>
                                      current.map((item) =>
                                        item.id === menuRow.id
                                          ? {
                                              ...item,
                                              ai_relevance_score:
                                                result.ai_relevance_score,
                                            }
                                          : item,
                                      ),
                                    );
                                  })
                                  .catch((error) => onError(errorText(error)))
                                  .finally(() => setProcessingId(null));
                              }}
                            >
                              <SparklesIcon className="h-3.5 w-3.5" />
                              Analyze Resume
                            </button>
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-amal-sheet"
                              onClick={() => {
                                setMenuOpenId(null);
                                setCommentText("");
                                setCommentTarget(menuRow);
                              }}
                            >
                              <MessageSquareIcon className="h-3.5 w-3.5" />
                              Add comment
                            </button>
                            <Link
                              href="/staff/share-links"
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-amal-sheet"
                              onClick={() => setMenuOpenId(null)}
                            >
                              <ShareIcon className="h-3.5 w-3.5" />
                              Shared links
                            </Link>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
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

      {selectedId != null ? (
        <ApplicationDetailModal
          key={selectedId}
          applicationId={selectedId}
          statusUpdating={statusUpdatingId === selectedId}
          refreshKey={tick}
          onClose={() => setSelectedId(null)}
          onApplyStatus={(application, status) =>
            void applyStatus(application, status)
          }
          onPersistReturn={persistReturn}
        />
      ) : null}
      {shareTarget ? (
        <ShareApplicationModal
          applicationId={shareTarget.id}
          applicantName={shareTarget.applicant.name}
          onClose={() => setShareTarget(null)}
          onError={onError}
        />
      ) : null}
      {commentTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-amal-ink/45 p-4"
          onClick={() => setCommentTarget(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl bg-amal-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-bold">Add comment</h3>
            <p className="mt-1 text-sm text-zinc-500">
              {commentTarget.applicant.name}
            </p>
            <textarea
              className="mt-3 h-24 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <GhostButton type="button" onClick={() => setCommentTarget(null)}>
                Cancel
              </GhostButton>
              <PrimaryButton
                type="button"
                disabled={!commentText.trim()}
                onClick={() => {
                  void addComment(commentTarget.id, commentText.trim())
                    .then(() => setCommentTarget(null))
                    .catch((error) => onError(errorText(error)));
                }}
              >
                Save
              </PrimaryButton>
            </div>
          </div>
        </div>
      ) : null}
      {resendTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-amal-ink/45 p-4"
          onClick={() => setResendTarget(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl bg-amal-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-bold">Resend New Test?</h3>
            <p className="mt-2 text-sm text-zinc-600">
              A new test will be sent to{" "}
              <span className="font-semibold">{resendTarget.applicant.name}</span>
              . If an invite already exists, the server will reject a second
              send.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <GhostButton type="button" onClick={() => setResendTarget(null)}>
                Cancel
              </GhostButton>
              <PrimaryButton
                type="button"
                disabled={processingId === resendTarget.id}
                onClick={() => void sendTest(resendTarget)}
              >
                {processingId === resendTarget.id
                  ? "Sending..."
                  : "Confirm & Send"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      ) : null}
      {extendTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-amal-ink/45 p-4"
          onClick={() => setExtendTarget(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl bg-amal-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-bold">Extend Test Expiry</h3>
            <p className="mt-1 text-sm text-zinc-500">
              {extendTarget.applicant.name}
            </p>
            <p className="mt-3 text-sm text-zinc-600">
              Current expiry:{" "}
              {formatAssessmentDateTime(getAssessmentExpiresAt(extendTarget))}
            </p>
            <p className="mt-4 text-sm font-medium">Extend by</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {([3, 5, 7] as const).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setExtendDays(days)}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                    extendDays === days
                      ? "border-amal-red bg-amal-red text-amal-white"
                      : "border-black/15 bg-amal-white hover:bg-amal-sheet"
                  }`}
                >
                  +{days} days
                </button>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <GhostButton type="button" onClick={() => setExtendTarget(null)}>
                Cancel
              </GhostButton>
              {extendDays != null ? (
                <PrimaryButton
                  type="button"
                  onClick={() => {
                    void extendAssessment(extendTarget.id, extendDays)
                      .then(() => {
                        setExtendTarget(null);
                        setTick((value) => value + 1);
                      })
                      .catch((error) => onError(errorText(error)));
                  }}
                >
                  Confirm
                </PrimaryButton>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      {rejection ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setRejection(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl bg-amal-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-bold">Reject application?</h3>
            <p className="mt-2 text-sm text-zinc-600">
              This will reject <strong>{rejection.applicant.name}</strong> for{" "}
              <strong>{rejection.job_opening_name}</strong> and send a
              rejection email.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <GhostButton type="button" onClick={() => setRejection(null)}>
                Cancel
              </GhostButton>
              <button
                type="button"
                onClick={() => void confirmRejection()}
                className="rounded-lg bg-amal-red px-4 py-2 text-sm font-semibold text-amal-white"
              >
                Reject application
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {managerReview ? (
        <ManagerReviewModal
          application={managerReview}
          busy={statusUpdatingId === managerReview.id}
          onClose={() => setManagerReview(null)}
          onConfirm={(payload) => void confirmManagerReview(payload)}
        />
      ) : null}
      {clientReview ? (
        <ClientReviewModal
          application={clientReview}
          busy={statusUpdatingId === clientReview.id}
          onClose={() => setClientReview(null)}
          onConfirm={(ids) => void confirmClientReview(ids)}
        />
      ) : null}
    </div>
  );
}

function ManagerReviewModal({
  application,
  busy,
  onClose,
  onConfirm,
}: {
  application: StaffApplication;
  busy: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    managerIds: number[];
    stageName: string;
    stageNotes: string;
  }) => void;
}) {
  const [managers, setManagers] = useState<DepartmentManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [managerIds, setManagerIds] = useState<number[]>([]);
  const [stageName, setStageName] = useState("");
  const [stageNotes, setStageNotes] = useState("");

  useEffect(() => {
    let ignore = false;
    getJobOpening(application.job_opening)
      .then((opening) => getDepartmentManagers(opening.department))
      .then((list) => {
        if (!ignore) {
          setManagers(list);
        }
      })
      .catch(() => {
        if (!ignore) {
          setManagers([]);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [application.job_opening]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-amal-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-lg font-bold">Manager review — assign manager(s)</h3>
        <p className="mt-2 text-sm text-zinc-600">
          Create a stage for each selected manager for{" "}
          <strong>{application.applicant.name}</strong> on{" "}
          <strong>{application.job_opening_name}</strong>, then set the
          application to <strong>Manager review</strong>.
        </p>
        {loading ? (
          <p className="mt-4 text-sm text-zinc-500">Loading managers…</p>
        ) : managers.length === 0 ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            No assignees found. Fix reporting levels or pick another status.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            <fieldset>
              <legend className="mb-2 block text-xs font-medium text-zinc-600">
                Assign to manager(s)
              </legend>
              <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-black/15 p-2">
                {managers.map((manager) => {
                  const checked = managerIds.includes(manager.id);
                  return (
                    <label
                      key={manager.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-amal-sheet"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setManagerIds((current) =>
                            checked
                              ? current.filter((id) => id !== manager.id)
                              : [...current, manager.id],
                          )
                        }
                      />
                      {manager.full_name}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <label className="block text-xs font-medium text-zinc-600">
              Stage name (optional)
              <input
                className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
                value={stageName}
                onChange={(event) => setStageName(event.target.value)}
                placeholder="e.g. Technical interview"
              />
            </label>
            <label className="block text-xs font-medium text-zinc-600">
              HR notes for manager (optional)
              <textarea
                className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
                rows={2}
                value={stageNotes}
                onChange={(event) => setStageNotes(event.target.value)}
              />
            </label>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <GhostButton type="button" onClick={onClose} disabled={busy}>
            Cancel
          </GhostButton>
          <PrimaryButton
            type="button"
            disabled={busy || loading || managerIds.length === 0}
            onClick={() =>
              onConfirm({ managerIds, stageName, stageNotes })
            }
          >
            {busy
              ? "Saving…"
              : managerIds.length > 1
                ? `Create ${managerIds.length} stages & set status`
                : "Create stage & set status"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function ClientReviewModal({
  application,
  busy,
  onClose,
  onConfirm,
}: {
  application: StaffApplication;
  busy: boolean;
  onClose: () => void;
  onConfirm: (clientIds: number[]) => void;
}) {
  const [clientUsers, setClientUsers] = useState<
    { id: number; first_name: string; last_name: string; email: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [clientIds, setClientIds] = useState<number[]>([]);

  useEffect(() => {
    let ignore = false;
    getJobOpening(application.job_opening)
      .then((opening) => {
        if (!ignore) {
          setClientUsers(opening.client_users ?? []);
        }
      })
      .catch(() => {
        if (!ignore) {
          setClientUsers([]);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [application.job_opening]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-amal-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-lg font-bold">
          Client review — assign client user(s)
        </h3>
        <p className="mt-2 text-sm text-zinc-600">
          Choose which linked client users should review{" "}
          <strong>{application.applicant.name}</strong> on{" "}
          <strong>{application.job_opening_name}</strong>.
        </p>
        {loading ? (
          <p className="mt-4 text-sm text-zinc-500">Loading client users…</p>
        ) : clientUsers.length === 0 ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            This role has no linked client users. Set Requested by (client) on
            the job opening before Client Review.
          </p>
        ) : (
          <div className="mt-4 max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-black/15 p-2">
            {clientUsers.map((user) => {
              const checked = clientIds.includes(user.id);
              const name =
                [user.first_name, user.last_name]
                  .filter(Boolean)
                  .join(" ")
                  .trim() || user.email;
              return (
                <label
                  key={user.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-amal-sheet"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setClientIds((current) =>
                        checked
                          ? current.filter((id) => id !== user.id)
                          : [...current, user.id],
                      )
                    }
                  />
                  {name}
                </label>
              );
            })}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <GhostButton type="button" onClick={onClose} disabled={busy}>
            Cancel
          </GhostButton>
          <PrimaryButton
            type="button"
            disabled={busy || loading || clientIds.length === 0}
            onClick={() => onConfirm(clientIds)}
          >
            {busy ? "Saving…" : "Assign & set status"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
