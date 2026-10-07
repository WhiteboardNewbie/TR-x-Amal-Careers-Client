import {
  DEFAULT_JOB_APPLICATIONS_FILTERS,
  type JobApplicationsFilterState,
} from "@/lib/job-applications-filters";
import {
  DEFAULT_MANAGE_APPLICATIONS_FILTERS,
  type ManageApplicationsFilterState,
} from "@/lib/manage-applications-filters";
import {
  DEFAULT_STAGE_ASSIGNMENTS_FILTERS,
  type StageAssignmentsFilterState,
} from "@/lib/stage-assignments-filters";

export type CareersApplicationsReturn =
  | {
      tab: "applications";
      filters: JobApplicationsFilterState;
      page: number;
      pageSize: number;
    }
  | {
      tab: "stages";
      filters: StageAssignmentsFilterState;
      page: number;
      pageSize: number;
      reviewerTab?: "managers" | "clients";
    }
  | {
      tab: "manage";
      filters: ManageApplicationsFilterState;
      page: number;
      pageSize: number;
    };

const CAREERS_RETURN_STORAGE_KEY = "careers:applications-return";

let cachedReturn: CareersApplicationsReturn | null | undefined;
let clearCacheTimer: number | undefined;

export function persistCareersApplicationsReturn(
  payload: CareersApplicationsReturn,
): void {
  try {
    sessionStorage.setItem(CAREERS_RETURN_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* private mode / quota */
  }
  cachedReturn = undefined;
}

function readStoredReturn(): CareersApplicationsReturn | null {
  try {
    const raw = sessionStorage.getItem(CAREERS_RETURN_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return parseReturn(raw);
  } catch {
    return null;
  }
}

function parseReturn(raw: string): CareersApplicationsReturn | null {
  const parsed = JSON.parse(raw) as {
    tab?: string;
    filters?: Record<string, unknown>;
    page?: number;
    pageSize?: number;
    reviewerTab?: "managers" | "clients";
  };
  const page = Number(parsed.page);
  const pageSize = Number(parsed.pageSize);
  const safePage = Number.isFinite(page) && page >= 1 ? page : 1;
  const safePageSize =
    Number.isFinite(pageSize) && pageSize >= 1 ? pageSize : 10;
  if (parsed?.tab === "stages" && parsed.filters) {
    return {
      tab: "stages",
      filters: {
        ...DEFAULT_STAGE_ASSIGNMENTS_FILTERS,
        ...parsed.filters,
      },
      page: safePage,
      pageSize: safePageSize,
      reviewerTab: parsed.reviewerTab === "clients" ? "clients" : "managers",
    };
  }
  if (parsed?.tab === "manage" && parsed.filters) {
    return {
      tab: "manage",
      filters: {
        ...DEFAULT_MANAGE_APPLICATIONS_FILTERS,
        ...parsed.filters,
      },
      page: safePage,
      pageSize: safePageSize,
    };
  }
  if (parsed?.tab !== "applications" || !parsed.filters) {
    return null;
  }
  return {
    tab: "applications",
    filters: {
      ...DEFAULT_JOB_APPLICATIONS_FILTERS,
      ...parsed.filters,
    },
    page: safePage,
    pageSize: safePageSize,
  };
}

export function peekCareersApplicationsReturn(): CareersApplicationsReturn | null {
  if (typeof window === "undefined") {
    return null;
  }
  if (cachedReturn !== undefined && cachedReturn !== null) {
    return cachedReturn;
  }
  return readStoredReturn();
}

export function consumeCareersApplicationsReturn(): CareersApplicationsReturn | null {
  try {
    const raw = sessionStorage.getItem(CAREERS_RETURN_STORAGE_KEY);
    sessionStorage.removeItem(CAREERS_RETURN_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return parseReturn(raw);
  } catch {
    try {
      sessionStorage.removeItem(CAREERS_RETURN_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return null;
  }
}

export function takeCareersApplicationsReturn(): CareersApplicationsReturn | null {
  if (typeof window === "undefined") {
    return null;
  }
  if (clearCacheTimer != null) {
    window.clearTimeout(clearCacheTimer);
    clearCacheTimer = undefined;
  }
  const stored = readStoredReturn();
  if (stored) {
    try {
      sessionStorage.removeItem(CAREERS_RETURN_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    cachedReturn = stored;
    return stored;
  }
  if (cachedReturn !== undefined) {
    return cachedReturn;
  }
  cachedReturn = null;
  return null;
}

export function scheduleClearCareersApplicationsReturnCache(): void {
  if (typeof window === "undefined") {
    cachedReturn = undefined;
    return;
  }
  if (clearCacheTimer != null) {
    window.clearTimeout(clearCacheTimer);
  }
  clearCacheTimer = window.setTimeout(() => {
    cachedReturn = undefined;
    clearCacheTimer = undefined;
  }, 0);
}
