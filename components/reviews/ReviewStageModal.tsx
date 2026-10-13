"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  addComment,
  completeStage,
  getComments,
  getScorecardMetrics,
  requestInterview,
  setManagerStageStatus,
} from "@/lib/staff-api";
import { stageStatusBadge } from "@/lib/status";
import type {
  ApplicationStage,
  ApplicationStageHrOverview,
  Comment,
} from "@/lib/types";
import {
  ClipboardIcon,
  ExternalLinkIcon,
  MessageSquareIcon,
} from "@/components/staff/icons";
import {
  CenteredOverlay,
  GhostButton,
  Modal,
  ModalCloseButton,
  PrimaryButton,
  inputClass,
} from "@/components/staff/ui";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

function clampScore(value: string): string {
  if (value === "") {
    return "";
  }
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return value;
  }
  return String(Math.min(10, Math.max(0, n)));
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

function stageLabel(stage: ApplicationStage | ApplicationStageHrOverview): string {
  return stage.name?.trim() ? stage.name : `Stage ${stage.order}`;
}

function applicantName(
  stage: ApplicationStage | ApplicationStageHrOverview,
  fallback?: string,
): string {
  if ("applicant_name" in stage && stage.applicant_name?.trim()) {
    return stage.applicant_name.trim();
  }
  return fallback?.trim() || "Applicant";
}

function jobTitle(
  stage: ApplicationStage | ApplicationStageHrOverview,
  fallback?: string,
): string {
  if ("job_title" in stage && stage.job_title?.trim()) {
    return stage.job_title.trim();
  }
  return fallback?.trim() || "Job";
}

type Tab = "scorecard" | "comments";

type Metric = {
  metric_id: number;
  key: string;
  label: string;
  description: string;
  client_weight: number;
};

