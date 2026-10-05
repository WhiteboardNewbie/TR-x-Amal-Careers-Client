"use client";

import { useEffect, useState } from "react";
import { ApiError, getJobOpening, mediaUrl } from "@/lib/api";
import {
  addComment,
  getApplicationStages,
  getAssessment,
  getComments,
  getStaffApplication,
  getTimeline,
} from "@/lib/staff-api";
import { STATUS_TONE, labelFor } from "@/lib/status";
import type {
  ApplicationAssessment,
  ApplicationStage,
  Comment,
  JobOpening,
  StaffApplication,
} from "@/lib/types";
import { formatPhoneDisplay } from "@/lib/phone-format";
import {
  AssessmentNotStartedBadge,
  AssessmentStatusBadge,
  getAssessmentEffectiveStatus,
} from "./assessment-status";
import { UserIcon } from "./icons";
import { GhostButton, PrimaryButton, inputClass } from "./ui";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

type DetailTab =
  | "job"
  | "applicant"
  | "assessment"
  | "stages"
  | "comments"
  | "timeline";

const TABS: { key: DetailTab; label: string }[] = [
  { key: "job", label: "Job Details" },
  { key: "applicant", label: "Applicant Info" },
  { key: "assessment", label: "Assessment" },
  { key: "stages", label: "Stages" },
  { key: "comments", label: "Comments" },
  { key: "timeline", label: "Timeline" },
];

function scoreText(value: string | number | null | undefined): string {
  if (value == null || value === "") {
    return "—";
  }
  return String(value);
}

