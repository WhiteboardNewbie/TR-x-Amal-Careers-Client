"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, mediaUrl } from "@/lib/api";
import { formatPhoneDisplay, phoneTelHref } from "@/lib/phone-format";
import type { Comment } from "@/lib/types";
import {
  createClientApplicationComment,
  decideClientApplication,
  fetchClientResumeBlob,
  getClientApplication,
  getClientApplicationComments,
  type ClientApplicationDetail,
} from "@/lib/client-api";
import { formatAssessmentStatusLabel } from "@/components/staff/assessment-status";
import {
  AwardIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  ExternalLinkIcon,
  FileTextIcon,
  MailIcon,
  MapPinIcon,
  MessageSquareIcon,
  PhoneIcon,
  PlayIcon,
  SendIcon,
  UserIcon,
  VideoIcon,
  XIcon,
} from "@/components/staff/icons";
import { CenteredOverlay } from "@/components/staff/ui";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

const WORK_TYPE_LABEL: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "Onsite",
};

const EMPLOYMENT_LABEL: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  internship: "Internship",
};

function scoreNumber(
  value: string | number | null | undefined,
): number | null {
  if (value == null || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getScoreTone(score: number | null | undefined): {
  icon: string;
  bg: string;
  border: string;
  text: string;
} {
  if (score == null) {
    return {
      icon: "text-zinc-500",
      bg: "bg-zinc-50",
      border: "border-zinc-200",
      text: "text-zinc-700",
    };
  }
  if (score >= 70) {
    return {
      icon: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-700",
    };
  }
  if (score >= 50) {
    return {
      icon: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-700",
    };
  }
  return {
    icon: "text-amal-red",
    bg: "bg-amal-red/10",
    border: "border-amal-red/20",
    text: "text-amal-red",
  };
}

function formatDate(value: string | null | undefined): string {
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

type ResultKind = "first-test" | "questionnaire";

export function ClientApplication({ id }: { id: number }) {
  const searchParams = useSearchParams();
  const [row, setRow] = useState<ClientApplicationDetail | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<"approved" | "rejected" | null>(null);
  const [resumeUrl, setResumeUrl] = useState("");
  const [resumeLoading, setResumeLoading] = useState(true);
  const [resultKind, setResultKind] = useState<ResultKind | null>(null);
  const [selectedVideo, setSelectedVideo] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentNotice, setCommentNotice] = useState("");

  useEffect(() => {
    let ignore = false;
    getClientApplication(id)
      .then((data) => {
        if (!ignore) {
          setRow(data);
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
  }, [id]);

  useEffect(() => {
    let ignore = false;
    getClientApplicationComments(id)
      .then((data) => {
        if (!ignore) {
          setComments(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (!ignore) {
          setComments([]);
        }
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  useEffect(() => {
    if (!row?.has_resume) {
      return;
    }
    let objectUrl = "";
    let ignore = false;
    fetchClientResumeBlob(id)
      .then((blob) => {
        if (ignore) {
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setResumeUrl(objectUrl);
      })
      .catch(() => {
        if (!ignore) {
          setResumeUrl("");
        }
      })
      .finally(() => {
        if (!ignore) {
          setResumeLoading(false);
        }
      });
    return () => {
      ignore = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [id, row?.has_resume]);

  async function confirmDecision() {
    if (!pending) {
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const review = await decideClientApplication(id, pending);
      setRow((current) =>
        current
          ? {
              ...current,
              review: { ...current.review, status: review.status },
              client_review_status: review.status as
                | "pending"
                | "approved"
                | "rejected",
            }
          : current,
      );
      setPending(null);
    } catch (error) {
      setNotice(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  async function saveComment() {
    const text = commentDraft.trim();
    if (!text || commentBusy) {
      return;
    }
    setCommentBusy(true);
    setCommentNotice("");
    try {
      const created = await createClientApplicationComment(id, text);
      setComments((current) => [...current, created]);
      setCommentDraft("");
    } catch (error) {
      setCommentNotice(errorText(error));
    } finally {
      setCommentBusy(false);
    }
  }

  const applicantName = row?.applicant?.name ?? row?.applicant_name ?? "";
  const reviewStatus =
    row?.client_review_status ?? row?.review.status ?? "pending";
  const canEdit = reviewStatus === "pending";
  const firstScore = scoreNumber(row?.first_test?.score_percentage);
  const videoAiScore = scoreNumber(row?.video_test?.score_percentage);
  const firstTone = getScoreTone(firstScore);
  const aiScore = scoreNumber(row?.ai_relevance_score);
  const aiTone = getScoreTone(aiScore);
  const backSlug = searchParams.get("role") || row?.role.slug;
  const backHref = backSlug ? `/client/roles/${backSlug}` : "/client";
  const videoQuestions = row?.video_test?.questions ?? [];
  const selectedPrompt = videoQuestions[selectedVideo] ?? null;
  const videoUrl = mediaUrl(selectedPrompt?.video);
  const firstQuestions = row?.first_test?.questions ?? [];
  const questionnaireQuestions = row?.questionnaire?.questions ?? [];

  const typeLabel = useMemo(() => {
    if (!row) {
      return "";
    }
    return [
      row.role.employment_type
        ? (EMPLOYMENT_LABEL[row.role.employment_type] ??
          row.role.employment_type)
        : "",
      row.role.work_type
        ? (WORK_TYPE_LABEL[row.role.work_type] ?? row.role.work_type)
        : "",
    ]
      .filter(Boolean)
      .join(" / ");
  }, [row]);

  if (!row) {
    return (
      <div className="mx-auto max-w-[1800px] space-y-5 p-6">
        {notice ? (
          <>
            <Link
              href="/client"
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-amal-ink"
            >
              ← Back to hiring
            </Link>
            <section className="rounded-2xl border border-black/10 bg-amal-white p-6 shadow-sm">
              <p className="text-sm text-zinc-600">{notice}</p>
            </section>
          </>
        ) : (
          <div className="flex min-h-[60vh] items-center justify-center">
            <p className="text-sm text-zinc-500">
              Loading unified application view...
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-full bg-amal-sheet">
      <div className="mx-auto max-w-[1800px] space-y-5 p-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 transition-colors hover:text-amal-ink"
        >
          ← Back to {backSlug ? "role applicants" : "hiring"}
        </Link>

        {notice ? (
          <p className="rounded-2xl border border-amal-red/30 bg-amal-white px-4 py-3 text-sm text-amal-red">
            {notice}
          </p>
        ) : null}

        <section className="overflow-hidden rounded-2xl border border-black/10 bg-amal-white shadow-sm">
          <div className="bg-gradient-to-r from-amal-staff-banner to-amal-red px-6 py-5 text-amal-white">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amal-white/20">
                  <UserIcon className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{applicantName}</h1>
                  <p className="mt-1 text-sm text-amal-white">
                    {row.role.title}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-amal-white/20 px-2.5 py-1 font-medium text-amal-white">
                      Applied {formatDate(row.applied_at)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-full space-y-3 lg:max-w-md">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <HeaderStat
                    label="First Test"
                    value={
                      firstScore != null
                        ? `${firstScore.toFixed(0)}%`
                        : formatAssessmentStatusLabel(row.first_test?.status)
                    }
                  />
                  <HeaderStat
                    label="Video"
                    value={formatAssessmentStatusLabel(row.video_test?.status)}
                  />
                  <HeaderStat
                    label="Questionnaire"
                    value={formatAssessmentStatusLabel(
                      row.questionnaire?.status,
                    )}
                  />
                </div>
                <div>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-amal-white">
                      Your review
                    </p>
                    {!canEdit ? (
                      <span className="rounded-full bg-amal-white/20 px-2.5 py-0.5 text-[11px] font-medium text-amal-white">
                        Final ·{" "}
                        {reviewStatus === "approved"
                          ? "Approved"
                          : reviewStatus === "rejected"
                            ? "Rejected"
                            : "Pending"}
                      </span>
                    ) : null}
                  </div>
                  {!canEdit ? (
                    <p className="mb-2 text-[11px] text-amal-white">
                      This decision is final and cannot be changed later.
                    </p>
                  ) : null}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={!canEdit || busy}
                      onClick={() => {
                        if (canEdit) {
                          setPending("approved");
                        }
                      }}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold transition ${
                        reviewStatus === "approved"
                          ? "bg-emerald-500 text-amal-white"
                          : "bg-amal-white/20 text-amal-white hover:bg-amal-white/30"
                      } disabled:cursor-default disabled:opacity-60`}
                    >
                      <CheckIcon className="h-3.5 w-3.5" />
                      Approved
                    </button>
                    <button
                      type="button"
                      disabled={!canEdit || busy}
                      onClick={() => {
                        if (canEdit) {
                          setPending("rejected");
                        }
                      }}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold transition ${
                        reviewStatus === "rejected"
                          ? "bg-amal-white text-amal-red"
                          : "bg-amal-white/20 text-amal-white hover:bg-amal-white/30"
                      } disabled:cursor-default disabled:opacity-60`}
                    >
                      <XIcon className="h-3.5 w-3.5" />
                      Rejected
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(440px,0.95fr)]">
          <div className="min-w-0 space-y-5 xl:sticky xl:top-5 xl:self-start">
            <section className="overflow-hidden rounded-2xl border border-black/10 bg-amal-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 px-5 py-4">
                <SectionHeading
                  icon={FileTextIcon}
                  title="Resume"
                  subtitle="Candidate document preview"
                />
                {resumeUrl ? (
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-amal-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-amal-sheet"
                  >
                    <ExternalLinkIcon className="h-3.5 w-3.5" />
                    Open
                  </a>
                ) : null}
              </div>
              {!row.has_resume ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center text-zinc-500">
                  <FileTextIcon className="mb-3 h-12 w-12" />
                  <p>No resume uploaded.</p>
                </div>
              ) : resumeLoading ? (
                <p className="flex min-h-[420px] items-center justify-center p-8 text-sm text-zinc-500">
                  Loading resume preview...
                </p>
              ) : resumeUrl ? (
                <iframe
                  src={resumeUrl}
                  title="Candidate resume"
                  className="h-[calc(100vh-15rem)] min-h-[560px] w-full bg-amal-sheet"
                />
              ) : (
                <div className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center text-zinc-500">
                  <FileTextIcon className="mb-3 h-12 w-12" />
                  <p>Could not load resume preview.</p>
                </div>
              )}
            </section>
          </div>

          <div className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-black/10 bg-amal-white shadow-sm">
              <div className="border-b border-black/5 bg-amal-sheet/60 px-5 py-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amal-ink text-amal-white">
                    <FileTextIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">AI Resume Evaluation</h2>
                    <p className="mt-1 text-sm text-zinc-600">
                      Resume relevance score and reasoning for this role.
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid gap-5 p-5 sm:grid-cols-[180px_minmax(0,1fr)] sm:p-6">
                <div
                  className={cn(
                    "flex flex-col items-center justify-center rounded-2xl border px-4 py-6 text-center",
                    aiTone.border,
                    aiTone.bg,
                  )}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Score
                  </p>
                  <p
                    className={cn(
                      "mt-2 text-5xl font-bold tracking-tight",
                      aiTone.text,
                    )}
                  >
                    {aiScore != null ? aiScore : "—"}
                  </p>
                  {aiScore != null ? (
                    <p className={cn("mt-1 text-sm font-medium", aiTone.text)}>
                      % match
                    </p>
                  ) : null}
                  {row.ai_relevance_analyzed_at ? (
                    <p className="mt-4 text-[11px] leading-5 text-zinc-500">
                      Last run {formatDateTime(row.ai_relevance_analyzed_at)}
                    </p>
                  ) : null}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Rationale
                  </p>
                  <p className="mt-2 whitespace-pre-wrap rounded-2xl border border-black/5 bg-amal-sheet/80 p-4 text-sm leading-7 text-zinc-700">
                    {row.ai_relevance_rationale?.trim()
                      ? row.ai_relevance_rationale
                      : "HR has not run AI resume analysis for this applicant yet."}
                  </p>
                  {!row.has_resume ? (
                    <p className="mt-3 text-xs font-medium text-amber-700">
                      This application has no resume file to analyze.
                    </p>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-black/10 bg-amal-white shadow-sm">
              <div className="border-b border-black/5 bg-amal-sheet/60 px-5 py-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amal-ink text-amal-white">
                    <VideoIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">AI Video Evaluation</h2>
                    <p className="mt-1 text-sm text-zinc-600">
                      Scores are generated from video answer transcripts against
                      the role requirements.
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid gap-5 p-5 sm:grid-cols-[140px_minmax(0,1fr)] sm:p-6">
                <div className="flex flex-col items-center justify-center rounded-2xl border border-black/10 bg-amal-sheet/80 px-4 py-5 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Score
                  </p>
                  <p className="mt-2 text-4xl font-bold tracking-tight">
                    {videoAiScore != null ? videoAiScore.toFixed(0) : "—"}
                  </p>
                  {videoAiScore != null ? (
                    <p className="mt-1 text-sm font-medium text-zinc-600">
                      % match
                    </p>
                  ) : null}
                </div>
                <p className="text-sm leading-7 text-zinc-600">
                  {videoAiScore != null
                    ? "Score comes from transcripts of the recorded answers. Use Video Test Responses below to watch each clip."
                    : "Not available yet. Hiring staff run video AI after pre-screening completes."}
                </p>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <button
                type="button"
                disabled={!firstQuestions.length}
                onClick={() => setResultKind("first-test")}
                className={cn(
                  "rounded-2xl border p-5 text-left transition hover:shadow-sm disabled:cursor-default disabled:opacity-70",
                  firstTone.bg,
                  firstTone.border,
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      First Test Score
                    </p>
                    <p className={cn("mt-2 text-3xl font-bold", firstTone.text)}>
                      {firstScore != null ? `${firstScore.toFixed(0)}%` : "—"}
                    </p>
                  </div>
                  <AwardIcon className={cn("h-9 w-9", firstTone.icon)} />
                </div>
                <p className="mt-3 text-sm text-zinc-600">
                  {firstQuestions.length
                    ? `${firstQuestions.length} questions. Click to review answers.`
                    : formatAssessmentStatusLabel(row.first_test?.status)}
                </p>
              </button>
              <button
                type="button"
                disabled={!questionnaireQuestions.length}
                onClick={() => setResultKind("questionnaire")}
                className="rounded-2xl border border-black/10 bg-amal-white p-5 text-left transition hover:border-amal-red/20 hover:bg-amal-red/5 hover:shadow-sm disabled:cursor-default disabled:opacity-70"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      General Questionnaire
                    </p>
                    <p className="mt-2 text-2xl font-bold">
                      {formatAssessmentStatusLabel(row.questionnaire?.status)}
                    </p>
                  </div>
                  <MessageSquareIcon className="h-9 w-9 text-amal-red" />
                </div>
                <p className="mt-3 text-sm text-zinc-600">
                  {questionnaireQuestions.length
                    ? `${questionnaireQuestions.length} responses. Click to review answers.`
                    : "No completed questionnaire responses available."}
                </p>
              </button>
            </div>

            <section className="overflow-hidden rounded-2xl border border-black/10 bg-amal-white shadow-sm">
              <div className="border-b border-black/5 px-5 py-4">
                <SectionHeading icon={BriefcaseIcon} title="Application Context" />
              </div>
              <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
                <InfoRow
                  icon={BriefcaseIcon}
                  label="Role"
                  value={row.role.title}
                />
                <InfoRow
                  icon={MapPinIcon}
                  label="Department / Location"
                  value={[row.role.department_name, row.role.location]
                    .filter(Boolean)
                    .join(" / ")}
                />
                <InfoRow icon={ClockIcon} label="Type" value={typeLabel} />
                <InfoRow
                  icon={MailIcon}
                  label="Email"
                  value={row.applicant?.email}
                  href={
                    row.applicant?.email
                      ? `mailto:${row.applicant.email}`
                      : undefined
                  }
                />
                <InfoRow
                  icon={PhoneIcon}
                  label="Phone / City"
                  value={[
                    row.applicant?.contact
                      ? formatPhoneDisplay(row.applicant.contact)
                      : "",
                    row.applicant?.city,
                  ]
                    .filter(Boolean)
                    .join(" / ")}
                  href={phoneTelHref(row.applicant?.contact ?? "") ?? undefined}
                />
                <InfoRow
                  icon={CalendarIcon}
                  label="Applied"
                  value={formatDateTime(row.applied_at)}
                />
              </div>
              {row.cover_letter?.trim() ? (
                <div className="space-y-3 border-t border-black/5 p-5">
                  <div className="rounded-xl bg-amal-sheet p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Cover letter
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                      {row.cover_letter}
                    </p>
                  </div>
                </div>
              ) : null}
            </section>

            <section className="overflow-hidden rounded-2xl border border-black/10 bg-amal-white shadow-sm">
              <div className="border-b border-black/5 px-5 py-4">
                <SectionHeading
                  icon={MessageSquareIcon}
                  title="Your comments"
                  subtitle="Your notes on this applicant"
                />
              </div>
              <div className="space-y-4 p-5">
                {comments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-black/10 bg-amal-sheet/70 px-4 py-6 text-center">
                    <MessageSquareIcon className="mx-auto h-7 w-7 text-zinc-300" />
                    <p className="mt-2 text-sm font-medium text-zinc-600">
                      No comments yet
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Add a note for yourself on this applicant.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {comments.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-xl border border-black/5 bg-amal-sheet/50 px-4 py-3"
                      >
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
                          <span className="font-semibold text-zinc-700">
                            {item.author_display_name || "You"}
                          </span>
                          {item.created_at ? (
                            <>
                              <span aria-hidden>·</span>
                              <time dateTime={item.created_at}>
                                {formatDateTime(item.created_at)}
                              </time>
                            </>
                          ) : null}
                          {item.source && item.source !== "general" ? (
                            <span className="rounded-full bg-amal-blue/10 px-2 py-0.5 text-[11px] font-medium text-amal-blue">
                              {item.source_label || item.source}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-800">
                          {item.text}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="space-y-2">
                  <textarea
                    value={commentDraft}
                    onChange={(event) => setCommentDraft(event.target.value)}
                    rows={3}
                    placeholder="Write a comment..."
                    className="w-full rounded-lg border border-black/15 bg-amal-white px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-amal-red focus:ring-1 focus:ring-amal-red"
                  />
                  <div className="flex items-center justify-between gap-2">
                    {commentNotice ? (
                      <p className="text-xs text-amal-red">{commentNotice}</p>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      disabled={commentBusy || !commentDraft.trim()}
                      onClick={() => void saveComment()}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amal-red px-3 py-1.5 text-sm font-medium text-amal-white hover:bg-amal-red/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <SendIcon className="h-3.5 w-3.5" />
                      {commentBusy ? "Saving..." : "Add comment"}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-black/10 bg-amal-white shadow-sm">
              <div className="border-b border-black/5 px-5 py-4">
                <SectionHeading
                  icon={VideoIcon}
                  title="Video Test"
                  subtitle="Click a question to play the response in this view"
                />
              </div>
              {videoQuestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-10 text-center text-zinc-500">
                  <VideoIcon className="mb-3 h-12 w-12" />
                  <p>No completed video responses available.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="space-y-2 border-b border-black/5 p-4 lg:border-b-0 lg:border-r">
                    {videoQuestions.map((item, index) => (
                      <button
                        key={`${item.order}-${index}`}
                        type="button"
                        onClick={() => setSelectedVideo(index)}
                        className={`w-full rounded-xl p-3 text-left transition ${
                          selectedVideo === index
                            ? "bg-amal-ink text-amal-white"
                            : "bg-amal-sheet text-zinc-700 hover:bg-zinc-100/80"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <PlayIcon className="h-4 w-4 shrink-0" />
                          <p className="font-semibold">Question {item.order}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div>
                    <div className="aspect-video bg-amal-black">
                      {videoUrl ? (
                        <video
                          key={videoUrl}
                          src={videoUrl}
                          controls
                          preload="metadata"
                          className="h-full w-full object-contain"
                        >
                          <track kind="captions" />
                        </video>
                      ) : (
                        <div className="flex h-full items-center justify-center text-amal-white/70">
                          No video file
                        </div>
                      )}
                    </div>
                    {selectedPrompt ? (
                      <div className="space-y-3 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold">
                              Question {selectedPrompt.order}
                            </h3>
                            <p className="mt-1 text-sm text-zinc-600">
                              {selectedPrompt.prompt}
                            </p>
                          </div>
                          {videoUrl ? (
                            <a
                              href={videoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-amal-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-amal-sheet"
                            >
                              <ExternalLinkIcon className="h-3.5 w-3.5" />
                              Open Video
                            </a>
                          ) : null}
                        </div>
                        <p className="whitespace-pre-wrap text-sm text-zinc-600">
                          {selectedPrompt.transcript || "No transcript yet."}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {resultKind === "first-test" ? (
        <CenteredOverlay
          onClose={() => setResultKind(null)}
          zClass="z-[90]"
          backdropClassName="bg-amal-black/40"
        >
          <div
            className="pointer-events-auto flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-amal-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <ModalHeader
              title="First Test Answers"
              onClose={() => setResultKind(null)}
            />
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  <MetricTile
                    label="Score"
                    value={
                      firstScore != null ? `${firstScore.toFixed(0)}%` : "—"
                    }
                  />
                  <MetricTile
                    label="Questions"
                    value={String(firstQuestions.length)}
                  />
                  <MetricTile
                    label="Status"
                    value={formatAssessmentStatusLabel(row.first_test?.status)}
                  />
                </div>
                <div className="space-y-3">
                  {firstQuestions.map((item) => (
                    <div
                      key={item.order}
                      className="rounded-xl border border-black/10 p-4"
                    >
                      <p className="font-semibold">
                        Question {item.order}
                      </p>
                      <p className="mt-1 text-sm text-zinc-700">
                        {item.question_text}
                      </p>
                      <div className="mt-3 rounded-lg bg-amal-sheet p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          Answer
                        </p>
                        <p className="mt-2 text-sm text-zinc-800">
                          {item.selected_option || "—"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CenteredOverlay>
      ) : null}

      {resultKind === "questionnaire" ? (
        <CenteredOverlay
          onClose={() => setResultKind(null)}
          zClass="z-[90]"
          backdropClassName="bg-amal-black/40"
        >
          <div
            className="pointer-events-auto flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-amal-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <ModalHeader
              title="General Questionnaire Answers"
              onClose={() => setResultKind(null)}
            />
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {questionnaireQuestions.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  No responses submitted yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {questionnaireQuestions.map((item) => (
                    <div
                      key={item.order}
                      className="rounded-xl border border-black/10 p-5"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amal-red/10 text-sm font-semibold text-amal-red">
                          {item.order}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold">{item.question_text}</h3>
                          <div className="mt-3 rounded-lg bg-amal-sheet p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                              Answer
                            </p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
                              {item.answer_text?.trim() ||
                                item.selected_option ||
                                "No answer provided"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CenteredOverlay>
      ) : null}

      {pending ? (
        <CenteredOverlay
          onClose={() => {
            if (!busy) {
              setPending(null);
            }
          }}
          backdropClassName="bg-amal-black/40"
        >
          <div
            className="pointer-events-auto w-full max-w-md rounded-2xl border border-black/10 bg-amal-white p-5 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="client-decision-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3
              id="client-decision-title"
              className="text-lg font-semibold"
            >
              Set review to {pending}?
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              This decision is final and cannot be changed later. HR will see
              your review status on the application.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setPending(null)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-amal-sheet"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void confirmDecision()}
                className="rounded-lg bg-amal-red px-3 py-2 text-sm font-semibold text-amal-white hover:bg-amal-red/90 disabled:opacity-60"
              >
                {busy ? "Saving…" : `Confirm ${pending}`}
              </button>
            </div>
          </div>
        </CenteredOverlay>
      ) : null}
    </div>
  );
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-amal-white/20 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-amal-white">
        {label}
      </p>
      <p className="mt-1 font-semibold text-amal-white">{value || "—"}</p>
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: (props: { className?: string }) => ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-amal-sheet text-zinc-600">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <h2 className="text-base font-bold">{title}</h2>
      </div>
      {subtitle ? (
        <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
      ) : null}
    </div>
  );
}

function ModalHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-black/5 px-6 py-4">
      <h2 className="text-lg font-bold">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-1 text-zinc-500 hover:bg-amal-sheet hover:text-amal-ink"
        aria-label="Close"
      >
        <XIcon className="h-5 w-5" />
      </button>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-amal-sheet p-4">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: (props: { className?: string }) => ReactNode;
  label: string;
  value: string | null | undefined;
  href?: string;
}) {
  const content = value?.trim() ? value : "—";
  return (
    <div className="flex items-start gap-3 rounded-xl bg-amal-sheet p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-zinc-500">{label}</p>
        {href && content !== "—" ? (
          <a
            href={href}
            className="break-words text-sm font-semibold text-amal-red hover:underline"
          >
            {content}
          </a>
        ) : (
          <p className="break-words text-sm font-semibold">{content}</p>
        )}
      </div>
    </div>
  );
}
