import {
  dateRangeForPreset,
  inferDatePreset,
  type JobApplicationsDatePreset,
} from "@/lib/job-applications-filters";
import { STATUS_LABEL } from "@/lib/status";

export type StageAssignmentsDatePreset = JobApplicationsDatePreset;

export type StageAssignmentsFilterState = {
  searchInput: string;
  stageStatusFilter: string;
  jobFilter: string;
  applicationStatusFilter: string;
  createdDatePreset: StageAssignmentsDatePreset;
  createdFrom: string;
  createdTo: string;
  scheduledDatePreset: StageAssignmentsDatePreset;
  scheduledFrom: string;
  scheduledTo: string;
  appliedDatePreset: StageAssignmentsDatePreset;
  appliedFrom: string;
  appliedTo: string;
  assignedTo: string;
  sort: "newest" | "oldest";
  firstTestScoreMin: string;
  firstTestScoreMax: string;
  aiRelevanceScoreMin: string;
  aiRelevanceScoreMax: string;
  requireFirstTest: boolean;
  requireVideo: boolean;
  requireQuestionnaire: boolean;
  advancedOpen: boolean;
};

export const DEFAULT_STAGE_ASSIGNMENTS_FILTERS: StageAssignmentsFilterState = {
  searchInput: "",
  stageStatusFilter: "all",
  jobFilter: "all",
  applicationStatusFilter: "all",
  createdDatePreset: "any",
  createdFrom: "",
  createdTo: "",
  scheduledDatePreset: "any",
  scheduledFrom: "",
  scheduledTo: "",
  appliedDatePreset: "any",
  appliedFrom: "",
  appliedTo: "",
  assignedTo: "all",
  sort: "newest",
  firstTestScoreMin: "",
  firstTestScoreMax: "",
  aiRelevanceScoreMin: "",
  aiRelevanceScoreMax: "",
  requireFirstTest: false,
  requireVideo: false,
  requireQuestionnaire: false,
  advancedOpen: false,
};

export type StageAssignmentsFilterPresetId =
  | "awaiting-schedule"
  | "pending-stages"
  | "in-interview"
  | "manager-queue"
  | "pre-screening-complete"
  | "high-ai-match";

export type StageAssignmentsRestoreState = {
  page?: number;
  pageSize?: number;
  search?: string;
  reviewerTab?: "managers" | "clients";
  filters?: StageAssignmentsFilterState;
};

export function restoreStateToStageAssignmentsFilters(
  restore: StageAssignmentsRestoreState,
): Partial<StageAssignmentsFilterState> {
  if (restore.filters) {
    return restore.filters;
  }
  if (restore.search) {
    return { searchInput: restore.search };
  }
  return {};
}

export function stageAssignmentsFiltersToApiParams(
  debouncedSearch: string,
  filters: StageAssignmentsFilterState,
) {
  const assignedToId =
    filters.assignedTo !== "all" ? Number(filters.assignedTo) : Number.NaN;
  return {
    search: debouncedSearch.trim() || undefined,
    status:
      filters.stageStatusFilter === "all"
        ? undefined
        : filters.stageStatusFilter,
    job_opening: filters.jobFilter === "all" ? undefined : filters.jobFilter,
    application_status:
      filters.applicationStatusFilter === "all"
        ? undefined
        : filters.applicationStatusFilter,
    created_from: filters.createdFrom.trim() || undefined,
    created_to: filters.createdTo.trim() || undefined,
    scheduled_from: filters.scheduledFrom.trim() || undefined,
    scheduled_to: filters.scheduledTo.trim() || undefined,
    applied_from: filters.appliedFrom.trim() || undefined,
    applied_to: filters.appliedTo.trim() || undefined,
    assigned_to:
      Number.isInteger(assignedToId) && assignedToId > 0
        ? assignedToId
        : undefined,
    ordering: (filters.sort === "oldest" ? "created_at" : "-created_at") as
      | "created_at"
      | "-created_at",
    first_test_score_min: filters.firstTestScoreMin.trim() || undefined,
    first_test_score_max: filters.firstTestScoreMax.trim() || undefined,
    ai_relevance_score_min: filters.aiRelevanceScoreMin.trim() || undefined,
    ai_relevance_score_max: filters.aiRelevanceScoreMax.trim() || undefined,
    completed_first_test: filters.requireFirstTest || undefined,
    completed_video_test: filters.requireVideo || undefined,
    completed_general_questionnaire: filters.requireQuestionnaire || undefined,
  };
}