export function ReviewStageModal({
  stage: initialStage,
  applicantFallback,
  jobFallback,
  onClose,
  onStageUpdated,
  onOpenApplication,
}: {
  stage: ApplicationStage | ApplicationStageHrOverview;
  applicantFallback?: string;
  jobFallback?: string;
  onClose: () => void;
  onStageUpdated: (stage: ApplicationStage) => void;
  onOpenApplication?: () => void;
}) {
  const [stage, setStage] = useState(initialStage);
  const [tab, setTab] = useState<Tab>("scorecard");
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(
    initialStage.status === "interview",
  );
  const [metricsError, setMetricsError] = useState("");
  const [scores, setScores] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentsNotice, setCommentsNotice] = useState("");

  useEffect(() => {
    if (stage.status !== "interview") {
      return;
    }
    let ignore = false;
    getScorecardMetrics(stage.id)
      .then((data) => {
        if (ignore) {
          return;
        }
        const rows = data.metrics ?? [];
        setMetrics(rows);
        const next: Record<number, string> = {};
        for (const row of rows) {
          next[row.metric_id] = "";
        }
        setScores(next);
      })
      .catch((error) => {
        if (!ignore) {
          setMetrics([]);
          setMetricsError(errorText(error));
        }
      })
      .finally(() => {
        if (!ignore) {
          setMetricsLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [stage.id, stage.status]);

  useEffect(() => {
    if (tab !== "comments") {
      return;
    }
    let ignore = false;
    getComments(stage.job_application)
      .then((page) => {
        if (!ignore) {
          setComments(page.results);
        }
      })
      .catch((error) => {
        if (!ignore) {
          setCommentsNotice(errorText(error));
        }
      });
    return () => {
      ignore = true;
    };
  }, [tab, stage.job_application]);

  const overallFit = useMemo(() => {
    if (!metrics.length) {
      return null;
    }
    let sumW = 0;
    let sumWR = 0;
    for (const metric of metrics) {
      const raw = (scores[metric.metric_id] ?? "").trim();
      if (raw === "") {
        return null;
      }
      const n = Number.parseFloat(raw);
      if (!Number.isFinite(n) || n < 0 || n > 10) {
        return null;
      }
      sumW += metric.client_weight;
      sumWR += metric.client_weight * n;
    }
    if (sumW === 0) {
      return null;
    }
    return Math.round((sumWR / sumW) * 100) / 100;
  }, [metrics, scores]);

  const canSubmit =
    overallFit != null &&
    !metricsLoading &&
    !metricsError &&
    metrics.length > 0;

  async function run(name: string, work: () => Promise<void>) {
    setBusy(name);
    setNotice("");
    try {
      await work();
    } catch (error) {
      setNotice(errorText(error));
    } finally {
      setBusy("");
    }
  }

  function applyUpdated(updated: ApplicationStage) {
    setStage(updated);
    onStageUpdated(updated);
  }

  const badge = stageStatusBadge(stage.status);
  const hasHrNote = Boolean(stage.hr_notes?.trim());
  const hasSchedule =
    Boolean(stage.interview_type) ||
    Boolean(stage.scheduled_at) ||
    Boolean(stage.meeting_link?.trim());

  return (
    <>
      <CenteredOverlay onClose={onClose} backdropClassName="bg-amal-black/50">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-stage-modal-title"
          className="pointer-events-auto flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-black/10 bg-amal-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="shrink-0 border-b border-black/10 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2
                  id="review-stage-modal-title"
                  className="truncate text-lg font-bold"
                >
                  {applicantName(stage, applicantFallback)}
                </h2>
                <p className="mt-0.5 truncate text-sm text-zinc-600">
                  {jobTitle(stage, jobFallback)} · {stageLabel(stage)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                  {onOpenApplication ? (
                    <button
                      type="button"
                      onClick={onOpenApplication}
                      className="inline-flex items-center gap-1 text-xs font-medium text-amal-red hover:underline"
                    >
                      <ExternalLinkIcon className="h-3 w-3" />
                      View full application
                    </button>
                  ) : null}
                </div>
              </div>
              <ModalCloseButton className="shrink-0" onClick={onClose} />
            </div>
          </div>

          <div
            role="tablist"
            aria-label="Review stage sections"
            className="flex shrink-0 gap-1 border-b border-black/10 px-5"
          >
            {(
              [
                { key: "scorecard", label: "Scorecard", icon: ClipboardIcon },
                { key: "comments", label: "Comments", icon: MessageSquareIcon },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={tab === item.key}
                onClick={() => setTab(item.key)}
                className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium ${
                  tab === item.key
                    ? "border-amal-red text-amal-red"
                    : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {notice ? (
              <p className="mb-4 rounded-lg border border-amal-red/30 bg-amal-red/5 px-3 py-2 text-sm text-amal-red">
                {notice}
              </p>
            ) : null}

            {tab === "scorecard" ? (
              <div className="space-y-4">
                {hasHrNote || hasSchedule ? (
                  <div className="space-y-3">
                    {hasHrNote ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                          HR note
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-zinc-800">
                          {stage.hr_notes}
                        </p>
                      </div>
                    ) : null}
                    {hasSchedule ? (
                      <div className="rounded-xl border border-teal-200 bg-teal-50/70 px-4 py-3 text-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
                          Interview schedule
                        </p>
                        <div className="mt-2 space-y-1.5 text-zinc-800">
                          {stage.interview_type ? (
                            <p>
                              Type:{" "}
                              {stage.interview_type === "on_site"
                                ? "On-site"
                                : "Online"}
                            </p>
                          ) : null}
                          {stage.scheduled_at ? (
                            <p>Scheduled: {formatDateTime(stage.scheduled_at)}</p>
                          ) : null}
                          {stage.meeting_link ? (
                            <p>
                              Link:{" "}
                              <a
                                href={stage.meeting_link}
                                target="_blank"
                                rel="noreferrer"
                                className="break-all font-semibold text-amal-red hover:underline"
                              >
                                {stage.meeting_link}
                              </a>
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {stage.status === "completed" ? (
                  <div className="space-y-3 rounded-xl border border-black/10 bg-amal-sheet/60 p-4 text-sm">
                    {stage.manager_overall_score != null &&
                    String(stage.manager_overall_score).trim() !== "" ? (
                      <p>
                        Overall fit score:{" "}
                        <span className="font-semibold tabular-nums">
                          {Number(stage.manager_overall_score).toFixed(2)} / 10
                        </span>
                      </p>
                    ) : null}
                    {stage.manager_metric_scores &&
                    stage.manager_metric_scores.length > 0 ? (
                      <ul className="divide-y divide-black/10 rounded-lg border border-black/10 bg-amal-white">
                        {stage.manager_metric_scores.map((row) => (
                          <li
                            key={row.metric_id}
                            className="flex items-center justify-between gap-2 px-3 py-2"
                          >
                            <span>{row.label || `Metric #${row.metric_id}`}</span>
                            <span className="tabular-nums">
                              {Number(row.raw_score).toFixed(2)} / 10
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {stage.interview_feedback ? (
                      <p className="whitespace-pre-wrap text-zinc-700">
                        {stage.interview_feedback}
                      </p>
                    ) : null}
                    {(!stage.manager_metric_scores ||
                      stage.manager_metric_scores.length === 0) &&
                    !stage.interview_feedback &&
                    (stage.manager_overall_score == null ||
                      String(stage.manager_overall_score) === "") ? (
                      <p className="text-zinc-500">No scorecard data.</p>
                    ) : null}
                  </div>
                ) : stage.status === "interview" ? (
                  metricsLoading ? (
                    <p className="text-sm text-zinc-500">Loading scorecard…</p>
                  ) : metricsError ? (
                    <p className="text-sm text-amal-red">{metricsError}</p>
                  ) : metrics.length === 0 ? (
                    <p className="text-sm text-amal-red">
                      This job has no ideal profile or metrics. HR must configure
                      them before you can complete this stage.
                    </p>
                  ) : (
                    <div className="space-y-4 rounded-xl border border-black/10 bg-amal-sheet/60 p-4">
                      <p className="text-xs text-zinc-500">
                        Rate each metric from 0–10.
                      </p>
                      {metrics.map((metric) => (
                        <div
                          key={metric.metric_id}
                          className="rounded-lg border border-black/10 bg-amal-white p-3"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold">
                                {metric.label}
                              </p>
                              {metric.description ? (
                                <p className="mt-0.5 text-xs text-zinc-500">
                                  {metric.description}
                                </p>
                              ) : null}
                            </div>
                            <label className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                              Score (0–10)
                              <input
                                type="number"
                                min={0}
                                max={10}
                                step={1}
                                value={scores[metric.metric_id] ?? ""}
                                onChange={(event) =>
                                  setScores((current) => ({
                                    ...current,
                                    [metric.metric_id]: event.target.value,
                                  }))
                                }
                                onBlur={(event) =>
                                  setScores((current) => ({
                                    ...current,
                                    [metric.metric_id]: clampScore(
                                      event.target.value.trim(),
                                    ),
                                  }))
                                }
                                className="h-9 w-24 rounded-lg border border-black/15 bg-amal-white px-2 text-right text-sm"
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amal-sheet px-3 py-2 text-sm">
                        <span className="font-medium text-zinc-700">
                          Overall fit score
                        </span>
                        <span className="font-semibold tabular-nums text-amal-red">
                          {overallFit != null
                            ? `${overallFit.toFixed(2)} / 10`
                            : "—"}
                        </span>
                      </div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Manager feedback
                        <textarea
                          className={`${inputClass} mt-2 h-20 py-2`}
                          value={feedback}
                          onChange={(event) => setFeedback(event.target.value)}
                          placeholder="Optional notes..."
                        />
                      </label>
                    </div>
                  )
                ) : stage.status === "requested_interview" ? (
                  <div className="rounded-xl border border-violet-200 bg-violet-50/80 p-4 text-sm text-violet-950">
                    <p className="font-medium">Request sent to HR</p>
                    <p className="mt-2">
                      You have requested an interview. HR will set the date,
                      time, and format. You will be able to submit your scorecard
                      after the interview is scheduled.
                    </p>
                  </div>
                ) : stage.status === "rejected" ? (
                  <div className="rounded-xl border border-amal-red/30 bg-amal-red/10 p-4 text-sm">
                    <p className="font-medium">You rejected this candidate</p>
                    <p className="mt-2 text-zinc-700">
                      This decision is final and visible to HR on stage
                      assignments. The applicant is not notified.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-sm">
                    <p>
                      When you are ready, request an interview. HR will schedule
                      the date and time. After that, you can complete your
                      scorecard here.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {commentsNotice ? (
                  <p className="mb-3 text-sm text-amal-red">{commentsNotice}</p>
                ) : null}
                {comments.length === 0 ? (
                  <p className="text-sm text-zinc-500">No comments yet.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {comments.map((row) => (
                      <li
                        key={row.id}
                        className="rounded-lg bg-amal-sheet px-3 py-2"
                      >
                        <p>{row.text}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {row.source} · {formatDateTime(row.created_at)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                <textarea
                  className={`${inputClass} mt-4 h-20 py-2`}
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  placeholder="Write a comment"
                />
                <PrimaryButton
                  type="button"
                  className="mt-3"
                  disabled={busy === "comment" || !commentDraft.trim()}
                  onClick={() =>
                    void run("comment", async () => {
                      const created = await addComment(
                        stage.job_application,
                        commentDraft.trim(),
                      );
                      setComments((current) => [...current, created]);
                      setCommentDraft("");
                    })
                  }
                >
                  {busy === "comment" ? "Saving…" : "Save comment"}
                </PrimaryButton>
              </div>
            )}
          </div>

          {tab === "scorecard" ? (
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-black/10 bg-amal-white px-5 py-4">
              {stage.status === "pending" ? (
                <>
                  <GhostButton disabled={busy !== ""} onClick={onClose}>
                    Cancel
                  </GhostButton>
                  <button
                    type="button"
                    disabled={busy !== ""}
                    onClick={() => setRejectOpen(true)}
                    className="rounded-lg border border-amal-red/30 bg-amal-white px-4 py-2.5 text-sm font-semibold text-amal-red hover:bg-amal-red/10 disabled:opacity-50"
                  >
                    Reject candidate
                  </button>
                  <PrimaryButton
                    disabled={busy !== ""}
                    onClick={() =>
                      void run("request", async () => {
                        applyUpdated(await requestInterview(stage.id));
                      })
                    }
                  >
                    {busy === "request" ? "Sending…" : "Request interview"}
                  </PrimaryButton>
                </>
              ) : stage.status === "requested_interview" ? (
                <>
                  <GhostButton disabled={busy !== ""} onClick={onClose}>
                    Close
                  </GhostButton>
                  <button
                    type="button"
                    disabled={busy !== ""}
                    onClick={() => setRejectOpen(true)}
                    className="rounded-lg border border-amal-red/30 bg-amal-white px-4 py-2.5 text-sm font-semibold text-amal-red hover:bg-amal-red/10 disabled:opacity-50"
                  >
                    Reject candidate
                  </button>
                </>
              ) : stage.status === "interview" ? (
                <>
                  <GhostButton onClick={onClose}>Cancel</GhostButton>
                  <PrimaryButton
                    disabled={!canSubmit || busy === "complete"}
                    onClick={() =>
                      void run("complete", async () => {
                        const metric_scores = metrics.map((metric) => ({
                          metric_id: metric.metric_id,
                          raw_score: Number.parseFloat(
                            (scores[metric.metric_id] ?? "").trim(),
                          ),
                        }));
                        applyUpdated(
                          await completeStage(stage.id, {
                            metric_scores,
                            manager_feedback: feedback.trim() || undefined,
                          }),
                        );
                        onClose();
                      })
                    }
                  >
                    {busy === "complete" ? "Submitting…" : "Submit scorecard"}
                  </PrimaryButton>
                </>
              ) : (
                <GhostButton onClick={onClose}>Close</GhostButton>
              )}
            </div>
          ) : null}
        </div>
      </CenteredOverlay>

      {rejectOpen ? (
        <Modal compact title="Reject candidate?" onClose={() => setRejectOpen(false)}>
          <p className="mt-2 text-sm text-zinc-600">
            Mark this stage as rejected? The applicant will not be emailed.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <GhostButton onClick={() => setRejectOpen(false)}>Cancel</GhostButton>
            <button
              type="button"
              onClick={() => {
                setRejectOpen(false);
                void run("reject", async () => {
                  applyUpdated(
                    await setManagerStageStatus(stage.id, "rejected"),
                  );
                });
              }}
              className="rounded-lg bg-amal-red px-4 py-2 text-sm font-semibold text-amal-white hover:bg-amal-red/90"
            >
              Reject candidate
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
