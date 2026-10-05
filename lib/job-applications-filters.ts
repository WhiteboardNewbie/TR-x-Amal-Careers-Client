export type JobApplicationsDatePreset =
  | "any"
  | "last7"
  | "last30"
  | "quarter"
  | "custom";

export type JobApplicationsFilterState = {
  searchInput: string;
  statusFilter: string;
  jobFilter: string;
  datePreset: JobApplicationsDatePreset;
  appliedFrom: string;
  appliedTo: string;
  firstTestScoreMin: string;
  firstTestScoreMax: string;
  aiRelevanceScoreMin: string;
  aiRelevanceScoreMax: string;
  requireFirstTest: boolean;
  requireVideo: boolean;
  requireQuestionnaire: boolean;
  advancedOpen: boolean;
};

export const DEFAULT_JOB_APPLICATIONS_FILTERS: JobApplicationsFilterState = {
  searchInput: "",
  statusFilter: "all",
  jobFilter: "all",
  datePreset: "any",
  appliedFrom: "",
  appliedTo: "",
  firstTestScoreMin: "",
  firstTestScoreMax: "",
  aiRelevanceScoreMin: "",
  aiRelevanceScoreMax: "",
  requireFirstTest: false,
  requireVideo: false,
  requireQuestionnaire: false,
  advancedOpen: false,
};

export type JobApplicationsFilterPresetId =
  | "needs-review"
  | "manager-queue"
  | "pre-screening-complete"
  | "high-ai-match"
  | "shortlisted-plus";

function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function dateRangeForPreset(preset: JobApplicationsDatePreset): {
  from: string;
  to: string;
} {
  if (preset === "any") {
    return { from: "", to: "" };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const to = isoDate(today);
  if (preset === "last7") {
    const fromDate = new Date(today);
    fromDate.setDate(fromDate.getDate() - 6);
    return { from: isoDate(fromDate), to };
  }
  if (preset === "last30") {
    const fromDate = new Date(today);
    fromDate.setDate(fromDate.getDate() - 29);
    return { from: isoDate(fromDate), to };
  }
  if (preset === "quarter") {
    const fromDate = new Date(
      today.getFullYear(),
      Math.floor(today.getMonth() / 3) * 3,
      1,
    );
    return { from: isoDate(fromDate), to };
  }
  return { from: "", to: "" };
}

export function inferDatePreset(
  appliedFrom: string,
  appliedTo: string,
): JobApplicationsDatePreset {
  if (!appliedFrom && !appliedTo) {
    return "any";
  }
  for (const preset of ["last7", "last30", "quarter"] as const) {
    const range = dateRangeForPreset(preset);
    if (range.from === appliedFrom && range.to === appliedTo) {
      return preset;
    }
  }
  return "custom";
}

export function jobApplicationsFiltersToApiParams(
  debouncedSearch: string,
  filters: JobApplicationsFilterState,
) {
  return {
    status: filters.statusFilter === "all" ? undefined : filters.statusFilter,
    job_opening: filters.jobFilter === "all" ? undefined : filters.jobFilter,
    search: debouncedSearch.trim() || undefined,
    applied_from: filters.appliedFrom.trim() || undefined,
    applied_to: filters.appliedTo.trim() || undefined,
    first_test_score_min: filters.firstTestScoreMin.trim() || undefined,
    first_test_score_max: filters.firstTestScoreMax.trim() || undefined,
    ai_relevance_score_min: filters.aiRelevanceScoreMin.trim() || undefined,
    ai_relevance_score_max: filters.aiRelevanceScoreMax.trim() || undefined,
    completed_first_test: filters.requireFirstTest || undefined,
    completed_video_test: filters.requireVideo || undefined,
    completed_general_questionnaire: filters.requireQuestionnaire || undefined,
  };
}

export function hasActiveJobApplicationFilters(
  debouncedSearch: string,
  filters: JobApplicationsFilterState,
): boolean {
  return (
    debouncedSearch.trim().length > 0 ||
    filters.statusFilter !== "all" ||
    filters.jobFilter !== "all" ||
    filters.appliedFrom.trim().length > 0 ||
    filters.appliedTo.trim().length > 0 ||
    filters.firstTestScoreMin.trim().length > 0 ||
    filters.firstTestScoreMax.trim().length > 0 ||
    filters.aiRelevanceScoreMin.trim().length > 0 ||
    filters.aiRelevanceScoreMax.trim().length > 0 ||
    filters.requireFirstTest ||
    filters.requireVideo ||
    filters.requireQuestionnaire
  );
}

export function getJobApplicationsPresetState(
  presetId: JobApplicationsFilterPresetId,
): JobApplicationsFilterState {
  const base = { ...DEFAULT_JOB_APPLICATIONS_FILTERS };
  switch (presetId) {
    case "needs-review":
      return { ...base, statusFilter: "new,in-review" };
    case "manager-queue":
      return { ...base, statusFilter: "manager-review" };
    case "pre-screening-complete":
      return {
        ...base,
        requireFirstTest: true,
        requireVideo: true,
        requireQuestionnaire: true,
      };
    case "high-ai-match":
      return { ...base, aiRelevanceScoreMin: "80" };
    case "shortlisted-plus":
      return { ...base, statusFilter: "shortlisted,offered" };
    default:
      return base;
  }
}

export function matchesJobApplicationsPreset(
  debouncedSearch: string,
  filters: JobApplicationsFilterState,
  presetId: JobApplicationsFilterPresetId,
): boolean {
  if (debouncedSearch.trim()) {
    return false;
  }
  const preset = getJobApplicationsPresetState(presetId);
  return (
    filters.statusFilter === preset.statusFilter &&
    filters.jobFilter === preset.jobFilter &&
    filters.appliedFrom === preset.appliedFrom &&
    filters.appliedTo === preset.appliedTo &&
    filters.firstTestScoreMin === preset.firstTestScoreMin &&
    filters.firstTestScoreMax === preset.firstTestScoreMax &&
    filters.aiRelevanceScoreMin === preset.aiRelevanceScoreMin &&
    filters.aiRelevanceScoreMax === preset.aiRelevanceScoreMax &&
    filters.requireFirstTest === preset.requireFirstTest &&
    filters.requireVideo === preset.requireVideo &&
    filters.requireQuestionnaire === preset.requireQuestionnaire
  );
}
