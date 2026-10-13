"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ApiError, getJobOpening, mediaUrl } from "@/lib/api";
import { peekCareersApplicationsReturn } from "@/lib/careers-return";
import { formatPhoneDisplay, phoneTelHref } from "@/lib/phone-format";
import { ReviewStageModal } from "@/components/reviews/ReviewStageModal";
import {
  downloadJobApplicationResume,
  getApplicationStages,
  getAssessment,
  getAssignedStages,
  getDepartmentManagers,
  getStaffApplication,
  getTimeline,
  runVideoEvaluation,
  scoreResume,
} from "@/lib/staff-api";
import { STATUS_TONE, labelFor, stageStatusBadge } from "@/lib/status";
import type {
  ApplicationAssessment,
  ApplicationStage,
  DepartmentManager,
  ApplicationStageHrOverview,
  JobOpening,
  StaffApplication,
  VideoEvaluation,
} from "@/lib/types";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AssessmentCommentsPanel } from "./AssessmentCommentsPanel";
import {
  staffHubBreadcrumbHref,
  staffHubBreadcrumbLabel,
} from "./assessment-result-shared";
import {
  formatAssessmentStatusLabel,
  getAssessmentEffectiveStatus,
} from "./assessment-status";
import {
  AwardIcon,
  BriefcaseIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardIcon,
  ClockIcon,
  ExternalLinkIcon,
  FileTextIcon,
  MailIcon,
  MapPinIcon,
  MessageSquareIcon,
  PhoneIcon,
  PlayIcon,
  ShareIcon,
  VideoIcon,
} from "./icons";
import { ResultPage } from "./ResultPage";
import { ResumePreviewPanel } from "./ResumePreviewPanel";
import { ShareApplicationModal } from "./ShareApplicationModal";
import { CenteredOverlay, PrimaryButton } from "./ui";

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

type ResultKind = "first-test" | "video" | "questionnaire";

function managerStageLabel(
  stage: ApplicationStage | ApplicationStageHrOverview,
): string {
  return stage.name?.trim() ? stage.name : `Stage ${stage.order}`;
}

function getReviewStageButtonLabel(status: string): string {
  if (status === "interview") {
    return "Submit scorecard";
  }
  if (status === "completed") {
    return "View scorecard";
  }
  if (status === "rejected") {
    return "View stage";
  }
  return "Review stage";
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
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
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
    hour: "numeric",
    minute: "2-digit",
  });
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
      icon: "text-emerald-500",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      // Brighter than emerald-700 so scores read clearly on white cards
      text: "text-emerald-600",
    };
  }
  if (score >= 50) {
    return {
      icon: "text-amber-500",
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-600",
    };
  }
  return {
    icon: "text-amal-red",
    bg: "bg-amal-red/10",
    border: "border-amal-red/20",
    text: "text-amal-red",
  };
}

function sessionCompleted(
  session: StaffApplication["test_session"] | undefined,
  sectionStatus?: string | null,
): boolean {
  return (
    sectionStatus === "completed" ||
    getAssessmentEffectiveStatus(session) === "completed"
  );
}

function scoreNumber(
  value: string | number | null | undefined,
): number | null {
  if (value == null || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const VIDEO_EVAL_STATUS_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  Pending: {
    label: "Queued",
    className: "bg-zinc-100 text-zinc-700",
  },
  Processing: {
    label: "Processing",
    className: "bg-amber-100 text-amber-800",
  },
  Completed: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-800",
  },
  Failed: {
    label: "Failed",
    className: "bg-amal-red/10 text-amal-red",
  },
};

