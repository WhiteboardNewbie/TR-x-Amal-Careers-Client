"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, mediaUrl } from "@/lib/api";
import { persistCareersApplicationsReturn } from "@/lib/careers-return";
import {
  DEFAULT_MANAGE_APPLICATIONS_FILTERS,
  getManageApplicationsPresetState,
  hasActiveManageApplicationFilters,
  manageApplicationsFiltersToApiParams,
  restoreStateToManageApplicationsFilters,
  type ManageApplicationsFilterPresetId,
  type ManageApplicationsFilterState,
  type ManageApplicationsRestoreState,
} from "@/lib/manage-applications-filters";
import {
  addComment,
  getAssignedStages,
  getStaffJobOpenings,
  requestInterview,
  setManagerStageStatus,
} from "@/lib/staff-api";
import {
  labelFor,
  stageStatusBadge,
  STATUS_TONE,
} from "@/lib/status";
import type {
  ApplicationStageHrOverview,
  JobApplicationStatus,
  StaffJobOpening,
} from "@/lib/types";
import { ReviewStageModal } from "@/components/reviews/ReviewStageModal";
import { ManageApplicationsFilterBar } from "./ManageApplicationsFilterBar";
import {
  CalendarIcon,
  ExternalLinkIcon,
  EyeIcon,
  FileSearchIcon,
  ListIcon,
  MessageSquareIcon,
  MoreVerticalIcon,
  XIcon,
} from "./icons";
import {
  AiCell,
  applicationFromStage,
  CompactAssessmentIndicator,
  FirstTestCell,
  formatCompactDateTime,
  formatDate,
  formatDateTime,
  ScoreCell,
  stageName,
  stageStatusLocked,
} from "./stage-row-cells";
import { TableActionsMenu } from "./TableActionsMenu";
import {
  GhostButton,
  Modal,
  PrimaryButton,
  TablePager,
} from "./ui";

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
const iconButtonClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/15 bg-amal-white text-zinc-600 hover:bg-amal-sheet hover:text-amal-ink";

const MANAGER_STAGE_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "requested_interview", label: "Request interview" },
  { value: "rejected", label: "Reject" },
] as const;

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

function AppStatusBadge({
  status,
}: {
  status: string | null | undefined;
}) {
  const value = (status ?? "new") as JobApplicationStatus;
  const tone = STATUS_TONE[value] ?? "bg-slate-100 text-slate-700";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}
    >
      {labelFor(value)}
    </span>
  );
}