export function clientReviewFiltersToApiParams(
  debouncedSearch: string,
  filters: StageAssignmentsFilterState,
) {
  const params = stageAssignmentsFiltersToApiParams(debouncedSearch, filters);
  return {
    search: params.search,
    job_opening: params.job_opening,
    application_status: params.application_status,
    created_from: params.created_from,
    created_to: params.created_to,
    applied_from: params.applied_from,
    applied_to: params.applied_to,
    first_test_score_min: params.first_test_score_min,
    first_test_score_max: params.first_test_score_max,
    ai_relevance_score_min: params.ai_relevance_score_min,
    ai_relevance_score_max: params.ai_relevance_score_max,
    completed_first_test: params.completed_first_test,
    completed_video_test: params.completed_video_test,
    completed_general_questionnaire: params.completed_general_questionnaire,
  };
}

export function hasActiveStageAssignmentFilters(
  debouncedSearch: string,
  filters: StageAssignmentsFilterState,
): boolean {
  return (
    debouncedSearch.trim().length > 0 ||
    filters.stageStatusFilter !== "all" ||
    filters.jobFilter !== "all" ||
    filters.applicationStatusFilter !== "all" ||
    filters.createdFrom.trim().length > 0 ||
    filters.createdTo.trim().length > 0 ||
    filters.scheduledFrom.trim().length > 0 ||
    filters.scheduledTo.trim().length > 0 ||
    filters.appliedFrom.trim().length > 0 ||
    filters.appliedTo.trim().length > 0 ||
    filters.assignedTo !== "all" ||
    filters.firstTestScoreMin.trim().length > 0 ||
    filters.firstTestScoreMax.trim().length > 0 ||
    filters.aiRelevanceScoreMin.trim().length > 0 ||
    filters.aiRelevanceScoreMax.trim().length > 0 ||
    filters.requireFirstTest ||
    filters.requireVideo ||
    filters.requireQuestionnaire
  );
}

export function getStageAssignmentsPresetState(
  presetId: StageAssignmentsFilterPresetId,
): StageAssignmentsFilterState {
  const base = { ...DEFAULT_STAGE_ASSIGNMENTS_FILTERS };
  switch (presetId) {
    case "awaiting-schedule":
      return { ...base, stageStatusFilter: "requested_interview" };
    case "pending-stages":
      return { ...base, stageStatusFilter: "pending" };
    case "in-interview":
      return { ...base, stageStatusFilter: "interview" };
    case "manager-queue":
      return { ...base, applicationStatusFilter: "manager-review" };
    case "pre-screening-complete":
      return {
        ...base,
        requireFirstTest: true,
        requireVideo: true,
        requireQuestionnaire: true,
      };
    case "high-ai-match":
      return { ...base, aiRelevanceScoreMin: "70" };
    default:
      return base;
  }
}

export function matchesStageAssignmentsPreset(
  debouncedSearch: string,
  filters: StageAssignmentsFilterState,
  presetId: StageAssignmentsFilterPresetId,
): boolean {
  if (debouncedSearch.trim()) {
    return false;
  }
  const preset = getStageAssignmentsPresetState(presetId);
  return (
    filters.stageStatusFilter === preset.stageStatusFilter &&
    filters.jobFilter === preset.jobFilter &&
    filters.applicationStatusFilter === preset.applicationStatusFilter &&
    filters.createdFrom === preset.createdFrom &&
    filters.createdTo === preset.createdTo &&
    filters.scheduledFrom === preset.scheduledFrom &&
    filters.scheduledTo === preset.scheduledTo &&
    filters.appliedFrom === preset.appliedFrom &&
    filters.appliedTo === preset.appliedTo &&
    filters.assignedTo === preset.assignedTo &&
    filters.firstTestScoreMin === preset.firstTestScoreMin &&
    filters.firstTestScoreMax === preset.firstTestScoreMax &&
    filters.aiRelevanceScoreMin === preset.aiRelevanceScoreMin &&
    filters.aiRelevanceScoreMax === preset.aiRelevanceScoreMax &&
    filters.requireFirstTest === preset.requireFirstTest &&
    filters.requireVideo === preset.requireVideo &&
    filters.requireQuestionnaire === preset.requireQuestionnaire
  );
}

