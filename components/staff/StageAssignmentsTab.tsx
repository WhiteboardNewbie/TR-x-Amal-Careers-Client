"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, getJobOpening, mediaUrl } from "@/lib/api";
import { persistCareersApplicationsReturn } from "@/lib/careers-return";
import {
  clientReviewFiltersToApiParams,
  DEFAULT_STAGE_ASSIGNMENTS_FILTERS,
  getStageAssignmentsPresetState,
  hasActiveStageAssignmentFilters,
  restoreStateToStageAssignmentsFilters,
  stageAssignmentsFiltersToApiParams,
  type StageAssignmentsFilterPresetId,
  type StageAssignmentsFilterState,
  type StageAssignmentsRestoreState,
} from "@/lib/stage-assignments-filters";
import {
  createStage,
  getClientApplicationReviews,
  getDepartmentManagers,
  getHrStages,
  getStaffJobOpenings,
  reassignStage,
  rescindStage,
  scheduleStage,
  setHrStageStatus,
  updateApplicationStatus,
} from "@/lib/staff-api";
import {
  APPLICATION_STATUSES,
  labelFor,
  stageStatusBadge,
  STATUS_TONE,
} from "@/lib/status";
import type {
  ApplicationStageHrOverview,
  ClientApplicationReviewHr,
  DepartmentManager,
  JobApplicationStatus,
  StaffApplication,
  StaffJobOpening,
} from "@/lib/types";
import {
  ClientReviewModal,
  ManagerReviewModal,
} from "./ApplicationsTab";
import type { FilterOption } from "./JobApplicationsFilterBar";
import { StageAssignmentsFilterBar } from "./StageAssignmentsFilterBar";
import {
  ASSESSMENT_BADGE_BASE,
  firstTestScoreBadgeClass,
  formatAssessmentStatusLabel,
  getAssessmentEffectiveStatus,
} from "./assessment-status";
import {
  CalendarIcon,
  CheckIcon,
  ExternalLinkIcon,
  EyeIcon,
  FileSearchIcon,
  FileTextIcon,
  ListIcon,
  MoreVerticalIcon,
  UserPlusIcon,
  VideoIcon,
  XIcon,
} from "./icons";
import { TableActionsMenu } from "./TableActionsMenu";
import {
  CenteredOverlay,
  GhostButton,
  Modal,
  PrimaryButton,
  TablePager,
} from "./ui";

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
const iconButtonClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/15 bg-amal-white text-zinc-600 hover:bg-amal-sheet hover:text-amal-ink";