export function ManageApplicationsTab({
  onError,
  restoreState,
  onRestoreConsumed,
  mode = "staff",
}: {
  onError: (value: string) => void;
  restoreState?: ManageApplicationsRestoreState | null;
  onRestoreConsumed?: () => void;
  mode?: "staff" | "reviews";
}) {
  const router = useRouter();
  const [page, setPage] = useState(restoreState?.page ?? 1);
  const [pageSize, setPageSize] = useState(restoreState?.pageSize ?? 10);
  const [rows, setRows] = useState<ApplicationStageHrOverview[]>([]);
  const [count, setCount] = useState(0);
  const [filters, setFilters] = useState<ManageApplicationsFilterState>(() => ({
    ...DEFAULT_MANAGE_APPLICATIONS_FILTERS,
    ...restoreStateToManageApplicationsFilters(restoreState ?? {}),
  }));
  const [debouncedSearch, setDebouncedSearch] = useState(filters.searchInput);
  const [jobsForFilters, setJobsForFilters] = useState<StaffJobOpening[]>([]);
  const [stageStatusUpdatingId, setStageStatusUpdatingId] = useState<
    number | null
  >(null);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{
    stage: ApplicationStageHrOverview;
    previousStatus: string;
  } | null>(null);
  const [reviewStage, setReviewStage] =
    useState<ApplicationStageHrOverview | null>(null);
  const [commentTarget, setCommentTarget] = useState<{
    applicationId: number;
    applicantName: string;
  } | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!restoreState) {
      return;
    }
    onRestoreConsumed?.();
  }, [restoreState, onRestoreConsumed]);

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
    getAssignedStages({ ...listFilters, page, page_size: pageSize })
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
  }, [listFilters, page, pageSize, tick, onError]);

  function persistReturn() {
    persistCareersApplicationsReturn({
      tab: "manage",
      filters,
      page,
      pageSize,
    });
  }

  async function changeStageStatus(
    stage: ApplicationStageHrOverview,
    status: string,
  ) {
    if (status === stage.status) {
      return;
    }
    if (status === "rejected") {
      setRejectTarget({ stage, previousStatus: stage.status });
      return;
    }
    setStageStatusUpdatingId(stage.id);
    try {
      await setManagerStageStatus(stage.id, status);
      setTick((value) => value + 1);
    } catch (error) {
      onError(errorText(error));
    } finally {
      setStageStatusUpdatingId(null);
    }
  }

  async function confirmReject() {
    if (!rejectTarget) {
      return;
    }
    setStageStatusUpdatingId(rejectTarget.stage.id);
    try {
      await setManagerStageStatus(rejectTarget.stage.id, "rejected");
      setRejectTarget(null);
      setTick((value) => value + 1);
    } catch (error) {
      onError(errorText(error));
    } finally {
      setStageStatusUpdatingId(null);
    }
  }

  async function handleRequestInterview(stage: ApplicationStageHrOverview) {
    setStageStatusUpdatingId(stage.id);
    try {
      await requestInterview(stage.id);
      setTick((value) => value + 1);
    } catch (error) {
      onError(errorText(error));
    } finally {
      setStageStatusUpdatingId(null);
    }
  }

  async function submitComment() {
    if (!commentTarget || !commentText.trim()) {
      return;
    }
    setCommentBusy(true);
    try {
      await addComment(commentTarget.applicationId, commentText.trim());
      setCommentTarget(null);
      setCommentText("");
    } catch (error) {
      onError(errorText(error));
    } finally {
      setCommentBusy(false);
    }
  }

  const emptyCopy = hasActive
    ? "No rows match your filters."
    : "No applications assigned to you yet.";
  const menuStage = rows.find((stage) => stage.id === menuOpenId) ?? null;
  const menuAppId = menuStage
    ? (applicationFromStage(menuStage)?.id ?? menuStage.job_application)
    : 0;
  const linkResults = mode === "staff";
  const applicationHref = (appId: number, stageId?: number) =>
    mode === "reviews"
      ? `/reviews/${appId}${stageId != null ? `?stage=${stageId}` : ""}`
      : `/staff/applications/${appId}`;

  return (
    <>
      <section className="overflow-anchor-none mt-6 space-y-4 rounded-2xl border border-black/10 bg-amal-white p-5 shadow-sm">
        <div className="flex items-start gap-2 pb-1">
          <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amal-sheet text-zinc-600">
            <FileSearchIcon className="h-3.5 w-3.5" />
          </span>
          <div>
            <h2 className="text-base font-bold">Filters</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Search and narrow stages assigned to you.
            </p>
          </div>
        </div>
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
      </section>

      <section className="mt-6 space-y-5 rounded-2xl border border-black/10 bg-amal-white p-5 shadow-sm">
        <div className="flex items-start gap-2 pb-1">
          <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amal-sheet text-zinc-600">
            <ListIcon className="h-3.5 w-3.5" />
          </span>
          <div>
            <h3 className="text-base font-bold">Manage Applications</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Stages assigned to you — open a row for the full application view.
            </p>
          </div>
        </div>

        {count === 0 ? (
          <p className="text-sm text-zinc-500">{emptyCopy}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-zinc-500">No rows match your filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-center text-sm">
              <thead>
                <tr className="border-b border-black/10">
                  <th className="w-[10%] px-2 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Applicant
                  </th>
                  <th className="w-[10%] px-2 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Job
                  </th>
                  <th className="w-[8%] px-2 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Stage
                  </th>
                  <th className="w-[8%] px-2 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Stage status
                  </th>
                  <th className="w-[8%] px-2 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    App status
                  </th>
                  <th className="w-[5%] px-2 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Resume
                  </th>
                  <th className="w-[6%] px-2 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Applied
                  </th>
                  <th className="w-[7%] px-2 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    First test
                  </th>
                  <th
                    className="w-[4%] px-1 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500"
                    title="Video test"
                  >
                    Video
                  </th>
                  <th
                    className="w-[4%] px-1 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500"
                    title="General questionnaire"
                  >
                    Quest.
                  </th>
                  <th className="w-[6%] px-2 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    AI resume
                  </th>
                  <th className="w-[6%] px-2 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Score
                  </th>
                  <th className="w-[8%] px-2 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Interview
                  </th>
                  <th className="w-[6%] px-2 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Completed
                  </th>
                  <th className="w-[4%] px-2 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((stage) => {
                  const application = applicationFromStage(stage);
                  const appId = application?.id ?? stage.job_application;
                  const applicantName =
                    stage.applicant_name ??
                    application?.applicant.name ??
                    "Applicant";
                  const resumeHref = mediaUrl(application?.resume);
                  const locked = stageStatusLocked(stage.status);
                  const badge = stageStatusBadge(stage.status);
                  const selectValue =
                    rejectTarget?.stage.id === stage.id
                      ? rejectTarget.previousStatus
                      : stage.status;
                  return (
                    <tr
                      key={stage.id}
                      className="border-b border-black/5 hover:bg-amal-sheet/80"
                    >
                      <td className="max-w-0 truncate px-2 py-2.5 font-medium text-amal-ink" title={applicantName}>
                        {applicantName}
                      </td>
                      <td
                        className="max-w-0 truncate px-2 py-2.5 text-zinc-600"
                        title={
                          stage.job_title ??
                          application?.job_opening_name ??
                          undefined
                        }
                      >
                        {stage.job_title ??
                          application?.job_opening_name ??
                          "—"}
                      </td>
                      <td className="max-w-0 truncate px-2 py-2.5 text-zinc-600">
                        {stageName(stage)}
                      </td>
                      <td
                        className="px-2 py-2.5"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {locked ? (
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        ) : (
                          <select
                            value={selectValue}
                            disabled={stageStatusUpdatingId === stage.id}
                            onChange={(event) =>
                              void changeStageStatus(stage, event.target.value)
                            }
                            aria-label={`Stage status for ${applicantName}`}
                            className={`h-7 max-w-[7.5rem] cursor-pointer rounded-full border-0 px-2 text-xs font-semibold leading-none ${badge.className} disabled:opacity-60`}
                          >
                            {MANAGER_STAGE_STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-2 py-2.5">
                        <AppStatusBadge
                          status={
                            application?.status ?? stage.application_status
                          }
                        />
                      </td>
                      <td
                        className="px-2 py-2.5"
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
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2.5 text-xs text-zinc-600">
                        {formatDate(application?.applied_at)}
                      </td>
                      <td
                        className="px-2 py-2.5"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <FirstTestCell
                          application={application}
                          appId={appId}
                          onPersistReturn={persistReturn}
                          linkResults={linkResults}
                        />
                      </td>
                      <td
                        className="px-1 py-2.5"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <CompactAssessmentIndicator
                          session={application?.video_test_session}
                          completedHref={
                            linkResults
                              ? `/staff/applications/${appId}/results/video`
                              : undefined
                          }
                          onPersistReturn={persistReturn}
                          label="Video test"
                        />
                      </td>
                      <td
                        className="px-1 py-2.5"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <CompactAssessmentIndicator
                          session={application?.general_questionnaire_session}
                          completedHref={
                            linkResults
                              ? `/staff/applications/${appId}/results/questionnaire`
                              : undefined
                          }
                          onPersistReturn={persistReturn}
                          label="General questionnaire"
                        />
                      </td>
                      <td
                        className="px-2 py-2.5 text-center"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <AiCell application={application} compact />
                      </td>
                      <td className="px-2 py-2.5 tabular-nums text-zinc-700">
                        <ScoreCell application={application} />
                      </td>
                      <td
                        className="whitespace-nowrap px-2 py-2.5 text-xs text-zinc-600"
                        title={formatDateTime(stage.scheduled_at)}
                      >
                        {formatCompactDateTime(stage.scheduled_at)}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2.5 text-xs text-zinc-600">
                        {formatDate(stage.completed_at)}
                      </td>
                      <td
                        className="relative px-2 py-2.5"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={applicationHref(appId, stage.id)}
                            className={iconButtonClass}
                            title="Open application"
                            aria-label={`Open application for ${applicantName}`}
                            onClick={persistReturn}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            data-manage-action-menu-trigger={stage.id}
                            className={iconButtonClass}
                            title="More actions"
                            aria-label={`Open actions menu for ${applicantName}`}
                            aria-expanded={menuOpenId === stage.id}
                            onClick={() =>
                              setMenuOpenId((current) =>
                                current === stage.id ? null : stage.id,
                              )
                            }
                          >
                            <MoreVerticalIcon className="h-4 w-4" />
                          </button>
                        </div>
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
      </section>

      <TableActionsMenu
        open={menuOpenId !== null}
        triggerSelector={
          menuOpenId != null
            ? `[data-manage-action-menu-trigger="${menuOpenId}"]`
            : null
        }
        onClose={() => setMenuOpenId(null)}
        width={200}
      >
        {menuStage ? (
          <>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-amal-sheet"
              onClick={() => {
                setMenuOpenId(null);
                setReviewStage(menuStage);
              }}
            >
              <ListIcon className="h-3.5 w-3.5" />
              Review stage
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-amal-sheet"
              onClick={() => {
                setMenuOpenId(null);
                setCommentText("");
                setCommentTarget({
                  applicationId: menuAppId,
                  applicantName:
                    menuStage.applicant_name ??
                    applicationFromStage(menuStage)?.applicant.name ??
                    "Applicant",
                });
              }}
            >
              <MessageSquareIcon className="h-3.5 w-3.5" />
              Add comment
            </button>
            {menuStage.status === "pending" ? (
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-amal-sheet"
                onClick={() => {
                  setMenuOpenId(null);
                  void handleRequestInterview(menuStage);
                }}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                Request interview
              </button>
            ) : null}
            {menuStage.status === "pending" ||
            menuStage.status === "requested_interview" ? (
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-amal-red hover:bg-amal-red/10"
                onClick={() => {
                  setMenuOpenId(null);
                  setRejectTarget({
                    stage: menuStage,
                    previousStatus: menuStage.status,
                  });
                }}
              >
                <XIcon className="h-3.5 w-3.5" />
                Reject candidate
              </button>
            ) : null}
          </>
        ) : null}
      </TableActionsMenu>

      {rejectTarget ? (
        <Modal
          compact
          title="Reject candidate?"
          onClose={() => setRejectTarget(null)}
        >
          <p className="mt-2 text-sm text-zinc-600">
            Mark this stage as rejected? The applicant will not be emailed.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <GhostButton onClick={() => setRejectTarget(null)}>
              Cancel
            </GhostButton>
            <button
              type="button"
              onClick={() => void confirmReject()}
              disabled={stageStatusUpdatingId === rejectTarget.stage.id}
              className="rounded-lg bg-amal-red px-4 py-2 text-sm font-semibold text-amal-white hover:bg-amal-red/90 disabled:opacity-50"
            >
              Reject candidate
            </button>
          </div>
        </Modal>
      ) : null}

      {commentTarget ? (
        <Modal
          compact
          title="Add comment"
          onClose={() => {
            setCommentTarget(null);
            setCommentText("");
          }}
        >
          <p className="mt-2 text-sm text-zinc-600">
            Comment on {commentTarget.applicantName}&apos;s application.
          </p>
          <textarea
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            rows={4}
            className="mt-4 w-full rounded-lg border border-black/15 bg-amal-sheet px-3 py-2 text-sm outline-none focus:border-amal-red focus:ring-2 focus:ring-amal-red/20"
            placeholder="Write a comment"
          />
          <div className="mt-6 flex justify-end gap-3">
            <GhostButton
              onClick={() => {
                setCommentTarget(null);
                setCommentText("");
              }}
            >
              Cancel
            </GhostButton>
            <PrimaryButton
              disabled={commentBusy || !commentText.trim()}
              onClick={() => void submitComment()}
            >
              Save comment
            </PrimaryButton>
          </div>
        </Modal>
      ) : null}

      {reviewStage ? (
        <ReviewStageModal
          key={reviewStage.id}
          stage={reviewStage}
          onClose={() => setReviewStage(null)}
          onStageUpdated={() => {
            setTick((value) => value + 1);
          }}
          onOpenApplication={() => {
            const appId =
              applicationFromStage(reviewStage)?.id ??
              reviewStage.job_application;
            persistReturn();
            setReviewStage(null);
            router.push(applicationHref(appId, reviewStage.id));
          }}
        />
      ) : null}
    </>
  );
}
