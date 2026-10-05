import {
  inferDatePreset,
  type JobApplicationsDatePreset,
  type JobApplicationsFilterState,
} from "@/lib/job-applications-filters";

export type CvSearchUrlState = {
  q: string;
  jobFilter: string;
  statusFilter: string;
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
  page: number;
  pageSize: number;
};

export function parseCvSearchSearchParams(
  params: URLSearchParams,
): Partial<CvSearchUrlState> {
  const partial: Partial<CvSearchUrlState> = {};
  const q = params.get("q");
  if (q != null) {
    partial.q = q;
  }
  const status = params.get("status");
  if (status) {
    partial.statusFilter = status;
  }
  const job = params.get("job");
  if (job) {
    partial.jobFilter = job;
  }
  const from = params.get("from");
  const to = params.get("to");
  if (from != null) {
    partial.appliedFrom = from;
  }
  if (to != null) {
    partial.appliedTo = to;
  }
  const preset = params.get("date");
  if (
    preset === "any" ||
    preset === "last7" ||
    preset === "last30" ||
    preset === "quarter" ||
    preset === "custom"
  ) {
    partial.datePreset = preset;
  } else if (from != null || to != null) {
    partial.datePreset = inferDatePreset(from ?? "", to ?? "");
  }
  const ftMin = params.get("ft_min");
  if (ftMin != null) {
    partial.firstTestScoreMin = ftMin;
  }
  const ftMax = params.get("ft_max");
  if (ftMax != null) {
    partial.firstTestScoreMax = ftMax;
  }
  const aiMin = params.get("ai_min");
  if (aiMin != null) {
    partial.aiRelevanceScoreMin = aiMin;
  }
  const aiMax = params.get("ai_max");
  if (aiMax != null) {
    partial.aiRelevanceScoreMax = aiMax;
  }
  if (params.get("ft_done") === "1") {
    partial.requireFirstTest = true;
  }
  if (params.get("vid_done") === "1") {
    partial.requireVideo = true;
  }
  if (params.get("gq_done") === "1") {
    partial.requireQuestionnaire = true;
  }
  if (params.get("advanced") === "1") {
    partial.advancedOpen = true;
  }
  const pageRaw = params.get("page");
  if (pageRaw) {
    const page = Number(pageRaw);
    if (Number.isFinite(page) && page >= 1) {
      partial.page = page;
    }
  }
  const pageSizeRaw = params.get("page_size");
  if (pageSizeRaw) {
    const pageSize = Number(pageSizeRaw);
    if (Number.isFinite(pageSize) && pageSize >= 1) {
      partial.pageSize = pageSize;
    }
  }
  return partial;
}

export function filtersFromCvSearchUrl(
  parsed: Partial<CvSearchUrlState>,
): JobApplicationsFilterState {
  return {
    searchInput: parsed.q ?? "",
    statusFilter: parsed.statusFilter ?? "all",
    jobFilter: parsed.jobFilter ?? "all",
    datePreset: parsed.datePreset ?? "any",
    appliedFrom: parsed.appliedFrom ?? "",
    appliedTo: parsed.appliedTo ?? "",
    firstTestScoreMin: parsed.firstTestScoreMin ?? "",
    firstTestScoreMax: parsed.firstTestScoreMax ?? "",
    aiRelevanceScoreMin: parsed.aiRelevanceScoreMin ?? "",
    aiRelevanceScoreMax: parsed.aiRelevanceScoreMax ?? "",
    requireFirstTest: parsed.requireFirstTest ?? false,
    requireVideo: parsed.requireVideo ?? false,
    requireQuestionnaire: parsed.requireQuestionnaire ?? false,
    advancedOpen: parsed.advancedOpen ?? false,
  };
}

export function buildCvSearchSearchParams(state: CvSearchUrlState): URLSearchParams {
  const params = new URLSearchParams();
  const q = state.q.trim();
  if (q) {
    params.set("q", q);
  }
  if (state.statusFilter !== "all") {
    params.set("status", state.statusFilter);
  }
  if (state.jobFilter && state.jobFilter !== "all") {
    params.set("job", state.jobFilter);
  }
  if (state.datePreset !== "any") {
    params.set("date", state.datePreset);
  }
  if (state.appliedFrom.trim()) {
    params.set("from", state.appliedFrom.trim());
  }
  if (state.appliedTo.trim()) {
    params.set("to", state.appliedTo.trim());
  }
  if (state.firstTestScoreMin.trim()) {
    params.set("ft_min", state.firstTestScoreMin.trim());
  }
  if (state.firstTestScoreMax.trim()) {
    params.set("ft_max", state.firstTestScoreMax.trim());
  }
  if (state.aiRelevanceScoreMin.trim()) {
    params.set("ai_min", state.aiRelevanceScoreMin.trim());
  }
  if (state.aiRelevanceScoreMax.trim()) {
    params.set("ai_max", state.aiRelevanceScoreMax.trim());
  }
  if (state.requireFirstTest) {
    params.set("ft_done", "1");
  }
  if (state.requireVideo) {
    params.set("vid_done", "1");
  }
  if (state.requireQuestionnaire) {
    params.set("gq_done", "1");
  }
  if (state.advancedOpen) {
    params.set("advanced", "1");
  }
  if (state.page > 1) {
    params.set("page", String(state.page));
  }
  if (state.pageSize !== 25) {
    params.set("page_size", String(state.pageSize));
  }
  return params;
}