export function ApplicationDetailModal({
  applicationId,
  onClose,
}: {
  applicationId: number;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<DetailTab>("job");
  const [application, setApplication] = useState<StaffApplication | null>(null);
  const [opening, setOpening] = useState<JobOpening | null>(null);
  const [assessment, setAssessment] = useState<ApplicationAssessment | null>(
    null,
  );
  const [stages, setStages] = useState<ApplicationStage[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [timeline, setTimeline] = useState<
    { type: string; date: string | null; label: string }[]
  >([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      getStaffApplication(applicationId),
      getApplicationStages(applicationId),
      getComments(applicationId),
      getTimeline(applicationId),
      getAssessment(applicationId),
    ])
      .then(async ([app, stagePage, commentPage, events, tests]) => {
        if (ignore) {
          return;
        }
        setApplication(app);
        setStages(stagePage.results);
        setComments(commentPage.results);
        setTimeline(events);
        setAssessment(tests);
        const role = await getJobOpening(app.job_opening);
        if (!ignore) {
          setOpening(role);
        }
      })
      .catch((error) => {
        if (!ignore) {
          setNotice(errorText(error));
        }
      });
    return () => {
      ignore = true;
    };
  }, [applicationId]);

  async function saveComment() {
    if (!note.trim()) {
      return;
    }
    setBusy(true);
    try {
      const created = await addComment(applicationId, note.trim());
      setComments((current) => [...current, created]);
      setNote("");
    } catch (error) {
      setNotice(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-amal-black/60 px-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-amal-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        {!application ? (
          <p className="px-6 py-16 text-center text-sm text-zinc-500">
            {notice || "Loading application…"}
          </p>
        ) : (
          <>
            <div className="flex shrink-0 items-start justify-between bg-gradient-to-r from-amal-staff-banner to-amal-red px-6 py-5 text-amal-white">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amal-white/20">
                  <UserIcon className="h-6 w-6" />
                </div>
                <div>
                  <h2
                    id="application-detail-title"
                    className="text-xl font-bold"
                  >
                    {application.applicant.name}
                  </h2>
                  <p className="mt-0.5 text-sm text-amal-white/80">
                    {application.job_opening_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_TONE[application.status]}`}
                >
                  {labelFor(application.status)}
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-2xl leading-none text-amal-white/80 hover:text-amal-white"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="shrink-0 border-b border-black/10 px-6">
              <div className="flex gap-1 overflow-x-auto">
                {TABS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTab(item.key)}
                    className={`px-4 py-3 text-sm font-medium ${
                      tab === item.key
                        ? "border-b-2 border-amal-red text-amal-red"
                        : "text-zinc-500 hover:text-amal-ink"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {notice ? (
                <p className="mb-4 rounded-lg border border-amal-red/30 px-3 py-2 text-sm text-amal-red">
                  {notice}
                </p>
              ) : null}
              {tab === "job" ? (
                <div className="grid gap-3 rounded-xl bg-amal-sheet p-4 text-sm sm:grid-cols-2">
                  <p>
                    <span className="text-zinc-500">Job title</span>
                    <br />
                    <span className="font-semibold">
                      {opening?.title ?? application.job_opening_name}
                    </span>
                  </p>
                  <p>
                    <span className="text-zinc-500">Department</span>
                    <br />
                    <span className="font-semibold">
                      {opening?.department_name || "—"}
                    </span>
                  </p>
                  <p>
                    <span className="text-zinc-500">Location</span>
                    <br />
                    <span className="font-semibold">
                      {opening?.location || "—"}
                    </span>
                  </p>
                  <p>
                    <span className="text-zinc-500">Applied</span>
                    <br />
                    <span className="font-semibold">
                      {application.applied_at.slice(0, 10)}
                    </span>
                  </p>
                </div>
              ) : null}
              {tab === "applicant" ? (
                <div className="grid gap-3 rounded-xl bg-amal-sheet p-4 text-sm sm:grid-cols-2">
                  <p>
                    <span className="text-zinc-500">Email</span>
                    <br />
                    <span className="font-semibold">
                      {application.applicant.email}
                    </span>
                  </p>
                  <p>
                    <span className="text-zinc-500">City</span>
                    <br />
                    <span className="font-semibold">
                      {application.applicant.city || "—"}
                    </span>
                  </p>
                  <p>
                    <span className="text-zinc-500">Contact</span>
                    <br />
                    <span className="font-semibold">
                      {formatPhoneDisplay(application.applicant.contact)}
                    </span>
                  </p>
                  <p>
                    <span className="text-zinc-500">Resume</span>
                    <br />
                    {mediaUrl(application.resume) ? (
                      <a
                        href={mediaUrl(application.resume) ?? undefined}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-amal-red"
                      >
                        Open resume
                      </a>
                    ) : (
                      "—"
                    )}
                  </p>
                </div>
              ) : null}
              {tab === "assessment" ? (
                <div className="grid gap-3 text-sm sm:grid-cols-3">
                  {(
                    [
                      {
                        title: "First test",
                        session: application.test_session,
                        section: assessment?.first_test,
                      },
                      {
                        title: "Video",
                        session: application.video_test_session,
                        section: assessment?.video_test,
                      },
                      {
                        title: "Questionnaire",
                        session: application.general_questionnaire_session,
                        section: assessment?.questionnaire,
                      },
                    ] as const
                  ).map((item) => {
                    const status =
                      item.section?.status ??
                      getAssessmentEffectiveStatus(item.session);
                    const score =
                      item.section?.score_percentage ??
                      item.session?.score_percentage;
                    return (
                      <div
                        key={item.title}
                        className="flex flex-col items-center gap-2 rounded-xl border border-black/10 bg-amal-sheet/60 px-3 py-4 text-center"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          {item.title}
                        </p>
                        {status ? (
                          <AssessmentStatusBadge status={status} />
                        ) : (
                          <AssessmentNotStartedBadge />
                        )}
                        <p className="text-sm text-zinc-600">
                          Score {scoreText(score)}
                        </p>
                      </div>
                    );
                  })}
                  {assessment?.invite_url ? (
                    <p className="sm:col-span-3 break-all text-zinc-500">
                      Invite: {assessment.invite_url}
                    </p>
                  ) : (
                    <p className="sm:col-span-3 text-zinc-500">
                      No assessment invite yet.
                    </p>
                  )}
                </div>
              ) : null}
              {tab === "stages" ? (
                stages.length === 0 ? (
                  <p className="text-sm text-zinc-500">No stages assigned.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {stages.map((stage) => (
                      <li
                        key={stage.id}
                        className="rounded-lg border border-black/10 px-3 py-2"
                      >
                        <span className="font-semibold">
                          {stage.name || "Stage"}
                        </span>
                        <span className="text-zinc-500">
                          {" "}
                          · {labelFor(stage.status)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )
              ) : null}
              {tab === "comments" ? (
                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <p className="text-sm text-zinc-500">No comments yet.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {comments.map((item) => (
                        <li
                          key={item.id}
                          className="rounded-lg border border-black/10 px-3 py-2"
                        >
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  )}
                  <textarea
                    className={`${inputClass} h-20 py-2`}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Add a comment"
                  />
                  <PrimaryButton
                    type="button"
                    disabled={busy || !note.trim()}
                    onClick={() => void saveComment()}
                  >
                    {busy ? "Saving…" : "Add comment"}
                  </PrimaryButton>
                </div>
              ) : null}
              {tab === "timeline" ? (
                timeline.length === 0 ? (
                  <p className="text-sm text-zinc-500">No timeline events.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {timeline.map((event, index) => (
                      <li key={`${event.type}-${index}`}>
                        <span className="font-semibold">{event.label}</span>
                        {event.date ? (
                          <span className="text-zinc-500">
                            {" "}
                            · {event.date.slice(0, 10)}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )
              ) : null}
            </div>
            <div className="flex shrink-0 justify-end border-t border-black/10 p-4">
              <GhostButton type="button" onClick={onClose}>
                Close
              </GhostButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