const HR_STAGE_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "requested_interview", label: "Request interview" },
  { value: "rejected", label: "Reject" },
] as const;

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDateTimeLocalInput(iso?: string | null): string {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function dateTimeLocalToIso(value?: string | null): string | null {
  if (!value?.trim()) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function stageStatusLocked(status: string): boolean {
  return (
    status === "interview" || status === "completed" || status === "rejected"
  );
}

function canReassign(status: string): boolean {
  return status === "pending" || status === "requested_interview";
}

function canRescind(status: string): boolean {
  return status === "pending";
}

function assignedName(
  assigned: ApplicationStageHrOverview["assigned_to"],
): string {
  return assigned?.full_name?.trim() || "—";
}

function clientUserColumnLabel(
  display: ClientApplicationReviewHr["client_user_display"],
): string {
  if (!display) {
    return "—";
  }
  const name = display.display_name.trim();
  const shown = name.includes("@") ? "" : name;
  if (shown && display.client_name) {
    return `${shown} (${display.client_name})`;
  }
  if (shown) {
    return shown;
  }
  if (display.client_name) {
    return display.client_name;
  }
  return "—";
}

function stageName(stage: ApplicationStageHrOverview): string {
  if (stage.name?.trim()) {
    return stage.name;
  }
  return stage.order ? `Stage ${stage.order}` : "Review";
}

function applicationFromStage(
  stage: ApplicationStageHrOverview,
): StaffApplication | null {
  if (stage.application) {
    return stage.application;
  }
  if (!stage.job_application) {
    return null;
  }
  return {
    id: stage.job_application,
    job_opening: stage.job_opening_slug ?? "",
    job_opening_name: stage.job_title ?? "",
    applicant: {
      id: 0,
      name: stage.applicant_name ?? "Applicant",
      email: "",
      city: "",
      contact: "",
      notes: "",
    },
    resume: "",
    status: (stage.application_status ?? "new") as JobApplicationStatus,
    applied_at: "",
  };
}

function CompactAssessmentIndicator({
  session,
  completedHref,
  onPersistReturn,
  label,
}: {
  session: StaffApplication["test_session"];
  completedHref?: string;
  onPersistReturn: () => void;
  label: string;
}) {
  const status = getAssessmentEffectiveStatus(session);
  if (!session) {
    return <span className="text-zinc-300">—</span>;
  }
  if (status === "completed" && completedHref) {
    return (
      <Link
        href={completedHref}
        onClick={onPersistReturn}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
        title={`${label} completed`}
      >
        <CheckIcon className="h-3.5 w-3.5" />
        <span className="sr-only">{label} completed</span>
      </Link>
    );
  }
  if (status === "in_progress") {
    return (
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-amber-200 bg-amber-50"
        title={`${label}: in progress`}
      >
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
        <span className="sr-only">{label}: in progress</span>
      </span>
    );
  }
  return (
    <span
      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-black/10 bg-amal-sheet"
      title={`${label}: ${status ?? "pending"}`}
    >
      <span className="h-2 w-2 rounded-full bg-zinc-300" />
      <span className="sr-only">
        {label}: {status ?? "pending"}
      </span>
    </span>
  );
}

function FirstTestCell({
  application,
  appId,
  onPersistReturn,
}: {
  application: StaffApplication | null;
  appId: number;
  onPersistReturn: () => void;
}) {
  const session = application?.test_session;
  const status = getAssessmentEffectiveStatus(session);
  const firstScore = Number(session?.score_percentage ?? Number.NaN);
  if (!session) {
    return (
      <span className="rounded-full bg-amal-sheet px-2.5 py-1 text-xs text-zinc-500">
        No Test
      </span>
    );
  }
  if (status === "completed") {
    return (
      <Link
        href={`/staff/applications/${appId}/results/first-test`}
        onClick={onPersistReturn}
        className={`${ASSESSMENT_BADGE_BASE} ${
          Number.isNaN(firstScore)
            ? "border-black/10 bg-amal-sheet text-zinc-700"
            : firstTestScoreBadgeClass(firstScore)
        }`}
      >
        <FileSearchIcon className="h-3.5 w-3.5" />
        {Number.isNaN(firstScore) ? "View" : `${firstScore.toFixed(0)}%`}
      </Link>
    );
  }
  return (
    <span className="rounded-full bg-amal-sheet px-2.5 py-1 text-xs text-zinc-500">
      {formatAssessmentStatusLabel(status) || session.status}
    </span>
  );
}

function AiCell({ application }: { application: StaffApplication | null }) {
  if (!application) {
    return <span className="text-zinc-400">—</span>;
  }
  return (
    <div className="inline-flex items-center justify-center gap-1.5">
      {application.ai_relevance_score == null ? (
        <span className="inline-flex items-center gap-1 text-zinc-400">
          <FileTextIcon className="h-3 w-3" />—
        </span>
      ) : (
        <span
          className={`${ASSESSMENT_BADGE_BASE} ${firstTestScoreBadgeClass(application.ai_relevance_score)}`}
        >
          <FileTextIcon className="h-3 w-3" />
          {application.ai_relevance_score}%
        </span>
      )}
      <span className="text-xs text-zinc-300">/</span>
      <span className="inline-flex items-center gap-1 text-zinc-400">
        <VideoIcon className="h-3 w-3" />—
      </span>
    </div>
  );
}

function ScoreCell({ application }: { application: StaffApplication | null }) {
  const score = application?.manager_score_avg;
  if (score == null || String(score).trim() === "") {
    return <span className="text-zinc-400">—</span>;
  }
  return (
    <span
      className={`${ASSESSMENT_BADGE_BASE} border-transparent bg-amal-sheet text-zinc-800`}
    >
      {Number(score).toFixed(2)} / 10
    </span>
  );
}

function ReviewStatusBadge({ status }: { status: string }) {
  const tone =
    status === "approved"
      ? "bg-emerald-100 text-emerald-800"
      : status === "rejected"
        ? "bg-amal-red/15 text-amal-red"
        : "bg-amal-blue/15 text-amal-blue";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}
    >
      {labelFor(status)}
    </span>
  );
}

