import type { ReactNode } from "react";
import type { AssessmentSessionSummary, StaffApplication } from "@/lib/types";
import { LockIcon } from "./icons";

export type AssessmentSessionLike = Partial<AssessmentSessionSummary> | null;

export function getAssessmentEffectiveStatus(
  session: AssessmentSessionLike | undefined,
): string | undefined {
  if (!session) {
    return undefined;
  }
  return session.effective_status ?? session.status;
}

export function formatAssessmentStatusLabel(
  status: string | undefined | null,
): string {
  if (!status) {
    return "—";
  }
  if (status === "in_progress") {
    return "In Progress";
  }
  if (status === "expired") {
    return "Expired";
  }
  if (status === "pending") {
    return "Pending";
  }
  if (status === "completed") {
    return "Completed";
  }
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatAssessmentDateTime(
  value: string | null | undefined,
): string {
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
    hour: "numeric",
    minute: "2-digit",
  });
}

const BADGE_BASE =
  "inline-flex h-7 max-w-full items-center justify-center gap-1 whitespace-nowrap rounded-full border px-2 py-1 text-xs font-semibold leading-none";

export function assessmentStatusToneClass(
  status: string | undefined | null,
): string {
  switch (status) {
    case "completed":
      return "border-emerald-200 bg-emerald-100 text-emerald-800";
    case "in_progress":
      return "border-amber-200 bg-amber-100 text-amber-800";
    case "pending":
      return "border-black/10 bg-amal-sheet text-zinc-700";
    case "expired":
      return "border-amal-red/20 bg-amal-red/10 text-amal-red";
    default:
      return "border-black/10 bg-amal-sheet text-zinc-600";
  }
}

export function AssessmentStatusBadge({
  status,
  expiresAt,
  icon,
}: {
  status: string | undefined | null;
  expiresAt?: string | null;
  icon?: ReactNode;
}) {
  const label = formatAssessmentStatusLabel(status);
  const title =
    status === "expired" && expiresAt
      ? `Expired on ${formatAssessmentDateTime(expiresAt)}`
      : undefined;
  return (
    <span
      className={`${BADGE_BASE} ${assessmentStatusToneClass(status)}`}
      title={title}
    >
      {status === "in_progress" ? (
        <span
          className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-amber-500"
          aria-hidden
        />
      ) : null}
      {status === "pending" ? (
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400"
          aria-hidden
        />
      ) : null}
      {icon}
      {label}
    </span>
  );
}

export function AssessmentLockedBadge() {
  return (
    <span className={`${BADGE_BASE} border-black/10 bg-amal-sheet text-zinc-600`}>
      <LockIcon className="h-3 w-3" />
      Locked
    </span>
  );
}

export function AssessmentNotStartedBadge() {
  return (
    <span
      className={`${BADGE_BASE} border-black/10 bg-amal-sheet font-medium text-zinc-500`}
    >
      Not Started
    </span>
  );
}

export function AssessmentCell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-7 items-center justify-center">{children}</div>
  );
}

export const ASSESSMENT_BADGE_BASE = BADGE_BASE;

export function applicationHasAssessmentSession(application: StaffApplication) {
  return Boolean(
    application.test_session ||
      application.video_test_session ||
      application.general_questionnaire_session,
  );
}

export function applicationHasAttemptedAssessment(
  application: StaffApplication,
) {
  const statuses = [
    getAssessmentEffectiveStatus(application.test_session),
    getAssessmentEffectiveStatus(application.video_test_session),
    getAssessmentEffectiveStatus(application.general_questionnaire_session),
  ];
  return statuses.some(
    (status) =>
      status === "in_progress" ||
      status === "completed" ||
      status === "expired",
  );
}

export function getAssessmentExpiresAt(
  application: StaffApplication,
): string | null {
  return (
    application.test_session?.expires_at ??
    application.video_test_session?.expires_at ??
    application.general_questionnaire_session?.expires_at ??
    null
  );
}

export function isAssessmentExpiryPassed(application: StaffApplication) {
  const raw = getAssessmentExpiresAt(application);
  if (!raw) {
    return false;
  }
  const expiresAt = new Date(raw);
  if (Number.isNaN(expiresAt.getTime())) {
    return false;
  }
  return Date.now() > expiresAt.getTime();
}

export function isPreScreeningComplete(application: StaffApplication) {
  return (
    getAssessmentEffectiveStatus(application.test_session) === "completed" &&
    getAssessmentEffectiveStatus(application.video_test_session) ===
      "completed" &&
    getAssessmentEffectiveStatus(application.general_questionnaire_session) ===
      "completed"
  );
}

export function firstTestScoreBadgeClass(score: number): string {
  if (score >= 70) {
    return "border-emerald-200 bg-emerald-100 text-emerald-800";
  }
  if (score >= 50) {
    return "border-amber-200 bg-amber-100 text-amber-800";
  }
  return "border-amal-red/20 bg-amal-red/10 text-amal-red";
}
