"use client";

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { ApiError, mediaUrl } from "@/lib/api";
import {
  getSharedApplication,
  getSharedApplicationResumeBlob,
  sharedResumeUrl,
  type SharedApplication as SharedPayload,
  type SharedMcqQuestion,
  type SharedVideoQuestion,
} from "@/lib/public-api";
import { STATUS_BADGE, labelFor } from "@/lib/status";
import type { VideoEvaluation } from "@/lib/types";
import { ResumePreviewPanel } from "@/components/staff/ResumePreviewPanel";
import { CenteredOverlay, ModalCloseButton } from "@/components/staff/ui";
import {
  AwardIcon,
  CalendarIcon,
  CheckIcon,
  FileTextIcon,
  MailIcon,
  MapPinIcon,
  MessageSquareIcon,
  PhoneIcon,
  PlayIcon,
  VideoIcon,
} from "@/components/staff/icons";

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null) return "—";
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function scoreNumber(value: string | number | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
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
    bg: "bg-amal-red/5",
    border: "border-amal-red/25",
    text: "text-amal-red",
  };
}

const VIDEO_COMPETENCIES = [
  { key: "communication", label: "Communication" },
  { key: "responsiveness", label: "Responsiveness" },
  { key: "problem_solving", label: "Problem solving" },
  { key: "technical", label: "Technical" },
  { key: "ownership", label: "Ownership" },
] as const;

