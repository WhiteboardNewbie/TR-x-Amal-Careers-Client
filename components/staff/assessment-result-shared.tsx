"use client";

import { useMemo } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import {
  peekCareersApplicationsReturn,
  type CareersApplicationsReturn,
} from "@/lib/careers-return";
import { readSession } from "@/lib/session";

export function staffHubBreadcrumbLabel(
  returnHint: CareersApplicationsReturn | null,
  options?: { isReviews?: boolean },
): string {
  if (options?.isReviews || returnHint?.tab === "manage") {
    return "Manage Applications";
  }
  if (returnHint?.tab === "stages") {
    return "Stage Assignments";
  }
  return "Job Applications";
}

export function staffHubBreadcrumbHref(landing?: string | null): string {
  return landing === "reviews" ? "/reviews" : "/staff";
}

export function staffApplicationHref(
  applicationId: number,
  landing?: string | null,
): string {
  return landing === "reviews"
    ? `/reviews/${applicationId}`
    : `/staff/applications/${applicationId}`;
}

export function getScoreTone(percentage: number): {
  text: string;
  bg: string;
  border: string;
} {
  if (percentage >= 70) {
    return {
      text: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    };
  }
  if (percentage >= 50) {
    return {
      text: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
    };
  }
  return {
    text: "text-amal-red",
    bg: "bg-amal-red/10",
    border: "border-amal-red/30",
  };
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

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null) {
    return "—";
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) {
    return "—";
  }
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AssessmentResultBackNav({
  applicationId,
  currentLabel,
}: {
  applicationId: number;
  currentLabel: string;
}) {
  const returnHint = useMemo(() => peekCareersApplicationsReturn(), []);
  const landing = useMemo(() => readSession()?.landing, []);
  const hubHref = staffHubBreadcrumbHref(landing);
  const applicationHref = staffApplicationHref(applicationId, landing);

  return (
    <Breadcrumbs
      linkAs="careers"
      items={[
        {
          label: staffHubBreadcrumbLabel(returnHint, {
            isReviews: landing === "reviews",
          }),
          href: hubHref,
        },
        { label: "Application", href: applicationHref },
        { label: currentLabel },
      ]}
    />
  );
}

export function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-black/10 bg-amal-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="border-b border-black/5 px-5 py-4">
      <div className="flex items-center gap-2">
        {icon ? (
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-amal-sheet text-zinc-600">
            {icon}
          </span>
        ) : null}
        <h2 className="text-base font-bold text-zinc-900">{title}</h2>
      </div>
      {subtitle ? (
        <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
      ) : null}
    </div>
  );
}