function AppStatusSelect({
  application,
  fallbackStatus,
  draft,
  updating,
  onDraftFocus,
  onDraftBlur,
  onChange,
}: {
  application: StaffApplication | null;
  fallbackStatus: string | null | undefined;
  draft: string | undefined;
  updating: boolean;
  onDraftFocus: (id: number) => void;
  onDraftBlur: (id: number) => void;
  onChange: (row: StaffApplication, next: JobApplicationStatus) => void;
}) {
  if (!application) {
    return <span className="text-zinc-400">—</span>;
  }
  const appStatus = (application.status ??
    fallbackStatus ??
    "new") as JobApplicationStatus;
  const tone = STATUS_TONE[appStatus] ?? "bg-slate-100 text-slate-700";
  return (
    <select
      value={draft ?? appStatus}
      disabled={updating}
      onFocus={() => {
        if (appStatus === "manager-review" || appStatus === "client-review") {
          onDraftFocus(application.id);
        }
      }}
      onBlur={() => onDraftBlur(application.id)}
      onChange={(event) => {
        onDraftBlur(application.id);
        onChange(application, event.target.value as JobApplicationStatus);
      }}
      className={`h-7 cursor-pointer rounded-full border-0 px-2 text-xs font-semibold leading-none ${tone} disabled:opacity-60`}
    >
      {draft === "" ? (
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
  );
}

export function StageAssignmentsTab({
  onError,
  onScheduled,
  refreshTick = 0,
  restoreState,
  onRestoreConsumed,
}: {
  onError: (value: string) => void;
  onScheduled?: () => void;
  refreshTick?: number;
  restoreState?: StageAssignmentsRestoreState | null;
  onRestoreConsumed?: () => void;
}) {
  const [rows, setRows] = useState<ApplicationStageHrOverview[]>([]);
  const [clientRows, setClientRows] = useState<ClientApplicationReviewHr[]>([]);
  const [reviewerTab, setReviewerTab] = useState<"managers" | "clients">(
    restoreState?.reviewerTab ?? "managers",
  );
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(restoreState?.page ?? 1);
  const [pageSize, setPageSize] = useState(restoreState?.pageSize ?? 10);
  const [filters, setFilters] = useState<StageAssignmentsFilterState>(() => ({
    ...DEFAULT_STAGE_ASSIGNMENTS_FILTERS,
    ...restoreStateToStageAssignmentsFilters(restoreState ?? {}),
  }));
  const [debouncedSearch, setDebouncedSearch] = useState(filters.searchInput);
  const [jobsForFilters, setJobsForFilters] = useState<StaffJobOpening[]>([]);
  const [reviewerOptions, setReviewerOptions] = useState<FilterOption[]>([]);
  const [stageStatusUpdatingId, setStageStatusUpdatingId] = useState<
    number | null
  >(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [statusDraftById, setStatusDraftById] = useState<Record<number, string>>(
    {},
  );
  const [appRejectTarget, setAppRejectTarget] =
    useState<StaffApplication | null>(null);
  const [managerReview, setManagerReview] = useState<StaffApplication | null>(
    null,
  );
  const [clientReview, setClientReview] = useState<StaffApplication | null>(
    null,
  );
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] =
    useState<ApplicationStageHrOverview | null>(null);
  const [rescindTarget, setRescindTarget] =
    useState<ApplicationStageHrOverview | null>(null);
  const [rescindBusy, setRescindBusy] = useState(false);
  const [reassignTarget, setReassignTarget] =
    useState<ApplicationStageHrOverview | null>(null);
  const [reassignManagers, setReassignManagers] = useState<DepartmentManager[]>(
    [],
  );
  const [reassignManagerId, setReassignManagerId] = useState("");
  const [reassignLoading, setReassignLoading] = useState(false);
  const [reassignBusy, setReassignBusy] = useState(false);
  const [scheduleTarget, setScheduleTarget] =
    useState<ApplicationStageHrOverview | null>(null);
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
    (patch: Partial<StageAssignmentsFilterState>) => {
      setFilters((current) => ({ ...current, ...patch }));
      setPage(1);
    },
    [],
  );

  const listFilters = useMemo(
    () => stageAssignmentsFiltersToApiParams(debouncedSearch, filters),
    [debouncedSearch, filters],
  );
  const clientFilters = useMemo(
    () => clientReviewFiltersToApiParams(debouncedSearch, filters),
    [debouncedSearch, filters],
  );

  const reviewerDeptIds = useMemo(() => {
    if (filters.jobFilter === "all") {
      return [
        ...new Set(
          jobsForFilters
            .map((job) => job.department)
            .filter((id): id is number => typeof id === "number"),
        ),
      ];
    }
    const job = jobsForFilters.find((item) => item.slug === filters.jobFilter);
    return job?.department != null ? [job.department] : [];
  }, [filters.jobFilter, jobsForFilters]);

  useEffect(() => {
    if (reviewerDeptIds.length === 0) {
      return;
    }
    let ignore = false;
    void Promise.all(reviewerDeptIds.map((id) => getDepartmentManagers(id)))
      .then((results) => {
        if (ignore) {
          return;
        }
        const byId = new Map<string, FilterOption>();
        for (const managers of results) {
          for (const manager of managers) {
            byId.set(String(manager.id), {
              value: String(manager.id),
              label: manager.full_name,
            });
          }
        }
        setReviewerOptions(
          [...byId.values()].sort((a, b) => a.label.localeCompare(b.label)),
        );
      })
      .catch(() => {
        if (!ignore) {
          setReviewerOptions([]);
        }
      });
    return () => {
      ignore = true;
    };
  }, [reviewerDeptIds]);

  useEffect(() => {
    let ignore = false;
    const request =
      reviewerTab === "clients"
        ? getClientApplicationReviews({
            page,
            page_size: pageSize,
            ...clientFilters,
          }).then((data) => {
            if (!ignore) {
              setClientRows(data.results);
              setRows([]);
              setTotalCount(data.count);
            }
          })
        : getHrStages({
            page,
            page_size: pageSize,
            ...listFilters,
          }).then((data) => {
            if (!ignore) {
              setRows(data.results);
              setClientRows([]);
              setTotalCount(data.count);
            }
          });
    request.catch((error) => {
      if (!ignore) {
        onError(errorText(error));
      }
    });
    return () => {
      ignore = true;
    };
  }, [
    reviewerTab,
    page,
    pageSize,
    listFilters,
    clientFilters,
    tick,
    refreshTick,
    onError,
  ]);

  const hasActive = hasActiveStageAssignmentFilters(debouncedSearch, filters);

  function persistReturn() {
    persistCareersApplicationsReturn({
      tab: "stages",
      filters,
      page,
      pageSize,
      reviewerTab,
    });
  }

  function clearStatusDraft(id: number) {
    setStatusDraftById((current) => {
      if (!(id in current)) {
        return current;
      }
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  async function applyApplicationStatus(
    row: StaffApplication,
    next: JobApplicationStatus,
  ) {
    if (next === row.status) {
      return;
    }
    if (next === "rejected") {
      setAppRejectTarget(row);
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

  async function confirmAppReject() {
    if (!appRejectTarget) {
      return;
    }
    const row = appRejectTarget;
    setStatusUpdatingId(row.id);
    try {
      await updateApplicationStatus(row.id, "rejected");
      setAppRejectTarget(null);
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

  async function changeStageStatus(
    stage: ApplicationStageHrOverview,
    status: string,
  ) {
    if (status === stage.status) {
      return;
    }
    if (status === "rejected") {
      setRejectTarget(stage);
      return;
    }
    setStageStatusUpdatingId(stage.id);
    try {
      await setHrStageStatus(stage.id, status);
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
    setStageStatusUpdatingId(rejectTarget.id);
    try {
      await setHrStageStatus(rejectTarget.id, "rejected");
      setRejectTarget(null);
      setTick((value) => value + 1);
    } catch (error) {
      onError(errorText(error));
    } finally {
      setStageStatusUpdatingId(null);
    }
  }

  async function openReassign(stage: ApplicationStageHrOverview) {
    setReassignTarget(stage);
    setReassignManagerId("");
    setReassignLoading(true);
    try {
      const slug =
        stage.job_opening_slug || stage.application?.job_opening || "";
      if (!slug) {
        setReassignManagers([]);
        return;
      }
      const opening = await getJobOpening(slug);
      const managers = await getDepartmentManagers(opening.department);
      setReassignManagers(managers);
    } catch (error) {
      onError(errorText(error));
      setReassignManagers([]);
    } finally {
      setReassignLoading(false);
    }
  }

  async function confirmReassign() {
    if (!reassignTarget || !reassignManagerId) {
      return;
    }
    setReassignBusy(true);
    try {
      await reassignStage(reassignTarget.id, Number(reassignManagerId));
      setReassignTarget(null);
      setTick((value) => value + 1);
    } catch (error) {
      onError(errorText(error));
    } finally {
      setReassignBusy(false);
    }
  }

  async function confirmRescind() {
    if (!rescindTarget) {
      return;
    }
    setRescindBusy(true);
    try {
      await rescindStage(rescindTarget.id);
      setRescindTarget(null);
      setTick((value) => value + 1);
    } catch (error) {
      onError(errorText(error));
    } finally {
      setRescindBusy(false);
    }
  }

  const managersEmptyCopy = hasActive
    ? "No rows match your filters."
    : "No stage assignments yet.";
  const clientsEmptyCopy = hasActive
    ? "No rows match your filters."
    : "No client review assignments yet.";

  const menuStage = rows.find((stage) => stage.id === menuOpenId) ?? null;

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
              Search and narrow stage assignments across managers.
            </p>
          </div>
        </div>
        <StageAssignmentsFilterBar
          filters={filters}
          debouncedSearch={debouncedSearch}
          totalCount={totalCount}
          jobsForFilters={jobsForFilters}
          reviewerOptions={reviewerDeptIds.length === 0 ? [] : reviewerOptions}
          reviewerLoading={false}
          onChange={patchFilters}
          onClearAll={() => {
            setFilters(DEFAULT_STAGE_ASSIGNMENTS_FILTERS);
            setDebouncedSearch("");
            setPage(1);
          }}
          onApplyPreset={(id: StageAssignmentsFilterPresetId) => {
            setFilters(getStageAssignmentsPresetState(id));
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
            <h3 className="text-base font-bold">Stage Assignments</h3>
            <p className="mt-1 text-xs text-zinc-500">
              {reviewerTab === "clients"
                ? "Client review assignments — one row per linked client reviewer."
                : "Pipeline stages assigned to managers — open a row for the full application view."}
            </p>
          </div>
        </div>

        <div
          className="inline-flex rounded-full border border-black/10 bg-amal-sheet p-1"
          role="tablist"
          aria-label="Reviewer type"
        >
          {(
            [
              { id: "managers" as const, label: "Managers" },
              { id: "clients" as const, label: "Clients" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={reviewerTab === item.id}
              onClick={() => {
                setReviewerTab(item.id);
                setPage(1);
                setMenuOpenId(null);
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                reviewerTab === item.id
                  ? "bg-amal-red text-amal-white shadow-sm"
                  : "bg-transparent text-zinc-600 hover:text-amal-ink"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {reviewerTab === "managers" ? (
          <div className="space-y-4">
            {totalCount === 0 ? (
              <p className="text-sm text-zinc-500">{managersEmptyCopy}</p>
            ) : rows.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No rows match your filters.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-center text-sm">
                  <thead>
                    <tr className="border-b border-black/10">
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Applicant
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Job
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Assigned to
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Stage
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Stage status
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        App status
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Resume
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Applied
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        First test
                      </th>
                      <th
                        className="w-12 px-2 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500"
                        title="Video test"
                      >
                        Video
                      </th>
                      <th
                        className="w-12 px-2 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500"
                        title="General questionnaire"
                      >
                        Quest.
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        AI
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Score
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Interview
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Completed
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
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
                      return (
                        <tr
                          key={stage.id}
                          className="border-b border-black/5 hover:bg-amal-sheet/80"
                        >
                          <td className="px-3 py-3 font-medium text-amal-ink">
                            {applicantName}
                          </td>
                          <td className="px-3 py-3 text-zinc-600">
                            {stage.job_title ??
                              application?.job_opening_name ??
                              "—"}
                          </td>
                          <td className="px-3 py-3 text-zinc-600">
                            {assignedName(stage.assigned_to)}
                          </td>
                          <td className="px-3 py-3 text-zinc-600">
                            {stageName(stage)}
                          </td>
                          <td
                            className="px-3 py-3"
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
                                value={stage.status}
                                disabled={stageStatusUpdatingId === stage.id}
                                onChange={(event) =>
                                  void changeStageStatus(
                                    stage,
                                    event.target.value,
                                  )
                                }
                                aria-label={`Stage status for ${applicantName}`}
                                className={`h-7 cursor-pointer rounded-full border-0 px-2 text-xs font-semibold leading-none ${badge.className} disabled:opacity-60`}
                              >
                                {HR_STAGE_STATUS_OPTIONS.map((option) => (
                                  <option
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td
                            className="px-3 py-3"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <AppStatusSelect
                              application={application}
                              fallbackStatus={stage.application_status}
                              draft={
                                application
                                  ? statusDraftById[application.id]
                                  : undefined
                              }
                              updating={
                                application != null &&
                                statusUpdatingId === application.id
                              }
                              onDraftFocus={(id) =>
                                setStatusDraftById((current) => ({
                                  ...current,
                                  [id]: "",
                                }))
                              }
                              onDraftBlur={clearStatusDraft}
                              onChange={(row, next) =>
                                void applyApplicationStatus(row, next)
                              }
                            />
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
                              <span className="text-zinc-400">—</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-zinc-600">
                            {formatDate(application?.applied_at)}
                          </td>
                          <td
                            className="px-3 py-3"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <FirstTestCell
                              application={application}
                              appId={appId}
                              onPersistReturn={persistReturn}
                            />
                          </td>
                          <td
                            className="w-12 px-2 py-3"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <CompactAssessmentIndicator
                              session={application?.video_test_session}
                              completedHref={`/staff/applications/${appId}/results/video`}
                              onPersistReturn={persistReturn}
                              label="Video test"
                            />
                          </td>
                          <td
                            className="w-12 px-2 py-3"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <CompactAssessmentIndicator
                              session={application?.general_questionnaire_session}
                              completedHref={`/staff/applications/${appId}/results/questionnaire`}
                              onPersistReturn={persistReturn}
                              label="General questionnaire"
                            />
                          </td>
                          <td
                            className="px-3 py-3 text-center"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <AiCell application={application} />
                          </td>
                          <td className="px-3 py-3 tabular-nums text-zinc-700">
                            <ScoreCell application={application} />
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-zinc-600">
                            {formatDateTime(stage.scheduled_at)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-zinc-600">
                            {formatDate(stage.completed_at)}
                          </td>
                          <td
                            className="relative px-3 py-3"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              <Link
                                href={`/staff/applications/${appId}`}
                                className={iconButtonClass}
                                title="Open unified application view"
                                aria-label={`Open unified application view for ${applicantName}`}
                                onClick={persistReturn}
                              >
                                <EyeIcon className="h-4 w-4" />
                              </Link>
                              <button
                                type="button"
                                data-stage-action-menu-trigger={stage.id}
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
              count={totalCount}
              onPage={setPage}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {totalCount === 0 ? (
              <p className="text-sm text-zinc-500">{clientsEmptyCopy}</p>
            ) : clientRows.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No rows match your filters.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-center text-sm">
                  <thead>
                    <tr className="border-b border-black/10">
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Applicant
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Role
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Client user
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Review status
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        App status
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Resume
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Applied
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        First test
                      </th>
                      <th
                        className="w-12 px-2 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500"
                        title="Video test"
                      >
                        Video
                      </th>
                      <th
                        className="w-12 px-2 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500"
                        title="General questionnaire"
                      >
                        Quest.
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        AI
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Score
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Decided at
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientRows.map((review) => {
                      const application = review.application;
                      const appId = application?.id ?? review.job_application;
                      const applicantName =
                        review.applicant_name ??
                        application?.applicant.name ??
                        "Applicant";
                      const resumeHref = mediaUrl(application?.resume);
                      const clientLabel = clientUserColumnLabel(
                        review.client_user_display,
                      );
                      return (
                        <tr
                          key={review.id}
                          className="border-b border-black/5 hover:bg-amal-sheet/80"
                        >
                          <td className="px-3 py-3 font-medium text-amal-ink">
                            {applicantName}
                          </td>
                          <td className="px-3 py-3 text-zinc-700">
                            {review.job_title ??
                              application?.job_opening_name ??
                              "—"}
                          </td>
                          <td className="px-3 py-3 text-zinc-700">
                            {clientLabel}
                          </td>
                          <td className="px-3 py-3">
                            <ReviewStatusBadge status={review.status} />
                          </td>
                          <td
                            className="px-3 py-3"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <AppStatusSelect
                              application={application}
                              fallbackStatus={review.application_status}
                              draft={
                                application
                                  ? statusDraftById[application.id]
                                  : undefined
                              }
                              updating={
                                application != null &&
                                statusUpdatingId === application.id
                              }
                              onDraftFocus={(id) =>
                                setStatusDraftById((current) => ({
                                  ...current,
                                  [id]: "",
                                }))
                              }
                              onDraftBlur={clearStatusDraft}
                              onChange={(row, next) =>
                                void applyApplicationStatus(row, next)
                              }
                            />
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
                              <span className="text-zinc-400">—</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-zinc-600">
                            {formatDate(application?.applied_at)}
                          </td>
                          <td
                            className="px-3 py-3"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <FirstTestCell
                              application={application}
                              appId={appId}
                              onPersistReturn={persistReturn}
                            />
                          </td>
                          <td
                            className="w-12 px-2 py-3"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <CompactAssessmentIndicator
                              session={application?.video_test_session}
                              completedHref={`/staff/applications/${appId}/results/video`}
                              onPersistReturn={persistReturn}
                              label="Video test"
                            />
                          </td>
                          <td
                            className="w-12 px-2 py-3"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <CompactAssessmentIndicator
                              session={
                                application?.general_questionnaire_session
                              }
                              completedHref={`/staff/applications/${appId}/results/questionnaire`}
                              onPersistReturn={persistReturn}
                              label="General questionnaire"
                            />
                          </td>
                          <td
                            className="px-3 py-3 text-center"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <AiCell application={application} />
                          </td>
                          <td className="px-3 py-3 tabular-nums text-zinc-700">
                            <ScoreCell application={application} />
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-zinc-600">
                            {formatDateTime(review.decided_at)}
                          </td>
                          <td className="px-3 py-3">
                            <Link
                              href={`/staff/applications/${appId}`}
                              className={iconButtonClass}
                              title="Open unified application view"
                              aria-label={`Open unified application view for ${applicantName}`}
                              onClick={persistReturn}
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
            <TablePager
              page={page}
              pageSize={pageSize}
              count={totalCount}
              onPage={setPage}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        )}
      </section>

      <TableActionsMenu
        open={menuOpenId !== null}
        triggerSelector={
          menuOpenId != null
            ? `[data-stage-action-menu-trigger="${menuOpenId}"]`
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
                setScheduleTarget(menuStage);
              }}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              Schedule interview
            </button>
            {canReassign(menuStage.status) ? (
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-amal-sheet"
                onClick={() => {
                  setMenuOpenId(null);
                  void openReassign(menuStage);
                }}
              >
                <UserPlusIcon className="h-3.5 w-3.5" />
                Reassign reviewer
              </button>
            ) : null}
            {canRescind(menuStage.status) ? (
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-amal-red hover:bg-amal-red/10"
                onClick={() => {
                  setMenuOpenId(null);
                  setRescindTarget(menuStage);
                }}
              >
                <XIcon className="h-3.5 w-3.5" />
                Rescind assignment
              </button>
            ) : null}
          </>
        ) : null}
      </TableActionsMenu>

      {rejectTarget ? (
        <Modal
          compact
          title="Reject stage?"
          onClose={() => setRejectTarget(null)}
        >
          <p className="mt-2 text-sm text-zinc-600">
            Mark this stage as rejected? This does not email the applicant.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <GhostButton onClick={() => setRejectTarget(null)}>
              Cancel
            </GhostButton>
            <button
              type="button"
              onClick={() => void confirmReject()}
              disabled={stageStatusUpdatingId === rejectTarget.id}
              className="rounded-lg bg-amal-red px-4 py-2 text-sm font-semibold text-amal-white hover:bg-amal-red/90 disabled:opacity-50"
            >
              Reject stage
            </button>
          </div>
        </Modal>
      ) : null}

      {appRejectTarget ? (
        <Modal
          compact
          title="Reject application?"
          onClose={() => setAppRejectTarget(null)}
        >
          <p className="mt-2 text-sm text-zinc-600">
            This will reject <strong>{appRejectTarget.applicant.name}</strong>{" "}
            for <strong>{appRejectTarget.job_opening_name}</strong>. This does
            not email the applicant.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <GhostButton onClick={() => setAppRejectTarget(null)}>
              Cancel
            </GhostButton>
            <button
              type="button"
              onClick={() => void confirmAppReject()}
              disabled={statusUpdatingId === appRejectTarget.id}
              className="rounded-lg bg-amal-red px-4 py-2 text-sm font-semibold text-amal-white hover:bg-amal-red/90 disabled:opacity-50"
            >
              Reject application
            </button>
          </div>
        </Modal>
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
          onConfirm={(clientIds) => void confirmClientReview(clientIds)}
        />
      ) : null}

      {rescindTarget ? (
        <Modal
          compact
          title="Rescind stage assignment?"
          onClose={() => setRescindTarget(null)}
        >
          <p className="mt-2 text-sm text-zinc-600">
            Remove this pending stage assignment? The manager will no longer see
            it.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <GhostButton onClick={() => setRescindTarget(null)}>
              Cancel
            </GhostButton>
            <button
              type="button"
              disabled={rescindBusy}
              onClick={() => void confirmRescind()}
              className="rounded-lg bg-amal-red px-4 py-2 text-sm font-semibold text-amal-white hover:bg-amal-red/90 disabled:opacity-50"
            >
              {rescindBusy ? "Removing…" : "Rescind"}
            </button>
          </div>
        </Modal>
      ) : null}

      {reassignTarget ? (
        <Modal
          compact
          title="Reassign reviewer"
          onClose={() => setReassignTarget(null)}
        >
          {reassignLoading ? (
            <p className="mt-2 text-sm text-zinc-500">Loading reviewers…</p>
          ) : (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-zinc-600">
                Choose a new manager for{" "}
                <strong>
                  {reassignTarget.applicant_name ?? "this applicant"}
                </strong>
                .
              </p>
              <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
                Reviewer
                <select
                  value={reassignManagerId}
                  onChange={(event) => setReassignManagerId(event.target.value)}
                  className="rounded-lg border border-black/15 bg-amal-white px-3 py-2 text-sm"
                >
                  <option value="">Select reviewer…</option>
                  {reassignManagers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.full_name}
                      {manager.email ? ` (${manager.email})` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex justify-end gap-3">
                <GhostButton onClick={() => setReassignTarget(null)}>
                  Cancel
                </GhostButton>
                <PrimaryButton
                  className="gap-1.5"
                  onClick={() => void confirmReassign()}
                  disabled={!reassignManagerId || reassignBusy}
                >
                  <UserPlusIcon className="h-4 w-4" />
                  {reassignBusy ? "Saving…" : "Reassign"}
                </PrimaryButton>
              </div>
            </div>
          )}
        </Modal>
      ) : null}

      {scheduleTarget ? (
        <ScheduleInterviewModal
          stage={scheduleTarget}
          onClose={() => setScheduleTarget(null)}
          onSaved={() => {
            setScheduleTarget(null);
            setTick((value) => value + 1);
            onScheduled?.();
          }}
          onError={onError}
        />
      ) : null}
    </>
  );
}

function ScheduleInterviewModal({
  stage,
  onClose,
  onSaved,
  onError,
}: {
  stage: ApplicationStageHrOverview;
  onClose: () => void;
  onSaved: () => void;
  onError: (value: string) => void;
}) {
  const interviewType =
    stage.interview_type === "on_site" || stage.interview_type === "online"
      ? stage.interview_type
      : "";
  const [kind, setKind] = useState(interviewType);
  const [when, setWhen] = useState(toDateTimeLocalInput(stage.scheduled_at));
  const [busy, setBusy] = useState(false);
  const applicantName =
    stage.applicant_name ??
    stage.application?.applicant.name ??
    "Applicant";
  const jobTitle =
    stage.job_title ?? stage.application?.job_opening_name ?? "Job";
  const stageLabel = stage.name || `Stage ${stage.order}`;

  async function onSave() {
    setBusy(true);
    try {
      await scheduleStage(stage.id, {
        scheduled_at: dateTimeLocalToIso(when),
        interview_type: kind,
      });
      onSaved();
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <CenteredOverlay
      onClose={onClose}
      zClass="z-[90]"
      backdropClassName="bg-amal-black/60 backdrop-blur-sm"
    >
      <div
        className="pointer-events-auto flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-amal-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hr-schedule-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between bg-gradient-to-r from-amal-staff-banner to-amal-red px-5 py-4 text-amal-white">
          <div>
            <h2 id="hr-schedule-modal-title" className="text-lg font-bold">
              {applicantName}
            </h2>
            <p className="mt-0.5 text-sm text-amal-white/90">
              {jobTitle} · {stageLabel}
            </p>
            <p className="mt-1 text-xs text-amal-white/80">
              Assigned to {stage.assigned_to?.full_name ?? "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-amal-white/80 hover:bg-amal-white/10 hover:text-amal-white"
            aria-label="Close"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="hr-schedule-interview-type"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500"
                >
                  Interview type
                </label>
                <select
                  id="hr-schedule-interview-type"
                  value={kind}
                  onChange={(event) => setKind(event.target.value)}
                  className="w-full rounded-lg border border-black/15 bg-amal-white px-3 py-2 text-sm outline-none focus:border-amal-red focus:ring-2 focus:ring-amal-red/20"
                >
                  <option value="">—</option>
                  <option value="on_site">On-site</option>
                  <option value="online">Online</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="hr-schedule-scheduled-at"
                  className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500"
                >
                  <CalendarIcon className="h-3.5 w-3.5" /> Date & time
                </label>
                <input
                  id="hr-schedule-scheduled-at"
                  type="datetime-local"
                  value={when}
                  onChange={(event) => setWhen(event.target.value)}
                  className="w-full rounded-lg border border-black/15 bg-amal-white px-3 py-2 text-sm outline-none focus:border-amal-red focus:ring-2 focus:ring-amal-red/20"
                />
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-black/10 px-5 py-4">
            <GhostButton type="button" onClick={onClose}>
              Cancel
            </GhostButton>
            <PrimaryButton
              type="button"
              className="px-4 py-2.5"
              disabled={busy}
              onClick={() => void onSave()}
            >
              {busy ? "Saving…" : "Save"}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </CenteredOverlay>
  );
}