export function SharedApplication({ id }: { id: string }) {
  const [data, setData] = useState<SharedPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [resumeBlob, setResumeBlob] = useState<Blob | null>(null);
  const [resumeObjectUrl, setResumeObjectUrl] = useState("");
  const [resumeLoading, setResumeLoading] = useState(false);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [firstTestOpen, setFirstTestOpen] = useState(false);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [loadedResumeKey, setLoadedResumeKey] = useState("");
  const videoSectionRef = useRef<HTMLDivElement>(null);
  const videoEvalRef = useRef<HTMLDivElement>(null);

  if (loadedId !== id) {
    setLoadedId(id);
    setData(null);
    setError(null);
    setNotFound(false);
    setLoading(true);
    setResumeBlob(null);
    setResumeObjectUrl("");
    setResumeLoading(false);
    setLoadedResumeKey("");
    setSelectedVideoIndex(0);
    setFirstTestOpen(false);
  }

  const resumeKey = data?.has_resume ? id : "";
  if (resumeKey && loadedResumeKey !== resumeKey) {
    setLoadedResumeKey(resumeKey);
    setResumeLoading(true);
    setResumeBlob(null);
    setResumeObjectUrl("");
  } else if (!resumeKey && loadedResumeKey) {
    setLoadedResumeKey("");
    setResumeBlob(null);
    setResumeObjectUrl("");
    setResumeLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    getSharedApplication(id)
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
          setError("Share link not found.");
        } else if (err instanceof ApiError && err.status === 410) {
          setError(
            err.message ||
              "This share link has expired or been deactivated.",
          );
        } else {
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not load this shared application.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!data?.has_resume) return;
    let cancelled = false;
    let objectUrl = "";
    getSharedApplicationResumeBlob(id)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setResumeBlob(blob);
        setResumeObjectUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) {
          setResumeBlob(null);
          setResumeObjectUrl("");
        }
      })
      .finally(() => {
        if (!cancelled) setResumeLoading(false);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, data?.has_resume]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amal-sheet px-4">
        <p className="text-sm text-zinc-500">Loading shared application…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amal-sheet px-4">
        <div className="max-w-md rounded-2xl border border-black/10 bg-amal-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-zinc-900">
            {notFound ? "Not found" : "Unavailable"}
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            {error ?? "This shared application could not be loaded."}
          </p>
        </div>
      </div>
    );
  }

  const firstTest = data.first_test;
  const videos = data.video_test?.questions ?? [];
  const questionnaire = data.questionnaire;
  const firstScore = scoreNumber(firstTest?.score_percentage);
  const aiScore = scoreNumber(data.ai_relevance_score);
  const videoEval = data.video_evaluation ?? null;
  const videoAiScore = scoreNumber(videoEval?.overall_score);
  const correctCount =
    firstTest?.correct_count ?? firstTest?.correct_answers ?? null;
  const totalQuestions =
    firstTest?.total_questions ?? firstTest?.questions?.length ?? null;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8faf8_0%,#f3f0ee_45%,#f8faf8_100%)]">
      <div className="mx-auto max-w-[1760px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-medium uppercase tracking-wide text-zinc-500">
          Shared job application · read only
        </p>

        <section className="overflow-hidden rounded-3xl border border-black/10 bg-amal-white shadow-sm">
          <div className="border-b border-black/5 bg-gradient-to-r from-amal-white via-amal-red/5 to-amal-white px-6 py-6 lg:px-8 lg:py-7">
            <div className="flex min-w-0 items-start gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amal-red to-amal-ink text-xl font-bold tracking-tight text-amal-white shadow-lg shadow-amal-red/20">
                {getInitials(data.applicant.name)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                    {data.applicant.name}
                  </h1>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      STATUS_BADGE[data.status] ?? "bg-zinc-100 text-zinc-700",
                    )}
                  >
                    {labelFor(data.status)}
                  </span>
                </div>
                <p className="mt-1.5 text-base font-medium text-zinc-600">
                  {data.role.title}
                  {data.role.department_name
                    ? ` · ${data.role.department_name}`
                    : ""}
                  {data.role.location ? ` · ${data.role.location}` : ""}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ContactChip
                    icon={MailIcon}
                    href={`mailto:${data.applicant.email}`}
                  >
                    {data.applicant.email}
                  </ContactChip>
                  {data.applicant.contact ? (
                    <ContactChip
                      icon={PhoneIcon}
                      href={`tel:${data.applicant.contact}`}
                    >
                      {data.applicant.contact}
                    </ContactChip>
                  ) : null}
                  {data.applicant.city ? (
                    <ContactChip icon={MapPinIcon}>
                      {data.applicant.city}
                    </ContactChip>
                  ) : null}
                  {data.applied_at ? (
                    <ContactChip icon={CalendarIcon}>
                      Applied {formatDate(data.applied_at)}
                    </ContactChip>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
            <MetricCard
              label="First Test"
              value={
                firstScore != null ? `${firstScore.toFixed(0)}%` : "—"
              }
              subtext={
                firstTest && correctCount != null && totalQuestions != null
                  ? `${correctCount}/${totalQuestions} correct`
                  : firstTest
                    ? labelFor(firstTest.status)
                    : "Awaiting completion"
              }
              icon={AwardIcon}
              tone={getScoreTone(firstScore)}
              disabled={!firstTest}
              onClick={() => setFirstTestOpen(true)}
            />
            <MetricCard
              label="AI Resume Evaluation"
              value={aiScore != null ? `${aiScore}%` : "—"}
              subtext={
                data.ai_relevance_analyzed_at
                  ? `Analyzed ${formatDate(data.ai_relevance_analyzed_at)}`
                  : "Not analyzed yet"
              }
              icon={FileTextIcon}
              tone={getScoreTone(aiScore)}
            />
            <MetricCard
              label="AI Video Score"
              value={videoAiScore != null ? `${videoAiScore}` : "—"}
              subtext={
                videoEval?.processing_status === "Processing" ||
                videoEval?.processing_status === "Pending"
                  ? "Evaluation in progress"
                  : videoAiScore != null
                    ? "See AI Video Evaluation below"
                    : "Not evaluated yet"
              }
              icon={VideoIcon}
              tone={getScoreTone(videoAiScore)}
              onClick={() =>
                videoEvalRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
              }
            />
            <MetricCard
              label="Video Test"
              value={
                videos.length
                  ? String(videos.length)
                  : labelFor(data.video_test?.status ?? "pending")
              }
              subtext={
                videos.length
                  ? `${videos.length} recorded response${videos.length === 1 ? "" : "s"}`
                  : "Awaiting completion"
              }
              icon={VideoIcon}
              tone={getScoreTone(videos.length ? 75 : null)}
              disabled={!videos.length}
              onClick={() =>
                videoSectionRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
              }
            />
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <ResumePreviewPanel
              resumePath="resume.pdf"
              resumeBlob={resumeBlob}
              downloadUrl={resumeObjectUrl || sharedResumeUrl(id)}
              hasResume={data.has_resume}
              loading={resumeLoading}
            />
          </div>

          <div className="space-y-6">
            <AiRelevancePanel
              score={aiScore}
              tone={getScoreTone(aiScore)}
              rationale={data.ai_relevance_rationale ?? ""}
              analyzedAt={data.ai_relevance_analyzed_at ?? null}
              hasResume={data.has_resume}
            />

            <div ref={videoEvalRef}>
              <AiVideoEvaluationPanel evaluation={videoEval} />
            </div>

            <div ref={videoSectionRef}>
              <VideoResponsesPanel
                responses={videos}
                selectedIndex={selectedVideoIndex}
                onSelect={setSelectedVideoIndex}
              />
            </div>

            <QuestionnairePanel section={questionnaire} />
          </div>
        </div>
      </div>

      {firstTestOpen ? (
        <FirstTestModal
          result={firstTest}
          onClose={() => setFirstTestOpen(false)}
          onSelectVideo={(index) => {
            setSelectedVideoIndex(index);
            setFirstTestOpen(false);
            window.setTimeout(() => {
              videoSectionRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }, 50);
          }}
          videoCount={videos.length}
        />
      ) : null}
    </div>
  );
}