const STAGE_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  requested_interview: "Requested interview",
  interview: "Interview",
  completed: "Completed",
  rejected: "Rejected",
};

const DATE_PRESET_LABELS: Record<StageAssignmentsDatePreset, string> = {
  any: "Any time",
  last7: "Last 7 days",
  last30: "Last 30 days",
  quarter: "This quarter",
  custom: "Custom range",
};

export type StageAssignmentActiveChip = {
  key: string;
  label: string;
  onRemove: () => void;
};

export function buildActiveStageAssignmentFilterChips(
  debouncedSearch: string,
  filters: StageAssignmentsFilterState,
  onChange: (patch: Partial<StageAssignmentsFilterState>) => void,
  reviewerLabel?: string,
): StageAssignmentActiveChip[] {
  const chips: StageAssignmentActiveChip[] = [];
  if (debouncedSearch.trim()) {
    chips.push({
      key: "search",
      label: `Search: ${debouncedSearch.trim()}`,
      onRemove: () => onChange({ searchInput: "" }),
    });
  }
  if (filters.stageStatusFilter !== "all") {
    chips.push({
      key: "stage-status",
      label: `Stage: ${STAGE_STATUS_LABEL[filters.stageStatusFilter] ?? filters.stageStatusFilter}`,
      onRemove: () => onChange({ stageStatusFilter: "all" }),
    });
  }
  if (filters.applicationStatusFilter !== "all") {
    chips.push({
      key: "app-status",
      label: `Application: ${STATUS_LABEL[filters.applicationStatusFilter] ?? filters.applicationStatusFilter}`,
      onRemove: () => onChange({ applicationStatusFilter: "all" }),
    });
  }
  if (filters.jobFilter !== "all") {
    chips.push({
      key: "job",
      label: "Job opening filtered",
      onRemove: () => onChange({ jobFilter: "all" }),
    });
  }
  if (filters.assignedTo !== "all") {
    chips.push({
      key: "reviewer",
      label: `Reviewer: ${reviewerLabel ?? filters.assignedTo}`,
      onRemove: () => onChange({ assignedTo: "all" }),
    });
  }
  if (filters.createdFrom || filters.createdTo) {
    const presetLabel = DATE_PRESET_LABELS[filters.createdDatePreset];
    const rangeLabel =
      filters.createdDatePreset !== "custom" &&
      filters.createdDatePreset !== "any"
        ? presetLabel
        : [filters.createdFrom, filters.createdTo].filter(Boolean).join(" – ");
    chips.push({
      key: "created",
      label: `Created: ${rangeLabel}`,
      onRemove: () =>
        onChange({
          createdDatePreset: "any",
          createdFrom: "",
          createdTo: "",
        }),
    });
  }
  if (filters.scheduledFrom || filters.scheduledTo) {
    const presetLabel = DATE_PRESET_LABELS[filters.scheduledDatePreset];
    const rangeLabel =
      filters.scheduledDatePreset !== "custom" &&
      filters.scheduledDatePreset !== "any"
        ? presetLabel
        : [filters.scheduledFrom, filters.scheduledTo]
            .filter(Boolean)
            .join(" – ");
    chips.push({
      key: "scheduled",
      label: `Interview: ${rangeLabel}`,
      onRemove: () =>
        onChange({
          scheduledDatePreset: "any",
          scheduledFrom: "",
          scheduledTo: "",
        }),
    });
  }
  if (filters.appliedFrom || filters.appliedTo) {
    const presetLabel = DATE_PRESET_LABELS[filters.appliedDatePreset];
    const rangeLabel =
      filters.appliedDatePreset !== "custom" &&
      filters.appliedDatePreset !== "any"
        ? presetLabel
        : [filters.appliedFrom, filters.appliedTo].filter(Boolean).join(" – ");
    chips.push({
      key: "applied",
      label: `Applied: ${rangeLabel}`,
      onRemove: () =>
        onChange({
          appliedDatePreset: "any",
          appliedFrom: "",
          appliedTo: "",
        }),
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
          ? `AI relevance ${min}–${max}`
          : min
            ? `AI relevance ≥ ${min}`
            : `AI relevance ≤ ${max}`,
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
  return chips;
}

export { dateRangeForPreset, inferDatePreset };
