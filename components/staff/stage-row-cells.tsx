"use client";

import Link from "next/link";
import type {
  ApplicationStageHrOverview,
  JobApplicationStatus,
  StaffApplication,
} from "@/lib/types";
import {
  ASSESSMENT_BADGE_BASE,
  ApplicationAiScoresInline,
  firstTestScoreBadgeClass,
  formatAssessmentStatusLabel,
  getAssessmentEffectiveStatus,
} from "./assessment-status";
import { CheckIcon, FileSearchIcon } from "./icons";

export function formatDate(value: string | null | undefined): string {
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

export function formatDateTime(value: string | null | undefined): string {
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

export function formatCompactDateTime(value: string | null | undefined): string {
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
    hour: "numeric",
    minute: "2-digit",
  });
}

export function stageStatusLocked(status: string): boolean {
  return (
    status === "interview" || status === "completed" || status === "rejected"
  );
}

export function stageName(stage: ApplicationStageHrOverview): string {
  if (stage.name?.trim()) {
    return stage.name;
  }
  return stage.order ? `Stage ${stage.order}` : "Review";
}

export function applicationFromStage(
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

export function CompactAssessmentIndicator({
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
  if (status === "completed") {
    return (
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700"
        title={`${label} completed`}
      >
        <CheckIcon className="h-3.5 w-3.5" />
        <span className="sr-only">{label} completed</span>
      </span>
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

export function FirstTestCell({
  application,
  appId,
  onPersistReturn,
  linkResults = true,
}: {
  application: StaffApplication | null;
  appId: number;
  onPersistReturn: () => void;
  linkResults?: boolean;
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
    const badgeClass = `${ASSESSMENT_BADGE_BASE} ${
      Number.isNaN(firstScore)
        ? "border-black/10 bg-amal-sheet text-zinc-700"
        : firstTestScoreBadgeClass(firstScore)
    }`;
    const label = Number.isNaN(firstScore) ? "View" : `${firstScore.toFixed(0)}%`;
    if (!linkResults) {
      return (
        <span className={badgeClass}>
          <FileSearchIcon className="h-3.5 w-3.5" />
          {label}
        </span>
      );
    }
    return (
      <Link
        href={`/staff/applications/${appId}/results/first-test`}
        onClick={onPersistReturn}
        className={badgeClass}
      >
        <FileSearchIcon className="h-3.5 w-3.5" />
        {label}
      </Link>
    );
  }
  return (
    <span className="rounded-full bg-amal-sheet px-2.5 py-1 text-xs text-zinc-500">
      {formatAssessmentStatusLabel(status) || session.status}
    </span>
  );
}

export function AiCell({
  application,
  compact = false,
}: {
  application: StaffApplication | null;
  compact?: boolean;
}) {
  if (!application) {
    return <span className="text-zinc-400">—</span>;
  }
  return (
    <ApplicationAiScoresInline application={application} compact={compact} />
  );
}

export function ScoreCell({
  application,
  stageOverallScore,
}: {
  application: StaffApplication | null;
  /** Prefer this stage's score when present (Manage / Stage Assignments). */
  stageOverallScore?: string | number | null;
}) {
  const score =
    stageOverallScore != null && String(stageOverallScore).trim() !== ""
      ? stageOverallScore
      : application?.manager_score_avg;
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