function ContactChip({
  icon: Icon,
  children,
  href,
}: {
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
  href?: string;
}) {
  const className =
    "inline-flex max-w-full items-center gap-2 rounded-full border border-black/10 bg-amal-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm";
  if (href) {
    return (
      <a
        href={href}
        className={cn(className, "hover:border-amal-red/30 hover:text-amal-red")}
      >
        <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        <span className="truncate">{children}</span>
      </a>
    );
  }
  return (
    <span className={className}>
      <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
      <span className="truncate">{children}</span>
    </span>
  );
}

function MetricCard({
  label,
  value,
  subtext,
  icon: Icon,
  tone,
  disabled = false,
  onClick,
}: {
  label: string;
  value: string;
  subtext: string;
  icon: ComponentType<{ className?: string }>;
  tone: ReturnType<typeof getScoreTone>;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const interactive = Boolean(onClick);
  const className = cn(
    "group relative overflow-hidden rounded-2xl border p-4 text-left transition duration-200 sm:p-5",
    tone.border,
    tone.bg,
    interactive &&
      "hover:-translate-y-0.5 hover:shadow-md disabled:cursor-default disabled:opacity-65 disabled:hover:translate-y-0 disabled:hover:shadow-none",
  );
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            {label}
          </p>
          <p className={cn("mt-2 text-3xl font-bold tracking-tight", tone.text)}>
            {value}
          </p>
          <p className="mt-2 line-clamp-2 text-sm text-zinc-600">{subtext}</p>
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amal-white/80 shadow-sm",
            tone.icon,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {interactive && !disabled ? (
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-amal-red opacity-0 transition group-hover:opacity-100">
          View details
        </span>
      ) : null}
    </>
  );
  if (interactive) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={className}
      >
        {body}
      </button>
    );
  }
  return <div className={className}>{body}</div>;
}