function scrollToElement(node: HTMLElement | null) {
  node?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function ApplicationDetail({
  id,
  variant = "staff",
  reviewStageId,
}: {
  id: number;
  variant?: "staff" | "reviews";
  reviewStageId?: number;
}) {
  const isReviews = variant === "reviews";
  const [application, setApplication] = useState<StaffApplication | null>(null);
  const [opening, setOpening] = useState<JobOpening | null>(null);
  const [stages, setStages] = useState<ApplicationStage[]>([]);
  const [timeline, setTimeline] = useState<
    { type: string; date: string | null; label: string }[]
  >([]);
  const [assessment, setAssessment] = useState<ApplicationAssessment | null>(
    null,
  );
  const [managers, setManagers] = useState<DepartmentManager[]>([]);
  const [managerStage, setManagerStage] = useState<
    ApplicationStage | ApplicationStageHrOverview | null
  >(null);
  const [managerStageLoading, setManagerStageLoading] = useState(isReviews);
  const [reviewStageOpen, setReviewStageOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [resultKind, setResultKind] = useState<ResultKind | null>(null);
  const [expandedStageId, setExpandedStageId] = useState<number | null>(null);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [resumeBlob, setResumeBlob] = useState<Blob | null>(null);
  const [resumeDownloadUrl, setResumeDownloadUrl] = useState("");
  const [resumeLoading, setResumeLoading] = useState(false);
  const videoEvalRef = useRef<HTMLDivElement | null>(null);
  const videoSectionRef = useRef<HTMLDivElement | null>(null);
  const onError = useCallback((value: string) => setNotice(value), []);
  const returnHint = useMemo(() => peekCareersApplicationsReturn(), []);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      getStaffApplication(id),
      getApplicationStages(id),
      getTimeline(id),
      getAssessment(id),
      isReviews
        ? getAssignedStages({ page_size: 50 }).catch(() => null)
        : Promise.resolve(null),
    ])
      .then(async ([app, stagePage, events, tests, assigned]) => {
        if (ignore) {
          return;
        }
        setApplication(app);
        setStages(stagePage.results);
        setTimeline(events);
        setAssessment(tests);
        if (isReviews) {
          const assignedMatch =
            assigned?.results.find((row) => {
              if (row.job_application !== id) {
                return false;
              }
              return reviewStageId == null || row.id === reviewStageId;
            }) ??
            assigned?.results.find((row) => row.job_application === id) ??
            null;
          const fromStages =
            (reviewStageId != null
              ? stagePage.results.find((row) => row.id === reviewStageId)
              : null) ?? null;
          setManagerStage(fromStages ?? assignedMatch ?? null);
          setManagerStageLoading(false);
        }
        try {
          const role = await getJobOpening(app.job_opening);
          if (ignore) {
            return;
          }
          setOpening(role);
          if (!isReviews) {
            const departmentManagers = await getDepartmentManagers(
              role.department,
            );
            if (!ignore) {
              setManagers(departmentManagers);
            }
          }
        } catch {
          /* Reviewers can still use job_opening_name from the application. */
        }
      })
      .catch((error) => {
        if (!ignore) {
          onError(errorText(error));
          setManagerStageLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [id, isReviews, onError, reviewStageId]);

  const resumeKey =
    application?.resume && application.id ? application.id : null;
  const [resumeFetchKey, setResumeFetchKey] = useState(resumeKey);
  if (resumeFetchKey !== resumeKey) {
    setResumeFetchKey(resumeKey);
    setResumeBlob(null);
    setResumeDownloadUrl("");
    setResumeLoading(Boolean(resumeKey));
  }

  useEffect(() => {
    if (resumeKey == null) {
      return;
    }
    let objectUrl = "";
    let ignore = false;
    void downloadJobApplicationResume(resumeKey)
      .then((blob) => {
        if (ignore) {
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setResumeBlob(blob);
        setResumeDownloadUrl(objectUrl);
      })
      .catch(() => {
        if (!ignore) {
          setResumeBlob(null);
          setResumeDownloadUrl("");
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
  }, [resumeKey]);

  const managerNameById = useMemo(
    () => new Map(managers.map((row) => [row.id, row.full_name])),
    [managers],
  );
  const orderedStages = useMemo(
    () =>
      [...stages].sort(
        (a, b) =>
          a.order - b.order ||
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    [stages],
  );
  const feedbackItems = useMemo(() => {
    const items: Array<{ label: string; value: string }> = [];
    for (const stage of orderedStages) {
      const stageLabel = stage.name?.trim() || `Stage ${stage.order}`;
      if (stage.hr_notes?.trim()) {
        items.push({
          label: `HR notes · ${stageLabel}`,
          value: stage.hr_notes.trim(),
        });
      }
      if (stage.interview_feedback?.trim()) {
        items.push({
          label: `Manager feedback · ${stageLabel}`,
          value: stage.interview_feedback.trim(),
        });
      }
    }
    return items;
  }, [orderedStages]);
  const currentStage =
    orderedStages.find(
      (stage) => stage.status !== "completed" && stage.status !== "rejected",
    ) ?? orderedStages[orderedStages.length - 1] ?? null;

  if (!application) {
    return (
      <p className="text-sm text-zinc-500">
        {notice || "Loading application…"}
      </p>
    );
  }

  const firstScore = scoreNumber(
    assessment?.first_test?.score_percentage ??
      application.test_session?.score_percentage,
  );
  const aiScore = scoreNumber(application.ai_relevance_score);
  const videoEvaluation = assessment?.video_evaluation ?? null;
  const videoAiScore = scoreNumber(
    videoEvaluation?.overall_score ?? assessment?.video_test?.score_percentage,
  );
  const firstCompleted = sessionCompleted(
    application.test_session,
    assessment?.first_test?.status,
  );
  const videoCompleted = sessionCompleted(
    application.video_test_session,
    assessment?.video_test?.status,
  );
  const questionnaireCompleted = sessionCompleted(
    application.general_questionnaire_session,
    assessment?.questionnaire?.status,
  );
  const videoQuestions = assessment?.video_test?.questions ?? [];
  const firstTestSection = assessment?.first_test;
  const questionnaireAnswers = assessment?.questionnaire?.questions ?? [];
  const preScreeningComplete =
    firstCompleted && videoCompleted && questionnaireCompleted;
  const firstTestSubtext =
    firstCompleted && firstTestSection
      ? `${firstTestSection.correct_count ?? "—"}/${firstTestSection.total_questions ?? firstTestSection.questions.length} correct`
      : formatAssessmentStatusLabel(
          getAssessmentEffectiveStatus(application.test_session) ??
            firstTestSection?.status,
        );
  const hubLabel = staffHubBreadcrumbLabel(returnHint, { isReviews });
  const hubHref = staffHubBreadcrumbHref(isReviews ? "reviews" : undefined);

  async function runResumeScore() {
    setBusy("score");
    setNotice("");
    try {
      const result = await scoreResume(id);
      setApplication((current) =>
        current
          ? {
              ...current,
              ai_relevance_score: result.ai_relevance_score,
              ai_relevance_rationale: result.ai_relevance_rationale,
              ai_relevance_analyzed_at: result.ai_relevance_analyzed_at,
            }
          : current,
      );
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy("");
    }
  }

  async function runVideoScore() {
    setBusy("video-ai");
    setNotice("");
    try {
      const result = await runVideoEvaluation(id);
      setAssessment((current) =>
        current
          ? {
              ...current,
              video_test: result.video_test,
              video_evaluation: result.video_evaluation,
            }
          : current,
      );
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy("");
    }
  }

  const reviewStageAction =
    isReviews && managerStage ? (
      <button
        type="button"
        onClick={() => setReviewStageOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-amal-red/30 bg-amal-white px-4 py-2.5 text-sm font-semibold text-amal-red shadow-sm hover:bg-amal-red/10"
      >
        <ClipboardIcon className="h-4 w-4" />
        {getReviewStageButtonLabel(managerStage.status)}
      </button>
    ) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Breadcrumbs
          linkAs="careers"
          items={[
            { label: hubLabel, href: hubHref },
            {
              label:
                application.applicant.name?.trim() || "Application",
            },
          ]}
        />
        {!isReviews ? (
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-black/15 bg-amal-white px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-amal-sheet"
          >
            <ShareIcon className="h-4 w-4" />
            Share
          </button>
        ) : null}
      </div>

      {notice ? (
        <p className="rounded-lg border border-amal-red/30 bg-amal-white px-3 py-2 text-sm text-amal-red">
          {notice}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-black/10 bg-amal-white shadow-sm">
        <div className="border-b border-black/5 bg-gradient-to-r from-amal-white via-amal-sheet to-amal-white px-6 py-6 lg:px-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amal-staff-banner to-amal-red text-xl font-bold tracking-tight text-amal-white shadow-lg">
              {getInitials(application.applicant.name)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {application.applicant.name}
                </h1>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_TONE[application.status]}`}
                >
                  {labelFor(application.status)}
                </span>
              </div>
              <p className="mt-1.5 text-base font-medium text-zinc-600">
                {opening?.title ?? application.job_opening_name}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ContactChip
                  icon={MailIcon}
                  href={`mailto:${application.applicant.email}`}
                >
                  {application.applicant.email}
                </ContactChip>
                {application.applicant.contact ? (
                  <ContactChip
                    icon={PhoneIcon}
                    href={phoneTelHref(application.applicant.contact) ?? undefined}
                  >
                    {formatPhoneDisplay(application.applicant.contact)}
                  </ContactChip>
                ) : null}
                {application.applicant.city ? (
                  <ContactChip icon={MapPinIcon}>
                    {application.applicant.city}
                  </ContactChip>
                ) : null}
                <ContactChip icon={CalendarIcon}>
                  Applied {formatDate(application.applied_at)}
                </ContactChip>
              </div>
            </div>
          </div>
          {reviewStageAction && managerStage ? (
            <div className="flex shrink-0 flex-col items-start gap-2 xl:items-end">
              {reviewStageAction}
              <p className="text-xs font-medium text-zinc-500">
                {managerStageLabel(managerStage)} ·{" "}
                {stageStatusBadge(managerStage.status).label}
              </p>
            </div>
          ) : managerStageLoading && isReviews ? (
            <span className="text-xs font-medium text-zinc-500">
              Loading your stage…
            </span>
          ) : null}
          </div>
        </div>
        <div
          className={cn(
            "grid grid-cols-1 gap-3 p-4 sm:grid-cols-2",
            isReviews ? "xl:grid-cols-4" : "xl:grid-cols-5",
          )}
        >
          <MetricCard
            label="First Test"
            value={firstScore != null ? `${firstScore.toFixed(0)}%` : "—"}
            subtext={firstTestSubtext}
            icon={AwardIcon}
            tone={getScoreTone(firstScore)}
            disabled={!firstCompleted}
            onClick={firstCompleted ? () => setResultKind("first-test") : undefined}
          />
          <MetricCard
            label="AI Resume Evaluation"
            value={aiScore != null ? `${aiScore}%` : "—"}
            subtext={
              application.ai_relevance_analyzed_at
                ? `Analyzed ${formatDate(application.ai_relevance_analyzed_at)}`
                : "Not analyzed yet"
            }
            icon={FileTextIcon}
            tone={getScoreTone(aiScore)}
          />
          <MetricCard
            label="AI Video Score"
            value={videoAiScore != null ? `${videoAiScore.toFixed(0)}%` : "—"}
            subtext={
              busy === "video-ai" ||
              videoEvaluation?.processing_status === "Processing" ||
              videoEvaluation?.processing_status === "Pending"
                ? "Evaluation in progress"
                : videoAiScore != null
                  ? "See AI Video Evaluation below"
                  : preScreeningComplete
                    ? "Not analyzed yet"
                    : "Finish all three assessment parts first"
            }
            icon={VideoIcon}
            tone={getScoreTone(videoAiScore)}
            onClick={() => scrollToElement(videoEvalRef.current)}
          />
          <MetricCard
            label="Video Test"
            value={
              videoQuestions.length
                ? String(videoQuestions.length)
                : formatAssessmentStatusLabel(
                    getAssessmentEffectiveStatus(
                      application.video_test_session,
                    ) ?? assessment?.video_test?.status,
                  )
            }
            subtext={
              videoQuestions.length
                ? `${videoQuestions.length} recorded response${videoQuestions.length === 1 ? "" : "s"}`
                : "Awaiting completion"
            }
            icon={VideoIcon}
            tone={getScoreTone(videoCompleted ? 75 : null)}
            disabled={!videoCompleted}
            onClick={
              videoCompleted
                ? () => scrollToElement(videoSectionRef.current)
                : undefined
            }
          />
          {isReviews ? null : (
          <MetricCard
            label="Questionnaire"
            value={formatAssessmentStatusLabel(
              getAssessmentEffectiveStatus(
                application.general_questionnaire_session,
              ) ?? assessment?.questionnaire?.status,
            )}
            subtext={
              questionnaireCompleted
                ? `${questionnaireAnswers.length} responses submitted`
                : "Awaiting completion"
            }
            icon={MessageSquareIcon}
            tone={getScoreTone(questionnaireCompleted ? 72 : null)}
            disabled={!questionnaireCompleted}
            onClick={
              questionnaireCompleted
                ? () => setResultKind("questionnaire")
                : undefined
            }
          />
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <ResumePreviewPanel
            resumePath={application.resume}
            resumeBlob={resumeBlob}
            downloadUrl={resumeDownloadUrl}
            hasResume={Boolean(application.resume)}
            loading={resumeLoading}
          />
          <TimelinePanel events={timeline} application={application} />
        </div>

        <div className="space-y-6">
          <AiRelevancePanel
            score={aiScore}
            tone={getScoreTone(aiScore)}
            rationale={application.ai_relevance_rationale ?? ""}
            analyzedAt={application.ai_relevance_analyzed_at ?? null}
            hasResume={Boolean(application.resume)}
            analyzing={busy === "score"}
            showActions={!isReviews}
            onRunAnalysis={() => void runResumeScore()}
          />
          <div ref={videoEvalRef}>
            <AiVideoEvaluationPanel
              evaluation={videoEvaluation}
              score={videoAiScore}
              ready={preScreeningComplete}
              analyzing={busy === "video-ai"}
              showActions={!isReviews}
              onRunAnalysis={() => void runVideoScore()}
            />
          </div>
          <ApplicationContextPanel
            application={application}
            opening={opening}
          />
          {isReviews ? null : (
          <StagesPanel
            stages={orderedStages}
            currentStage={currentStage}
            expandedStageId={expandedStageId}
            managerNameById={managerNameById}
            onToggleStage={(stageId) =>
              setExpandedStageId((current) =>
                current === stageId ? null : stageId,
              )
            }
          />
          )}
          <div ref={videoSectionRef}>
            <VideoResponsesPanel
              responses={videoQuestions}
              selectedIndex={selectedVideoIndex}
              onSelect={setSelectedVideoIndex}
            />
          </div>
          <FeedbackPanel
            items={feedbackItems}
            headerAction={reviewStageAction}
            emptyStateAction={reviewStageAction}
          />
          <AssessmentCommentsPanel
            applicationId={id}
            headerTitle="Comments"
            headerSubtitle="Notes and feedback from reviewers"
          />
        </div>
      </div>

      {resultKind ? (
        <CenteredOverlay
          onClose={() => setResultKind(null)}
          backdropClassName="bg-amal-black/60"
        >
          <div
            className="pointer-events-auto max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-amal-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <ResultPage
              id={id}
              kind={resultKind}
              assessment={assessment}
              onClose={() => setResultKind(null)}
              onSelectVideo={(index) => {
                setSelectedVideoIndex(index);
                setResultKind(null);
                window.setTimeout(() => {
                  scrollToElement(videoSectionRef.current);
                }, 50);
              }}
            />
          </div>
        </CenteredOverlay>
      ) : null}
      {shareOpen ? (
        <ShareApplicationModal
          applicationId={application.id}
          applicantName={application.applicant.name}
          onClose={() => setShareOpen(false)}
          onError={onError}
        />
      ) : null}
      {reviewStageOpen && managerStage ? (
        <ReviewStageModal
          key={managerStage.id}
          stage={managerStage}
          applicantFallback={application.applicant.name}
          jobFallback={opening?.title ?? application.job_opening_name}
          onClose={() => setReviewStageOpen(false)}
          onStageUpdated={(updated) => {
            setManagerStage(updated);
            setStages((current) =>
              current.map((item) => (item.id === updated.id ? updated : item)),
            );
          }}
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
  icon: typeof MailIcon;
  children: ReactNode;
  href?: string;
}) {
  const className =
    "inline-flex max-w-full items-center gap-2 rounded-full border border-black/10 bg-amal-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm";
  if (href) {
    return (
      <a href={href} className={`${className} hover:border-amal-red/40 hover:text-amal-red`}>
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
  disabled,
  onClick,
}: {
  label: string;
  value: string;
  subtext: string;
  icon: typeof AwardIcon;
  tone: ReturnType<typeof getScoreTone>;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const interactive = Boolean(onClick);
  const className = cn(
    "group relative overflow-hidden rounded-2xl border border-black/10 bg-amal-white p-4 text-left transition duration-200 sm:p-5",
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
  analyzing,
  showActions = true,
  onRunAnalysis,
}: {
  score: number | null;
  tone: ReturnType<typeof getScoreTone>;
  rationale: string;
  analyzedAt: string | null;
  hasResume: boolean;
  analyzing: boolean;
  showActions?: boolean;
  onRunAnalysis: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-violet-200/70 bg-amal-white shadow-sm shadow-violet-100/50">
      <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50 via-amal-white to-violet-50/60 px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-amal-white shadow-md shadow-violet-500/30">
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
          {showActions ? (
            <PrimaryButton
              type="button"
              disabled={!hasResume || analyzing}
              onClick={onRunAnalysis}
            >
              {analyzing
                ? "Analyzing..."
                : score != null
                  ? "Re-run Analysis"
                  : "Run Analysis"}
            </PrimaryButton>
          ) : null}
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
              Last run {formatDateTime(analyzedAt)}
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
              : showActions
                ? "Run analysis to generate an AI resume evaluation score and rationale for this resume."
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

function ApplicationContextPanel({
  application,
  opening,
}: {
  application: StaffApplication;
  opening: JobOpening | null;
}) {
  const workLabel = opening?.work_type
    ? (WORK_TYPE_LABEL[opening.work_type] ?? opening.work_type)
    : null;
  const employmentLabel = opening?.employment_type
    ? (EMPLOYMENT_LABEL[opening.employment_type] ?? opening.employment_type)
    : null;
  return (
    <section className="overflow-hidden rounded-2xl border border-black/10 bg-amal-white">
      <div className="border-b border-black/5 px-5 py-4">
        <h2 className="text-lg font-bold">Application Context</h2>
        <p className="text-sm text-zinc-500">
          Role, contact details, and submitted notes
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 lg:grid-cols-3">
        <InfoRow
          icon={BriefcaseIcon}
          label="Role"
          value={opening?.title ?? application.job_opening_name}
        />
        <InfoRow
          icon={MapPinIcon}
          label="Department / Location"
          value={[opening?.department_name, opening?.location]
            .filter(Boolean)
            .join(" / ")}
        />
        <InfoRow
          icon={ClockIcon}
          label="Employment"
          value={[employmentLabel, workLabel].filter(Boolean).join(" / ")}
        />
        <InfoRow
          icon={MailIcon}
          label="Email"
          value={application.applicant.email}
          href={`mailto:${application.applicant.email}`}
        />
        <InfoRow
          icon={PhoneIcon}
          label="Phone / City"
          value={[
            application.applicant.contact
              ? formatPhoneDisplay(application.applicant.contact)
              : "",
            application.applicant.city,
          ]
            .filter(Boolean)
            .join(" / ")}
        />
        <InfoRow
          icon={CalendarIcon}
          label="Applied"
          value={formatDateTime(application.applied_at)}
        />
      </div>
      {application.cover_letter ? (
        <div className="border-t border-black/5 bg-amal-sheet/40 p-5">
          <TextBlock label="Cover letter" value={application.cover_letter} />
        </div>
      ) : null}
    </section>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof BriefcaseIcon;
  label: string;
  value: string | null | undefined;
  href?: string;
}) {
  const content = value?.trim() ? value : "—";
  return (
    <div className="rounded-2xl border border-black/5 bg-amal-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amal-sheet text-zinc-500">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            {label}
          </p>
          {href && content !== "—" ? (
            <a
              href={href}
              className="mt-1 block break-words text-sm font-semibold text-amal-red hover:underline"
            >
              {content}
            </a>
          ) : (
            <p className="mt-1 break-words text-sm font-semibold">{content}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-amal-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        {label}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-700">
        {value}
      </p>
    </div>
  );
}

function StagesPanel({
  stages,
  currentStage,
  expandedStageId,
  managerNameById,
  onToggleStage,
}: {
  stages: ApplicationStage[];
  currentStage: ApplicationStage | null;
  expandedStageId: number | null;
  managerNameById: Map<number, string>;
  onToggleStage: (stageId: number) => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-black/10 bg-amal-white">
      <div className="border-b border-black/5 px-5 py-4">
        <h2 className="text-lg font-bold">Hiring Pipeline</h2>
        <p className="text-sm text-zinc-500">
          Manager stages and interview progress
        </p>
      </div>
      <div className="space-y-4 p-5">
        {currentStage ? (
          <div className="rounded-2xl border border-amal-red/20 bg-gradient-to-r from-amal-red/5 to-amal-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amal-red">
              Current Stage
            </p>
            <p className="mt-1 text-base font-bold">
              {currentStage.name || `Stage ${currentStage.order}`}
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              Assigned to{" "}
              {managerNameById.get(currentStage.assigned_to) ??
                `#${currentStage.assigned_to}`}
            </p>
            <StageMeta stage={currentStage} />
          </div>
        ) : null}
        {stages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/15 bg-amal-sheet px-4 py-8 text-center">
            <p className="text-sm font-medium text-zinc-600">
              No manager stages assigned yet
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Stages will appear here once the pipeline is started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {stages.map((stage, index) => {
              const expanded = expandedStageId === stage.id;
              const isLast = index === stages.length - 1;
              const badge = stageStatusBadge(stage.status);
              return (
                <div key={stage.id} className="relative pl-8">
                  {!isLast ? (
                    <span className="absolute left-[11px] top-10 h-[calc(100%+0.75rem)] w-px bg-zinc-200" />
                  ) : null}
                  <span
                    className={cn(
                      "absolute left-0 top-4 h-6 w-6 rounded-full border-2 bg-amal-white",
                      stage.status === "completed"
                        ? "border-emerald-500"
                        : stage.status === "rejected"
                          ? "border-amal-red"
                          : "border-amal-blue",
                    )}
                  />
                  <div className="overflow-hidden rounded-2xl border border-black/10 bg-amal-white shadow-sm">
                    <button
                      type="button"
                      onClick={() => onToggleStage(stage.id)}
                      className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-amal-sheet/80"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">
                            {stage.name || `Stage ${stage.order}`}
                          </p>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-zinc-600">
                          {managerNameById.get(stage.assigned_to) ??
                            "Unassigned"}{" "}
                          · {formatDate(stage.created_at)}
                        </p>
                      </div>
                      {expanded ? (
                        <ChevronUpIcon className="h-5 w-5 shrink-0 text-zinc-400" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5 shrink-0 text-zinc-400" />
                      )}
                    </button>
                    {expanded ? (
                      <div className="space-y-3 border-t border-black/5 bg-amal-sheet/60 p-4 text-sm">
                        <StageMeta stage={stage} />
                        {stage.hr_notes ? (
                          <TextBlock label="HR notes" value={stage.hr_notes} />
                        ) : null}
                        {stage.interview_feedback ? (
                          <TextBlock
                            label="Manager feedback"
                            value={stage.interview_feedback}
                          />
                        ) : null}
                        {stage.manager_overall_score != null &&
                        String(stage.manager_overall_score).trim() !== "" ? (
                          <p className="rounded-xl bg-amal-white px-3 py-2 font-medium text-zinc-800">
                            Manager score:{" "}
                            {Number(stage.manager_overall_score).toFixed(2)} / 10
                          </p>
                        ) : null}
                        {stage.manager_metric_scores &&
                        stage.manager_metric_scores.length > 0 ? (
                          <ul className="space-y-2">
                            {stage.manager_metric_scores.map((score) => (
                              <li
                                key={score.metric_id}
                                className="flex justify-between gap-3 rounded-xl border border-black/10 bg-amal-white px-3 py-2"
                              >
                                <span className="text-zinc-600">
                                  {score.label ?? `Metric #${score.metric_id}`}
                                </span>
                                <span className="font-semibold text-zinc-900">
                                  {Number(score.raw_score).toFixed(2)} / 10
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function StageMeta({ stage }: { stage: ApplicationStage }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-600">
      {stage.interview_type ? (
        <span className="rounded-full border border-black/10 bg-amal-white px-2.5 py-1">
          {stage.interview_type === "on_site" ? "On-site" : "Online"} interview
        </span>
      ) : null}
      {stage.scheduled_at ? (
        <span className="rounded-full border border-black/10 bg-amal-white px-2.5 py-1">
          Scheduled {formatDateTime(stage.scheduled_at)}
        </span>
      ) : null}
      {stage.meeting_link ? (
        <a
          href={stage.meeting_link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-full bg-amal-white px-2.5 py-1 text-amal-red hover:underline"
        >
          Meeting Link
        </a>
      ) : null}
      {stage.completed_at ? (
        <span className="rounded-full border border-black/10 bg-amal-white px-2.5 py-1">
          Completed {formatDateTime(stage.completed_at)}
        </span>
      ) : null}
    </div>
  );
}

function TimelinePanel({
  events,
  application,
}: {
  events: { type: string; date: string | null; label: string }[];
  application: StaffApplication;
}) {
  const visible = events.length
    ? events.slice(0, 8)
    : [
        {
          type: "applied",
          date: application.applied_at,
          label: "Application submitted",
        },
      ];
  return (
    <section className="overflow-hidden rounded-2xl border border-black/10 bg-amal-white">
      <div className="border-b border-black/5 px-5 py-4">
        <h2 className="text-lg font-bold">Activity Timeline</h2>
        <p className="text-sm text-zinc-500">Recent application milestones</p>
      </div>
      <div className="p-5">
        <ul>
          {visible.map((event, index) => {
            const isLast = index === visible.length - 1;
            return (
              <li
                key={`${event.type}-${event.date ?? index}-${event.label}`}
                className="relative flex gap-4 pb-5 pl-1"
              >
                {!isLast ? (
                  <span className="absolute left-[7px] top-3 h-full w-px bg-zinc-200" />
                ) : null}
                <span className="relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-amal-white bg-amal-red shadow-sm" />
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-semibold">{event.label}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {formatDateTime(event.date)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

const VIDEO_COMPETENCIES: Array<{
  key:
    | "communication"
    | "responsiveness"
    | "problem_solving"
    | "technical"
    | "ownership";
  label: string;
}> = [
  { key: "communication", label: "Communication" },
  { key: "responsiveness", label: "Responsiveness" },
  { key: "problem_solving", label: "Problem Solving" },
  { key: "technical", label: "Technical Understanding" },
  { key: "ownership", label: "Ownership / Initiative" },
];

function getCompetencyTone(score: number | null | undefined) {
  if (score == null) {
    return {
      bg: "bg-amal-sheet/80",
      border: "border-black/10",
      text: "text-zinc-600",
      bar: "bg-zinc-300",
    };
  }
  if (score >= 8) {
    return {
      bg: "bg-emerald-50/80",
      border: "border-emerald-200/80",
      text: "text-emerald-700",
      bar: "bg-emerald-500",
    };
  }
  if (score >= 6) {
    return {
      bg: "bg-amber-50/80",
      border: "border-amber-200/80",
      text: "text-amber-700",
      bar: "bg-amber-500",
    };
  }
  return {
    bg: "bg-amal-red/10",
    border: "border-amal-red/20",
    text: "text-amal-red",
    bar: "bg-amal-red",
  };
}

function AiVideoEvaluationPanel({
  evaluation,
  score,
  ready,
  analyzing,
  showActions = true,
  onRunAnalysis,
}: {
  evaluation: VideoEvaluation | null;
  score: number | null;
  ready: boolean;
  analyzing: boolean;
  showActions?: boolean;
  onRunAnalysis: () => void;
}) {
  const overallTone = getScoreTone(score);
  const status = evaluation?.processing_status;
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
  const hasResults = score != null && competencyRows.some((row) => row.score != null);
  const transcripts = evaluation?.transcripts ?? [];

  return (
    <section className="overflow-hidden rounded-2xl border border-teal-200/70 bg-amal-white shadow-sm shadow-teal-100/50">
      <div className="border-b border-teal-100 bg-gradient-to-r from-teal-50 via-amal-white to-teal-50/60 px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-600 text-amal-white shadow-md shadow-teal-500/30">
              <VideoIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-900">
                  AI Video Evaluation
                </h2>
                {status && VIDEO_EVAL_STATUS_BADGE[status] ? (
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                      VIDEO_EVAL_STATUS_BADGE[status].className,
                    )}
                  >
                    {VIDEO_EVAL_STATUS_BADGE[status].label}
                  </span>
                ) : status ? (
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-700">
                    {status}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-zinc-600">
                Scores are generated from video answer transcripts against the
                role requirements.
              </p>
            </div>
          </div>
          {showActions ? (
            <PrimaryButton
              type="button"
              disabled={!ready || analyzing}
              onClick={onRunAnalysis}
            >
              {analyzing
                ? "Evaluating..."
                : hasResults
                  ? "Re-run Evaluation"
                  : "Run Evaluation"}
            </PrimaryButton>
          ) : null}
        </div>
      </div>
      <div className="space-y-5 p-5">
        {!showActions || ready ? null : (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Complete the full pre-screening assessment (first test, video, and
            questionnaire) before running AI video evaluation.
          </p>
        )}
        {evaluation?.error_message ? (
          <p className="rounded-xl border border-amal-red/30 bg-amal-red/10 px-3 py-2 text-sm text-amal-red">
            {evaluation.error_message}
          </p>
        ) : null}
        <div className="grid gap-5 lg:grid-cols-[200px_minmax(0,1fr)]">
          <div
            className={cn(
              "flex flex-col justify-center rounded-2xl border p-5 text-center",
              overallTone.border,
              overallTone.bg,
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Overall Score
            </p>
            <p
              className={cn(
                "mt-2 text-5xl font-bold tracking-tight",
                overallTone.text,
              )}
            >
              {score != null ? Math.round(score) : "—"}
            </p>
            {score != null ? (
              <p className={cn("mt-1 text-sm font-medium", overallTone.text)}>
                out of 100
              </p>
            ) : (
              <p className="mt-2 text-xs leading-5 text-zinc-500">
                {showActions
                  ? "Run evaluation after pre-screening is complete."
                  : "No AI video evaluation yet."}
              </p>
            )}
          </div>
          <div className="space-y-3">
            {hasResults ? (
              competencyRows.map((row) => {
                const tone = getCompetencyTone(row.score);
                const pct =
                  row.score != null
                    ? Math.min(100, Math.max(0, (row.score / 10) * 100))
                    : 0;
                return (
                  <article
                    key={row.key}
                    className={cn(
                      "rounded-2xl border p-4",
                      tone.border,
                      tone.bg,
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-zinc-900">
                          {row.label}
                        </p>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-amal-white/70">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              tone.bar,
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p
                          className={cn(
                            "text-2xl font-bold tabular-nums",
                            tone.text,
                          )}
                        >
                          {row.score != null ? row.score : "—"}
                        </p>
                        <p className="text-[11px] font-medium text-zinc-500">
                          / 10
                        </p>
                      </div>
                    </div>
                    {row.reason.trim() ? (
                      <p className="mt-3 whitespace-pre-wrap rounded-xl border border-amal-white/60 bg-amal-white/60 px-3 py-2.5 text-sm leading-6 text-zinc-700">
                        {row.reason}
                      </p>
                    ) : (
                      <p className="mt-3 text-xs text-zinc-500">
                        No rationale available yet.
                      </p>
                    )}
                  </article>
                );
              })
            ) : (
              <p className="rounded-2xl border border-dashed border-black/10 bg-amal-sheet/60 px-4 py-8 text-center text-sm text-zinc-600">
                Competency breakdown will appear here once evaluation completes.
              </p>
            )}
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
                  className="group rounded-2xl border border-black/10 bg-amal-sheet/50 open:bg-amal-white"
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
      </div>
    </section>
  );
}

function FeedbackPanel({
  items,
  headerAction,
  emptyStateAction,
}: {
  items: Array<{ label: string; value: string }>;
  headerAction?: ReactNode;
  emptyStateAction?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-black/10 bg-amal-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/5 px-5 py-4">
        <div>
          <h2 className="text-lg font-bold">Interview Feedback</h2>
          <p className="text-sm text-zinc-500">
            HR, manager, and reviewer comments
          </p>
        </div>
        {headerAction}
      </div>
      <div className="space-y-3 p-5">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/15 bg-amal-sheet/70 px-4 py-8 text-center">
            <MessageSquareIcon className="mx-auto h-8 w-8 text-zinc-300" />
            <p className="mt-3 text-sm font-medium text-zinc-600">
              No feedback submitted yet
            </p>
            {emptyStateAction ? (
              <div className="mt-4 flex justify-center">{emptyStateAction}</div>
            ) : null}
          </div>
        ) : (
          items.map((item) => (
            <TextBlock
              key={`${item.label}-${item.value.slice(0, 40)}`}
              label={item.label}
              value={item.value}
            />
          ))
        )}
      </div>
    </section>
  );
}

function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null) {
    return "—";
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) {
    return "—";
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
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

function VideoResponsesPanel({
  responses,
  selectedIndex,
  onSelect,
}: {
  responses: {
    order: number;
    prompt: string;
    transcript: string;
    video?: string | null;
    duration_seconds?: number | null;
    file_size_bytes?: number | null;
    recorded_at?: string | null;
    uploaded_at?: string | null;
  }[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const selected = responses[selectedIndex] ?? responses[0] ?? null;
  const videoUrl = mediaUrl(selected?.video);
  const [playbackDuration, setPlaybackDuration] = useState<number | null>(null);
  const [trackedVideoUrl, setTrackedVideoUrl] = useState(videoUrl);
  if (trackedVideoUrl !== videoUrl) {
    setTrackedVideoUrl(videoUrl);
    setPlaybackDuration(null);
  }

  const durationSeconds =
    selected?.duration_seconds ?? playbackDuration ?? null;

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
          <p className="mt-1 max-w-sm text-xs text-zinc-500">
            Completed video test answers will appear here for playback and
            review.
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
            <div className="aspect-video bg-amal-black">
              {videoUrl ? (
                <video
                  key={videoUrl}
                  src={videoUrl}
                  controls
                  preload="metadata"
                  className="h-full w-full object-contain"
                  onLoadedMetadata={(event) => {
                    const duration = event.currentTarget.duration;
                    setPlaybackDuration(
                      Number.isFinite(duration) ? duration : null,
                    );
                  }}
                >
                  <track kind="captions" />
                </video>
              ) : (
                <div className="flex h-full items-center justify-center text-amal-white/70">
                  No video file available
                </div>
              )}
            </div>
            {selected ? (
              <div className="space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900">
                      Question {selected.order}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">
                      {selected.prompt}
                    </p>
                  </div>
                  {videoUrl ? (
                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-black/15 bg-amal-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-amal-sheet"
                    >
                      <ExternalLinkIcon className="h-3.5 w-3.5" />
                      Open Video
                    </a>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  <VideoMetaChip
                    label="Size"
                    value={formatFileSize(selected.file_size_bytes)}
                  />
                  <VideoMetaChip
                    label="Duration"
                    value={formatDuration(durationSeconds)}
                  />
                  <VideoMetaChip
                    label="Recorded"
                    value={formatDate(
                      selected.recorded_at ?? selected.uploaded_at,
                    )}
                  />
                  <VideoMetaChip
                    label="Uploaded"
                    value={formatDate(selected.uploaded_at)}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
