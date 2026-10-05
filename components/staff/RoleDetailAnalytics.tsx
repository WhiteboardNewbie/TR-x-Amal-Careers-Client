"use client";

import {
  FUNNEL_STATUSES,
  STATUS_BADGE,
  STATUS_BAR_FILL,
  STATUS_LABEL,
  TERMINAL_STATUSES,
  labelFor,
} from "@/lib/status";
import type { JobApplicationStatus, JobOpeningAnalytics } from "@/lib/types";
import {
  CalendarIcon,
  ChartIcon,
  ChecksIcon,
  TargetIcon,
  UsersIcon,
} from "./icons";

const BAR_AREA_HEIGHT_PX = 96;
const MIN_BAR_HEIGHT_PX = 4;

function barHeightPx(count: number, maxCount: number): number {
  if (count <= 0) {
    return 0;
  }
  return Math.max(
    MIN_BAR_HEIGHT_PX,
    Math.round((count / maxCount) * BAR_AREA_HEIGHT_PX),
  );
}

function totalApplications(
  analytics: JobOpeningAnalytics | null | undefined,
  applicationCount?: number,
): number {
  return analytics?.total_applications ?? applicationCount ?? 0;
}

export function RoleDetailAnalyticsInsights({
  analytics,
  loading,
  applicationCount,
  onViewApplications,
}: {
  analytics: JobOpeningAnalytics | null | undefined;
  loading: boolean;
  applicationCount?: number;
  onViewApplications: (status?: JobApplicationStatus) => void;
}) {
  const total = totalApplications(analytics, applicationCount);
  const pipelineTotal = analytics
    ? Object.values(analytics.pipeline).reduce((sum, count) => sum + count, 0)
    : 0;

  if (loading) {
    return (
      <div className="rounded-lg border border-black/10 bg-amal-sheet p-6 text-center">
        <p className="text-sm text-zinc-600">Loading role insights…</p>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            {
              label: "Total applications",
              value: total,
              Icon: UsersIcon,
              tone: "bg-amal-red/10 text-amal-red",
            },
            {
              label: "Pre-screening complete",
              value: analytics.assessments.all_three_complete,
              Icon: ChecksIcon,
              tone: "bg-amal-sheet text-amal-ink",
            },
            {
              label: "Avg test score",
              value:
                analytics.averages.first_test_score != null
                  ? `${analytics.averages.first_test_score.toFixed(1)}%`
                  : "—",
              Icon: TargetIcon,
              tone: "bg-amal-ink/5 text-amal-ink",
            },
            {
              label: "Days open",
              value: analytics.days_open ?? "—",
              Icon: CalendarIcon,
              tone: "bg-zinc-100 text-zinc-700",
            },
          ] as const
        ).map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-black/10 bg-amal-white p-4 shadow-sm"
          >
            <div className="mb-1 flex items-center gap-2">
              <div className={`rounded-md p-1.5 ${card.tone}`}>
                <card.Icon className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-medium text-zinc-600">
                {card.label}
              </span>
            </div>
            <p className="text-xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-black/10 bg-amal-white shadow-sm">
          <div className="border-b border-black/10 bg-amal-sheet px-5 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <ChartIcon className="h-4 w-4 text-amal-red" />
              Hiring funnel
            </h3>
          </div>
          <ApplicationStatusFunnel
            byStatus={analytics.by_status}
            totalApplications={total}
            onStageClick={onViewApplications}
          />
        </div>
        <div className="overflow-hidden rounded-2xl border border-black/10 bg-amal-white shadow-sm">
          <div className="border-b border-black/10 bg-amal-sheet px-5 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <ChecksIcon className="h-4 w-4 text-amal-ink" />
              Pipeline stages ({pipelineTotal})
            </h3>
          </div>
          <ul className="space-y-1 p-4">
            {Object.entries(analytics.pipeline)
              .filter(([, count]) => count > 0)
              .map(([status, count]) => (
                <li
                  key={status}
                  className="flex items-center justify-between rounded-lg px-2 py-2 text-sm"
                >
                  <span className="capitalize text-zinc-600">
                    {labelFor(status)}
                  </span>
                  <span className="font-semibold tabular-nums">{count}</span>
                </li>
              ))}
            {pipelineTotal === 0 ? (
              <li className="px-2 py-2 text-sm text-zinc-500">
                No pipeline stages yet.
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ApplicationStatusFunnel({
  byStatus,
  totalApplications: total,
  onStageClick,
}: {
  byStatus: Record<string, number>;
  totalApplications: number;
  onStageClick: (status: JobApplicationStatus) => void;
}) {
  const maxCount = Math.max(
    ...FUNNEL_STATUSES.map((status) => byStatus[status] ?? 0),
    1,
  );

  return (
    <div className="p-4">
      {total === 0 ? (
        <p className="mb-4 text-center text-sm text-zinc-500">
          No applications yet — funnel will populate as candidates apply.
        </p>
      ) : null}
      <div className="overflow-x-auto pb-1">
        <ul
          className="m-0 grid min-w-[28rem] list-none grid-cols-6 gap-1 p-0 sm:min-w-0 sm:gap-2"
          aria-label="Hiring funnel by application status"
        >
          {FUNNEL_STATUSES.map((status) => {
            const count = byStatus[status] ?? 0;
            const height = barHeightPx(count, maxCount);
            const label = STATUS_LABEL[status] ?? status;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <li key={status} className="min-w-0">
                <button
                  type="button"
                  onClick={() => onStageClick(status)}
                  className="group flex w-full min-w-0 flex-col items-center rounded-lg px-1 py-2 transition-colors hover:bg-amal-sheet"
                  aria-label={`${label}, ${count} application${count === 1 ? "" : "s"}`}
                >
                  <span className="h-5 text-sm font-bold leading-5 tabular-nums">
                    {count}
                  </span>
                  <span className="h-3.5 text-[10px] leading-3.5 tabular-nums text-zinc-400">
                    {total > 0 && count > 0 ? `${pct}%` : "\u00A0"}
                  </span>
                  <div
                    className="mt-2 flex w-full max-w-[3rem] items-end justify-center self-center"
                    style={{ height: BAR_AREA_HEIGHT_PX }}
                  >
                    {count > 0 ? (
                      <div
                        className={`w-full max-w-[2.25rem] rounded-t-md transition-opacity group-hover:opacity-90 ${
                          STATUS_BAR_FILL[status] ?? "bg-zinc-400"
                        }`}
                        style={{ height }}
                      />
                    ) : (
                      <div
                        className="w-full max-w-[2.25rem] rounded-t border border-dashed border-black/15 bg-amal-sheet"
                        style={{ height: MIN_BAR_HEIGHT_PX }}
                      />
                    )}
                  </div>
                  <span className="mt-2 flex h-10 w-full items-start justify-center">
                    <span className="line-clamp-2 text-center text-[11px] font-medium leading-tight text-zinc-600">
                      {label}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 border-t border-black/10 pt-4">
        {TERMINAL_STATUSES.map((status) => {
          const count = byStatus[status] ?? 0;
          const label = STATUS_LABEL[status] ?? status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => onStageClick(status)}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium hover:opacity-80 ${
                STATUS_BADGE[status] ?? "bg-amal-sheet text-zinc-600"
              } ${count === 0 ? "opacity-60" : ""}`}
              aria-label={`${label}, ${count} application${count === 1 ? "" : "s"}`}
            >
              <span>{label}</span>
              <span className="font-bold tabular-nums">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function RoleDetailApplicationsCta({
  analytics,
  applicationCount,
  onViewApplications,
}: {
  analytics: JobOpeningAnalytics | null | undefined;
  applicationCount?: number;
  onViewApplications: () => void;
}) {
  return (
    <div className="rounded-xl border border-black/10 bg-amal-sheet p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold">Job applications</h3>
          <p className="mt-1 text-sm text-zinc-600">
            Opens the Job Applications tab filtered to this role.
          </p>
        </div>
        <button
          type="button"
          onClick={onViewApplications}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-amal-red px-4 py-2.5 text-sm font-semibold text-amal-white hover:bg-amal-ink"
        >
          View all applications ({totalApplications(analytics, applicationCount)})
        </button>
      </div>
    </div>
  );
}