function AiRelevancePanel({
  score,
  tone,
  rationale,
  analyzedAt,
  hasResume,
}: {
  score: number | null;
  tone: ReturnType<typeof getScoreTone>;
  rationale: string;
  analyzedAt: string | null;
  hasResume: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-violet-200/70 bg-amal-white shadow-sm">
      <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50 via-amal-white to-violet-50/60 px-5 py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-amal-white shadow-md">
            <FileTextIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900">
              AI Resume Evaluation
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Compare this resume against the job description and required
              skills.
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-5 p-5 sm:grid-cols-[180px_minmax(0,1fr)]">
        <div
          className={cn(
            "flex flex-col items-center justify-center rounded-2xl border px-4 py-6 text-center",
            tone.border,
            tone.bg,
          )}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Score
          </p>
          <p className={cn("mt-2 text-5xl font-bold tracking-tight", tone.text)}>
            {score != null ? score : "—"}
          </p>
          {score != null ? (
            <p className={cn("mt-1 text-sm font-medium", tone.text)}>% match</p>
          ) : null}
          {analyzedAt ? (
            <p className="mt-4 text-[11px] leading-5 text-zinc-500">
              Last run {formatDate(analyzedAt)}
            </p>
          ) : null}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Rationale
          </p>
          <p className="mt-2 whitespace-pre-wrap rounded-2xl border border-black/5 bg-amal-sheet/80 p-4 text-sm leading-7 text-zinc-700">
            {rationale.trim()
              ? rationale
              : "No AI resume evaluation yet."}
          </p>
          {!hasResume ? (
            <p className="mt-3 text-xs font-medium text-amber-700">
              This application has no resume file to analyze.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function AiVideoEvaluationPanel({
  evaluation,
}: {
  evaluation: VideoEvaluation | null;
}) {
  const score = scoreNumber(evaluation?.overall_score);
  const tone = getScoreTone(score);
  const competencyRows = VIDEO_COMPETENCIES.map(({ key, label }) => {
    const scoreKey = `${key}_score` as keyof VideoEvaluation;
    const reasonKey = `${key}_reason` as keyof VideoEvaluation;
    return {
      key,
      label,
      score:
        typeof evaluation?.[scoreKey] === "number"
          ? (evaluation[scoreKey] as number)
          : null,
      reason: String(evaluation?.[reasonKey] ?? ""),
    };
  });
  const transcripts = evaluation?.transcripts ?? [];

  return (
    <section className="overflow-hidden rounded-2xl border border-teal-200/70 bg-amal-white shadow-sm">
      <div className="border-b border-teal-100 bg-gradient-to-r from-teal-50 via-amal-white to-teal-50/60 px-5 py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-600 text-amal-white shadow-md">
            <VideoIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900">
              AI Video Evaluation
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Scores are generated from video answer transcripts against the
              role requirements.
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-5 p-5">
        {!evaluation || score == null ? (
          <p className="rounded-2xl border border-dashed border-black/10 bg-amal-sheet/60 px-4 py-8 text-center text-sm text-zinc-600">
            No AI video evaluation yet.
          </p>
        ) : (
          <>
            <div className="grid gap-5 lg:grid-cols-[200px_minmax(0,1fr)]">
              <div
                className={cn(
                  "flex flex-col justify-center rounded-2xl border p-5 text-center",
                  tone.border,
                  tone.bg,
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Overall
                </p>
                <p
                  className={cn(
                    "mt-2 text-5xl font-bold tracking-tight",
                    tone.text,
                  )}
                >
                  {score}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {competencyRows.map((row) => (
                  <article
                    key={row.key}
                    className="rounded-2xl border border-black/10 bg-amal-sheet/50 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-zinc-800">
                        {row.label}
                      </p>
                      <p className="text-sm font-bold text-zinc-900">
                        {row.score != null ? row.score : "—"}
                      </p>
                    </div>
                    {row.reason.trim() ? (
                      <p className="mt-2 text-xs leading-5 text-zinc-600">
                        {row.reason}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
            {transcripts.length > 0 ? (
              <div className="border-t border-black/5 pt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Transcripts used for scoring
                </p>
                <div className="mt-3 space-y-3">
                  {transcripts.map((item) => (
                    <details
                      key={item.question_number}
                      className="rounded-2xl border border-black/10 bg-amal-sheet/50 open:bg-amal-white"
                    >
                      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-zinc-800 hover:bg-amal-sheet marker:content-none [&::-webkit-details-marker]:hidden">
                        <span className="font-semibold text-amal-red">
                          Q{item.question_number}
                        </span>
                        <span className="mx-2 text-zinc-300">·</span>
                        <span>{item.question_text || "Video question"}</span>
                      </summary>
                      <div className="border-t border-black/5 px-4 py-3">
                        <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-700">
                          {item.transcript.trim()
                            ? item.transcript
                            : "Transcript not available."}
                        </p>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

function VideoResponsesPanel({
  responses,
  selectedIndex,
  onSelect,
}: {
  responses: SharedVideoQuestion[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const selected = responses[selectedIndex] ?? responses[0] ?? null;
  const videoUrl = mediaUrl(selected?.video);

  return (
    <section className="overflow-hidden rounded-2xl border border-black/10 bg-amal-white">
      <div className="border-b border-black/5 px-5 py-4">
        <h2 className="text-lg font-bold">Video Test Responses</h2>
        <p className="text-sm text-zinc-500">
          Review recorded answers for each question
        </p>
      </div>
      {responses.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amal-sheet">
            <VideoIcon className="h-8 w-8 text-zinc-400" />
          </div>
          <p className="mt-4 text-sm font-medium text-zinc-700">
            No video responses yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="space-y-2 border-b border-black/5 bg-amal-sheet/50 p-4 lg:border-b-0 lg:border-r">
            {responses.map((response, index) => (
              <button
                key={response.order}
                type="button"
                onClick={() => onSelect(index)}
                className={cn(
                  "w-full rounded-xl p-3 text-left transition",
                  selectedIndex === index
                    ? "bg-amal-red text-amal-white shadow-md shadow-amal-red/25"
                    : "border border-transparent bg-amal-white text-zinc-700 hover:border-black/10",
                )}
              >
                <div className="flex items-center gap-2">
                  <PlayIcon className="h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold">Question {response.order}</p>
                    <p
                      className={cn(
                        "text-xs",
                        selectedIndex === index
                          ? "text-amal-white/75"
                          : "text-zinc-500",
                      )}
                    >
                      {formatFileSize(response.file_size_bytes)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div>
            <div className="aspect-video bg-zinc-950">
              {videoUrl ? (
                <video
                  key={selected?.order}
                  src={videoUrl}
                  controls
                  preload="metadata"
                  className="h-full w-full object-contain"
                >
                  <track kind="captions" />
                </video>
              ) : (
                <div className="flex h-full items-center justify-center text-white/70">
                  No video file available
                </div>
              )}
            </div>
            {selected ? (
              <div className="space-y-4 p-5">
                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    Question {selected.order}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">
                    {selected.prompt}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <VideoMetaChip
                    label="Duration"
                    value={formatDuration(selected.duration_seconds)}
                  />
                  <VideoMetaChip
                    label="Size"
                    value={formatFileSize(selected.file_size_bytes)}
                  />
                  <VideoMetaChip
                    label="Recorded"
                    value={formatDate(selected.recorded_at)}
                  />
                  <VideoMetaChip
                    label="Uploaded"
                    value={formatDate(selected.uploaded_at)}
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Transcript
                  </p>
                  <p className="mt-2 whitespace-pre-wrap rounded-2xl border border-black/5 bg-amal-sheet/80 p-4 text-sm leading-7 text-zinc-700">
                    {selected.transcript.trim()
                      ? selected.transcript
                      : "No transcript yet."}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}

function VideoMetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/10 bg-amal-sheet/80 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
        {label}
      </p>
      <p className="mt-0.5 font-medium text-zinc-800">{value}</p>
    </div>
  );
}

function QuestionnairePanel({
  section,
}: {
  section: SharedPayload["questionnaire"];
}) {
  const questions = section?.questions ?? [];
  return (
    <section className="overflow-hidden rounded-2xl border border-black/10 bg-amal-white">
      <div className="border-b border-black/5 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amal-sheet text-amal-red">
            <MessageSquareIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Questionnaire</h2>
            <p className="text-sm text-zinc-500">
              {section
                ? `${labelFor(section.status)}${
                    section.score_percentage != null
                      ? ` · Score ${section.score_percentage}`
                      : ""
                  }`
                : "No result yet."}
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-3 p-5">
        {questions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-black/10 bg-amal-sheet/60 px-4 py-8 text-center text-sm text-zinc-600">
            No questionnaire responses yet.
          </p>
        ) : (
          questions.map((item) => (
            <div
              key={item.order}
              className="rounded-2xl border border-black/10 bg-amal-sheet/50 p-4"
            >
              <p className="text-sm font-semibold text-zinc-900">
                {item.order}. {item.question_text}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                {item.answer_text?.trim() || "—"}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function FirstTestModal({
  result,
  onClose,
  onSelectVideo,
  videoCount,
}: {
  result: SharedPayload["first_test"];
  onClose: () => void;
  onSelectVideo: (index: number) => void;
  videoCount: number;
}) {
  const questions = result?.questions ?? [];
  const score = scoreNumber(result?.score_percentage);
  const correct =
    result?.correct_count ?? result?.correct_answers ?? null;
  const total = result?.total_questions ?? questions.length;

  return (
    <CenteredOverlay onClose={onClose} backdropClassName="bg-amal-ink/50">
      <div
        className="pointer-events-auto flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-amal-white shadow-xl"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">First test</h3>
            <p className="text-sm text-zinc-500">
              {score != null ? `${score.toFixed(0)}%` : "—"}
              {correct != null ? ` · ${correct}/${total} correct` : ""}
            </p>
          </div>
          <ModalCloseButton onClick={onClose} />
        </div>
        <div className="space-y-4 overflow-y-auto px-5 py-4">
          {questions.length === 0 ? (
            <p className="text-sm text-zinc-500">No result available.</p>
          ) : (
            questions.map((question) => (
              <FirstTestQuestionBlock key={question.order} question={question} />
            ))
          )}
          {videoCount > 0 ? (
            <div className="rounded-xl border border-black/10 bg-amal-sheet/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Quick links
              </p>
              <button
                type="button"
                onClick={() => onSelectVideo(0)}
                className="mt-2 text-sm font-semibold text-amal-red hover:underline"
              >
                Jump to video responses
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </CenteredOverlay>
  );
}

function FirstTestQuestionBlock({ question }: { question: SharedMcqQuestion }) {
  const options: Array<{ key: string; text?: string }> = [
    { key: "A", text: question.option_a },
    { key: "B", text: question.option_b },
    { key: "C", text: question.option_c },
    { key: "D", text: question.option_d },
  ];
  const selected = (question.selected_option || "").toUpperCase();
  const correct = (question.correct_option || "").toUpperCase();

  return (
    <article className="rounded-2xl border border-black/10 bg-amal-sheet/40 p-4">
      <p className="text-sm font-semibold text-zinc-900">
        {question.order}. {question.question_text}
      </p>
      <div className="mt-3 space-y-2">
        {options.map((option) => {
          if (!option.text) return null;
          const isSelected = selected === option.key;
          const isCorrect = correct === option.key;
          return (
            <div
              key={option.key}
              className={cn(
                "flex items-start gap-2 rounded-xl border px-3 py-2 text-sm",
                isCorrect
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : isSelected
                    ? "border-amal-red/40 bg-amal-red/5 text-zinc-900"
                    : "border-black/10 bg-amal-white text-zinc-700",
              )}
            >
              <span className="mt-0.5 font-bold">{option.key}.</span>
              <span className="flex-1">{option.text}</span>
              {isCorrect ? (
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              ) : null}
            </div>
          );
        })}
      </div>
      {!question.option_a && !question.option_b ? (
        <p className="mt-2 text-sm text-zinc-600">
          Answer: {question.selected_option || "—"}
        </p>
      ) : null}
    </article>
  );
}
