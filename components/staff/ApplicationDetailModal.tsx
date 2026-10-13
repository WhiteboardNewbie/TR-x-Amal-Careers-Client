"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, getJobOpening, mediaUrl } from "@/lib/api";
import {
  formatExperience,
  formatPositions,
  formatTypeLabel,
} from "@/lib/format";
import { formatPhoneDisplay, phoneTelHref } from "@/lib/phone-format";
import { preventFocusScroll } from "@/lib/prevent-focus-scroll";
import {
  addComment,
  createStage,
  getApplicationStages,
  getAssessment,
  getComments,
  getDepartmentManagers,
  getEmployees,
  getStaffApplication,
  getTimeline,
} from "@/lib/staff-api";
import {
  APPLICATION_STATUSES,
  STATUS_TONE,
  labelFor,
  stageStatusBadge,
} from "@/lib/status";
import type {
  ApplicationAssessment,
  ApplicationStage,
  Comment,
  DepartmentManager,
  Employee,
  JobApplicationStatus,
  JobOpening,
  StaffApplication,
} from "@/lib/types";
import {
  AssessmentStatusBadge,
  formatAssessmentDateTime,
  getAssessmentEffectiveStatus,
  getAssessmentExpiresAt,
} from "./assessment-status";
import {
  AwardIcon,
  BriefcaseIcon,
  BuildingIcon,
  CalendarIcon,
  ChecksIcon,
  ClockIcon,
  ExternalLinkIcon,
  FileSearchIcon,
  MailIcon,
  MapPinIcon,
  MessageSquareIcon,
  PhoneIcon,
  PlusIcon,
  SendIcon,
  SparklesIcon,
  UserIcon,
  UsersIcon,
} from "./icons";
import {
  CenteredOverlay,
  GhostButton,
  ModalCloseButton,
  PrimaryButton,
  inputClass,
} from "./ui";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

const WORK_TYPE_LABEL: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "Onsite",
};

const EMPLOYMENT_LABEL: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  "contract": "Contract",
  internship: "Internship",
};

const COMMENT_SOURCE_LABEL: Record<string, string> = {
  general: "General",
  video_test: "Video test",
  general_questionnaire: "Questionnaire",
};

type DetailTab =
  | "job"
  | "applicant"
  | "assessment"
  | "stages"
  | "comments"
  | "timeline";

const TABS: {
  key: DetailTab;
  label: string;
  icon: typeof BriefcaseIcon;
}[] = [
  { key: "job", label: "Job Details", icon: BriefcaseIcon },
  { key: "applicant", label: "Applicant Info", icon: UserIcon },
  { key: "assessment", label: "Assessment", icon: AwardIcon },
  { key: "stages", label: "Stages", icon: ChecksIcon },
  { key: "comments", label: "Comments", icon: MessageSquareIcon },
  { key: "timeline", label: "Timeline", icon: ClockIcon },
];

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

function formatScore(value: string | number | null | undefined): string | null {
  if (value == null || value === "") {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${numeric.toFixed(0)}%` : null;
}

function Description({ text }: { text: string }) {
  if (/<[a-z][\s\S]*>/i.test(text)) {
    return (
      <div
        className="text-sm leading-relaxed text-zinc-600 [&_a]:text-amal-red [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  }
  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">
      {text || "—"}
    </p>
  );
}

function sessionCompleted(
  session: StaffApplication["test_session"] | undefined,
): boolean {
  return getAssessmentEffectiveStatus(session) === "completed";
}

function commentSourceLabel(source: string): string {
  return COMMENT_SOURCE_LABEL[source] ?? formatTypeLabel(source);
}

function employeeNameByUserId(employees: Employee[], userId: number | null) {
  if (userId == null) {
    return "Unknown";
  }
  const match = employees.find((row) => row.user === userId);
  return match?.full_name?.trim() || `Staff #${userId}`;
}

function employeeNameById(employees: Employee[], employeeId: number) {
  return employees.find((row) => row.id === employeeId)?.full_name?.trim();
}

export function ApplicationDetailModal({
  applicationId,
  statusUpdating = false,
  refreshKey = 0,
  onClose,
  onApplyStatus,
  onPersistReturn,
}: {
  applicationId: number;
  statusUpdating?: boolean;
  refreshKey?: number;
  onClose: () => void;
  onApplyStatus: (
    application: StaffApplication,
    status: JobApplicationStatus,
  ) => void;
  onPersistReturn?: () => void;
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
  const [managers, setManagers] = useState<DepartmentManager[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [statusDraft, setStatusDraft] = useState<string | null>(null);
  const [addStageOpen, setAddStageOpen] = useState(false);
  const [addStageManagerId, setAddStageManagerId] = useState("");
  const [addStageName, setAddStageName] = useState("");
  const [addStageNotes, setAddStageNotes] = useState("");
  const [addStageSubmitting, setAddStageSubmitting] = useState(false);
  const [selectedStage, setSelectedStage] = useState<ApplicationStage | null>(
    null,
  );

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
      getAssessment(applicationId).catch(() => null),
      getEmployees().catch(() => [] as Employee[]),
    ])
      .then(async ([app, stagePage, commentPage, events, assessmentDetail, staff]) => {
        if (ignore) {
          return;
        }
        setApplication(app);
        setStages(stagePage.results);
        setComments(commentPage.results);
        setTimeline(events);
        setAssessment(assessmentDetail);
        setEmployees(staff);
        const role = await getJobOpening(app.job_opening);
        if (ignore) {
          return;
        }
        setOpening(role);
        const departmentManagers = await getDepartmentManagers(role.department);
        if (!ignore) {
          setManagers(departmentManagers);
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
  }, [applicationId, refreshKey]);

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

  async function submitStage() {
    if (!addStageManagerId) {
      return;
    }
    setAddStageSubmitting(true);
    try {
      const created = await createStage(applicationId, {
        assigned_to: Number(addStageManagerId),
        name: addStageName.trim() || undefined,
        hr_notes: addStageNotes.trim() || undefined,
      });
      setStages((current) => [...current, created]);
      setAddStageOpen(false);
      setAddStageManagerId("");
      setAddStageName("");
      setAddStageNotes("");
    } catch (error) {
      setNotice(errorText(error));
    } finally {
      setAddStageSubmitting(false);
    }
  }

  function applyNext(status: JobApplicationStatus) {
    if (!application || status === application.status) {
      return;
    }
    onApplyStatus(application, status);
    if (
      status !== "rejected" &&
      status !== "manager-review" &&
      status !== "client-review"
    ) {
      setApplication((current) =>
        current ? { ...current, status } : current,
      );
    }
  }

  const resumeHref = application ? mediaUrl(application.resume) : null;
  const phoneHref = application
    ? phoneTelHref(application.applicant.contact)
    : null;
  const employmentLine = [
    opening?.employment_type
      ? (EMPLOYMENT_LABEL[opening.employment_type] ??
        formatTypeLabel(opening.employment_type))
      : null,
    opening?.work_type
      ? (WORK_TYPE_LABEL[opening.work_type] ??
        formatTypeLabel(opening.work_type))
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const requestedBy = (opening?.client_users ?? [])
    .map(
      (user) =>
        [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
        user.email,
    )
    .filter(Boolean)
    .join(", ");
  const openingStatus = opening
    ? opening.is_draft
      ? "Draft"
      : opening.is_active
        ? "Active"
        : "Closed"
    : null;
  const managerNameById = new Map(managers.map((row) => [row.id, row.full_name]));
  const stageNameById = new Map(stages.map((stage) => [stage.id, stage.name]));
  const expiresAt = application ? getAssessmentExpiresAt(application) : null;
  const firstScore =
    formatScore(application?.test_session?.score_percentage) ??
    formatScore(assessment?.first_test?.score_percentage);
  const videoScore = formatScore(assessment?.video_test?.score_percentage);
  const questionnaireScore = formatScore(
    assessment?.questionnaire?.score_percentage,
  );
  const managerScore = formatScore(application?.manager_score_avg);
  const aiScore =
    application?.ai_relevance_score == null
      ? null
      : `${application.ai_relevance_score}%`;

  function managerLabel(employeeId: number) {
    return (
      managerNameById.get(employeeId) ??
      employeeNameById(employees, employeeId) ??
      "—"
    );
  }

  const assessmentCards = application
    ? (
        [
          {
            title: "First Test",
            session: application.test_session,
            href: `/staff/applications/${application.id}/results/first-test`,
            score: firstScore,
          },
          {
            title: "Video Test",
            session: application.video_test_session,
            href: `/staff/applications/${application.id}/results/video`,
            score: videoScore,
          },
          {
            title: "General Questionnaire",
            session: application.general_questionnaire_session,
            href: `/staff/applications/${application.id}/results/questionnaire`,
            score: questionnaireScore,
          },
        ] as const
      ).filter((item) => item.session)
    : [];

  return (
    <CenteredOverlay
      onClose={onClose}
      zClass="z-40"
      backdropClassName="bg-amal-black/60 backdrop-blur-sm"
    >
      <div
        className="pointer-events-auto flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-amal-white shadow-2xl"
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
                    {opening?.title ?? application.job_opening_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_TONE[application.status]}`}
                >
                  {labelFor(application.status)}
                </span>
                <ModalCloseButton tone="onDark" onClick={onClose} />
              </div>
            </div>
            <div className="shrink-0 border-b border-black/10 px-6">
              <div className="flex gap-1 overflow-x-auto">
                {TABS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onMouseDown={preventFocusScroll}
                      onClick={() => setTab(item.key)}
                      className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium ${
                        tab === item.key
                          ? "border-b-2 border-amal-red text-amal-red"
                          : "border-b-2 border-transparent text-zinc-500 hover:border-zinc-300 hover:text-amal-ink"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {notice ? (
                <p className="mb-4 rounded-lg border border-amal-red/30 px-3 py-2 text-sm text-amal-red">
                  {notice}
                </p>
              ) : null}
              {tab === "job" ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold">Position Information</h3>
                    <div className="space-y-3 rounded-xl bg-amal-sheet p-4">
                      <div className="flex items-center gap-3">
                        <BriefcaseIcon className="h-5 w-5 shrink-0 text-zinc-400" />
                        <div>
                          <p className="text-xs text-zinc-500">Job Title</p>
                          <p className="text-sm font-semibold">
                            {opening?.title ?? application.job_opening_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <BuildingIcon className="h-5 w-5 shrink-0 text-zinc-400" />
                        <div>
                          <p className="text-xs text-zinc-500">Department</p>
                          <p className="text-sm font-semibold">
                            {opening?.department_name || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPinIcon className="h-5 w-5 shrink-0 text-zinc-400" />
                        <div>
                          <p className="text-xs text-zinc-500">Location</p>
                          <p className="text-sm font-semibold">
                            {opening?.location || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <ClockIcon className="h-5 w-5 shrink-0 text-zinc-400" />
                        <div>
                          <p className="text-xs text-zinc-500">
                            Employment Type
                          </p>
                          <p className="text-sm font-semibold">
                            {employmentLine || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <AwardIcon className="h-5 w-5 shrink-0 text-zinc-400" />
                        <div>
                          <p className="text-xs text-zinc-500">
                            Experience Level
                          </p>
                          <p className="text-sm font-semibold">
                            {formatExperience(opening?.experience_level)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <UsersIcon className="h-5 w-5 shrink-0 text-zinc-400" />
                        <div>
                          <p className="text-xs text-zinc-500">Openings</p>
                          <p className="text-sm font-semibold">
                            {formatPositions(opening?.positions)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <CalendarIcon className="h-5 w-5 shrink-0 text-zinc-400" />
                        <div>
                          <p className="text-xs text-zinc-500">Applied</p>
                          <p className="text-sm font-semibold">
                            {formatDateTime(application.applied_at)}
                          </p>
                        </div>
                      </div>
                      {openingStatus ? (
                        <div className="flex items-center gap-3">
                          <BriefcaseIcon className="h-5 w-5 shrink-0 text-zinc-400" />
                          <div>
                            <p className="text-xs text-zinc-500">Role status</p>
                            <p className="text-sm font-semibold">
                              {openingStatus}
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                    {requestedBy ? (
                      <p className="text-sm text-zinc-500">
                        Requested by: {requestedBy}
                      </p>
                    ) : null}
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-zinc-700">
                        Required Skills
                      </h4>
                      {opening?.skills.length ? (
                        <div className="flex flex-wrap gap-2">
                          {opening.skills.map((skill) => (
                            <span
                              key={skill.id}
                              className="rounded-full bg-amal-red/10 px-3 py-1 text-xs font-medium text-amal-red"
                            >
                              {skill.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-500">None listed.</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="mb-3 text-lg font-bold">
                        Job Description
                      </h3>
                      <div className="rounded-xl bg-amal-sheet p-4">
                        <Description text={opening?.description ?? ""} />
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-zinc-700">
                        Qualifications
                      </h4>
                      <p className="whitespace-pre-wrap rounded-xl bg-amal-sheet p-4 text-sm leading-relaxed text-zinc-600">
                        {opening?.qualifications?.trim() || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
              {tab === "applicant" ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <h3 className="mb-3 text-lg font-bold">
                      Contact Information
                    </h3>
                    <div className="space-y-3 rounded-xl bg-amal-sheet p-4">
                      <div className="flex items-center gap-3">
                        <UserIcon className="h-5 w-5 shrink-0 text-zinc-400" />
                        <div>
                          <p className="text-xs text-zinc-500">Full Name</p>
                          <p className="text-sm font-semibold">
                            {application.applicant.name || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MailIcon className="h-5 w-5 shrink-0 text-zinc-400" />
                        <div>
                          <p className="text-xs text-zinc-500">Email</p>
                          <a
                            href={`mailto:${application.applicant.email}`}
                            className="text-sm font-semibold text-amal-ink underline-offset-2 hover:underline hover:text-amal-blue"
                          >
                            {application.applicant.email}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPinIcon className="h-5 w-5 shrink-0 text-zinc-400" />
                        <div>
                          <p className="text-xs text-zinc-500">City</p>
                          <p className="text-sm font-semibold">
                            {application.applicant.city || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <PhoneIcon className="h-5 w-5 shrink-0 text-zinc-400" />
                        <div>
                          <p className="text-xs text-zinc-500">Contact</p>
                          {phoneHref ? (
                            <a
                              href={phoneHref}
                              className="text-sm font-semibold text-amal-ink underline-offset-2 hover:underline hover:text-amal-blue"
                            >
                              {formatPhoneDisplay(
                                application.applicant.contact,
                              )}
                            </a>
                          ) : (
                            <p className="text-sm font-semibold">
                              {formatPhoneDisplay(
                                application.applicant.contact,
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold">Application Documents</h3>
                    {resumeHref ? (
                      <a
                        href={resumeHref}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-xl bg-amal-sheet p-4 hover:bg-zinc-100"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amal-red/10">
                          <FileSearchIcon className="h-5 w-5 text-amal-red" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">Resume</p>
                          <p className="text-xs text-zinc-500">
                            View uploaded resume
                          </p>
                        </div>
                        <ExternalLinkIcon className="h-4 w-4 shrink-0 text-zinc-400" />
                      </a>
                    ) : (
                      <p className="text-sm text-zinc-500">No resume uploaded.</p>
                    )}
                    <div className="rounded-xl bg-amal-sheet p-4">
                      <p className="mb-2 text-sm font-semibold">Cover Letter</p>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">
                        {application.cover_letter?.trim() ||
                          "No cover letter submitted."}
                      </p>
                    </div>
                    <div className="rounded-xl bg-amal-sheet p-4">
                      <p className="mb-2 text-sm font-semibold">
                        Application notes
                      </p>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">
                        {application.notes?.trim() || "No notes on this application."}
                      </p>
                    </div>
                    {application.applicant.notes?.trim() ? (
                      <div className="rounded-xl bg-amal-sheet p-4">
                        <p className="mb-2 text-sm font-semibold">
                          Applicant notes
                        </p>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">
                          {application.applicant.notes}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
              {tab === "assessment" ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Assessment Results</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-xl bg-amal-sheet p-4">
                      <p className="mb-1 text-xs text-zinc-500">Invite</p>
                      {assessment?.invite_url ? (
                        <a
                          href={assessment.invite_url}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all text-sm font-semibold text-amal-red hover:underline"
                        >
                          Open invite link
                        </a>
                      ) : (
                        <p className="text-sm font-semibold">Not sent</p>
                      )}
                    </div>
                    <div className="rounded-xl bg-amal-sheet p-4">
                      <p className="mb-1 text-xs text-zinc-500">Expires</p>
                      <p className="text-sm font-semibold">
                        {formatAssessmentDateTime(
                          expiresAt ?? assessment?.expires_at,
                        )}
                      </p>
                    </div>
                    <div className="rounded-xl bg-amal-sheet p-4">
                      <div className="mb-1 flex items-center gap-1.5 text-xs text-zinc-500">
                        <SparklesIcon className="h-3.5 w-3.5" />
                        AI Resume Evaluation
                      </div>
                      <p className="text-sm font-semibold">{aiScore ?? "—"}</p>
                      {application.ai_relevance_analyzed_at ? (
                        <p className="mt-1 text-xs text-zinc-500">
                          Analyzed{" "}
                          {formatDateTime(application.ai_relevance_analyzed_at)}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-zinc-500">
                          Not analyzed yet
                        </p>
                      )}
                    </div>
                    {managerScore ? (
                      <div className="rounded-xl bg-amal-sheet p-4">
                        <p className="mb-1 text-xs text-zinc-500">
                          Manager score average
                        </p>
                        <p className="text-sm font-semibold">{managerScore}</p>
                      </div>
                    ) : null}
                  </div>
                  {application.ai_relevance_rationale?.trim() ? (
                    <div className="rounded-xl bg-amal-sheet p-4">
                      <p className="mb-2 text-sm font-semibold">
                        AI resume rationale
                      </p>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">
                        {application.ai_relevance_rationale}
                      </p>
                    </div>
                  ) : null}
                  {assessmentCards.length ? (
                    <div className="grid gap-4 md:grid-cols-3">
                      {assessmentCards.map((item) => {
                        const status = getAssessmentEffectiveStatus(
                          item.session,
                        );
                        return (
                          <div
                            key={item.title}
                            className="rounded-xl bg-amal-sheet p-4"
                          >
                            <p className="mb-2 text-xs text-zinc-500">
                              {item.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              {item.score ? (
                                <p className="text-sm font-semibold">
                                  {item.score}
                                </p>
                              ) : null}
                              <AssessmentStatusBadge
                                status={status}
                                expiresAt={item.session?.expires_at}
                              />
                            </div>
                            {item.session?.expires_at ? (
                              <p className="mt-1 text-xs text-zinc-500">
                                Expires{" "}
                                {formatAssessmentDateTime(
                                  item.session.expires_at,
                                )}
                              </p>
                            ) : null}
                            {sessionCompleted(item.session) ||
                            item.session?.test_token ? (
                              <Link
                                href={item.href}
                                className="mt-2 inline-block text-xs text-amal-red hover:underline"
                                onClick={() => onPersistReturn?.()}
                              >
                                View result
                              </Link>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500">
                      No assessment data yet.
                    </p>
                  )}
                </div>
              ) : null}
              {tab === "stages" ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-bold">Stages</h3>
                    <PrimaryButton
                      type="button"
                      className="gap-2"
                      onClick={() => setAddStageOpen(true)}
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add stage
                    </PrimaryButton>
                  </div>
                  {addStageOpen ? (
                    <div className="space-y-3 rounded-xl border border-black/10 bg-amal-sheet p-4">
                      <h4 className="text-sm font-semibold">Assign to manager</h4>
                      <div className="flex flex-wrap items-end gap-3">
                        <div>
                          <label
                            htmlFor="stage-manager"
                            className="mb-1 block text-xs text-zinc-500"
                          >
                            Manager
                          </label>
                          <select
                            id="stage-manager"
                            value={addStageManagerId}
                            onChange={(event) =>
                              setAddStageManagerId(event.target.value)
                            }
                            className={`${inputClass} min-w-[200px]`}
                          >
                            <option value="">Select Manager</option>
                            {managers.map((row) => (
                              <option key={row.id} value={row.id}>
                                {row.full_name}
                              </option>
                            ))}
                          </select>
                          {managers.length === 0 ? (
                            <p className="mt-1 text-xs text-zinc-500">
                              No department managers available for this role.
                            </p>
                          ) : null}
                        </div>
                        <div>
                          <label
                            htmlFor="stage-name"
                            className="mb-1 block text-xs text-zinc-500"
                          >
                            Stage name (optional)
                          </label>
                          <input
                            id="stage-name"
                            value={addStageName}
                            onChange={(event) =>
                              setAddStageName(event.target.value)
                            }
                            placeholder="e.g. Technical review"
                            className={`${inputClass} w-48`}
                          />
                        </div>
                        <div className="w-full">
                          <label
                            htmlFor="stage-hr-notes"
                            className="mb-1 block text-xs text-zinc-500"
                          >
                            HR notes for manager (optional)
                          </label>
                          <textarea
                            id="stage-hr-notes"
                            value={addStageNotes}
                            onChange={(event) =>
                              setAddStageNotes(event.target.value)
                            }
                            placeholder="Feedback visible to the assigned manager"
                            rows={2}
                            className={`${inputClass} h-auto max-w-md py-2`}
                          />
                        </div>
                        <PrimaryButton
                          type="button"
                          disabled={!addStageManagerId || addStageSubmitting}
                          onClick={() => void submitStage()}
                        >
                          {addStageSubmitting ? "Creating..." : "Create"}
                        </PrimaryButton>
                        <GhostButton
                          type="button"
                          onClick={() => setAddStageOpen(false)}
                        >
                          Cancel
                        </GhostButton>
                      </div>
                    </div>
                  ) : null}
                  {stages.length === 0 ? (
                    <p className="text-sm text-zinc-500">
                      No stages yet. Add a stage to assign this application to a
                      manager.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {stages.map((stage) => {
                        const badge = stageStatusBadge(stage.status);
                        return (
                          <li key={stage.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedStage(stage)}
                              className="flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border border-black/10 bg-amal-white p-4 text-left hover:bg-amal-sheet"
                            >
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="font-medium">
                                  {managerLabel(stage.assigned_to)}
                                </span>
                                {stage.name ? (
                                  <span className="text-sm text-zinc-600">
                                    ({stage.name})
                                  </span>
                                ) : null}
                                <span
                                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}
                                >
                                  {badge.label}
                                </span>
                              </div>
                              <span className="text-xs text-zinc-500">
                                {formatDate(stage.created_at)}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {selectedStage ? (
                    <div className="space-y-3 rounded-xl border border-black/10 bg-amal-sheet p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Stage details</h4>
                        <ModalCloseButton
                          onClick={() => setSelectedStage(null)}
                          aria-label="Close stage details"
                        />
                      </div>
                      <p>
                        <span className="text-zinc-500">Manager:</span>{" "}
                        {managerLabel(selectedStage.assigned_to)}
                      </p>
                      {selectedStage.name ? (
                        <p>
                          <span className="text-zinc-500">Stage name:</span>{" "}
                          {selectedStage.name}
                        </p>
                      ) : null}
                      <p>
                        <span className="text-zinc-500">Status:</span>{" "}
                        {stageStatusBadge(selectedStage.status).label}
                      </p>
                      <p>
                        <span className="text-zinc-500">Created:</span>{" "}
                        {formatDateTime(selectedStage.created_at)}
                      </p>
                      {selectedStage.assigned_by != null ? (
                        <p>
                          <span className="text-zinc-500">Assigned by:</span>{" "}
                          {employeeNameByUserId(
                            employees,
                            selectedStage.assigned_by,
                          )}
                        </p>
                      ) : null}
                      {selectedStage.completed_at ? (
                        <p>
                          <span className="text-zinc-500">Completed:</span>{" "}
                          {formatDateTime(selectedStage.completed_at)}
                        </p>
                      ) : null}
                      {selectedStage.hr_notes ? (
                        <p>
                          <span className="text-zinc-500">HR notes:</span>{" "}
                          {selectedStage.hr_notes}
                        </p>
                      ) : null}
                      {selectedStage.interview_type ? (
                        <p>
                          <span className="text-zinc-500">Interview type:</span>{" "}
                          {selectedStage.interview_type === "on_site"
                            ? "On-site"
                            : "Online"}
                        </p>
                      ) : null}
                      {selectedStage.scheduled_at ? (
                        <p>
                          <span className="text-zinc-500">Scheduled:</span>{" "}
                          {formatDateTime(selectedStage.scheduled_at)}
                        </p>
                      ) : null}
                      {selectedStage.meeting_link ? (
                        <p>
                          <span className="text-zinc-500">Link:</span>{" "}
                          <a
                            href={selectedStage.meeting_link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-amal-red hover:underline"
                          >
                            {selectedStage.meeting_link}
                          </a>
                        </p>
                      ) : null}
                      {selectedStage.status === "completed" &&
                      selectedStage.interview_feedback ? (
                        <p>
                          <span className="text-zinc-500">
                            Manager feedback:
                          </span>{" "}
                          {selectedStage.interview_feedback}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {tab === "comments" ? (
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-black/10 bg-amal-sheet px-4 py-6 text-center">
                      <MessageSquareIcon className="mx-auto h-7 w-7 text-zinc-300" />
                      <p className="mt-2 text-sm font-medium text-zinc-600">
                        No comments yet
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Be the first to add a note on this application.
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {comments.map((item) => {
                        const stageName =
                          item.application_stage != null
                            ? stageNameById.get(item.application_stage)
                            : null;
                        return (
                          <li
                            key={item.id}
                            className="rounded-xl border border-black/10 bg-amal-sheet/50 px-4 py-3"
                          >
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
                              <span className="font-semibold text-zinc-700">
                                {employeeNameByUserId(employees, item.author)}
                              </span>
                              <span aria-hidden>·</span>
                              <time dateTime={item.created_at}>
                                {formatDateTime(item.created_at)}
                              </time>
                              {item.source && item.source !== "general" ? (
                                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                                  {commentSourceLabel(item.source)}
                                </span>
                              ) : null}
                              {stageName ? (
                                <span className="rounded-full bg-amal-red/10 px-2 py-0.5 text-[11px] font-medium text-amal-red">
                                  {stageName}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-2 whitespace-pre-wrap text-sm">
                              {item.text}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <div className="space-y-2">
                    <textarea
                      className={`${inputClass} h-auto py-2`}
                      rows={3}
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Write a comment..."
                    />
                    <div className="flex justify-end">
                      <PrimaryButton
                        type="button"
                        className="gap-1.5"
                        disabled={busy || !note.trim()}
                        onClick={() => void saveComment()}
                      >
                        <SendIcon className="h-3.5 w-3.5" />
                        {busy ? "Saving..." : "Add comment"}
                      </PrimaryButton>
                    </div>
                  </div>
                </div>
              ) : null}
              {tab === "timeline" ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Timeline</h3>
                  <ul className="space-y-3">
                    {(timeline.length
                      ? timeline
                      : [
                          {
                            type: "applied",
                            date: application.applied_at,
                            label: "Application submitted",
                          },
                        ]
                    ).map((event, index) => (
                      <li
                        key={`${event.type}-${event.date ?? index}-${event.label}`}
                        className="flex gap-3"
                      >
                        <div
                          className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                            index === 0 ? "bg-amal-red" : "bg-zinc-400"
                          }`}
                        />
                        <div>
                          <p className="text-sm font-semibold">{event.label}</p>
                          {event.date ? (
                            <p className="text-xs text-zinc-500">
                              {formatDateTime(event.date)}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-black/10 bg-amal-sheet px-6 py-4">
              <div className="flex items-center gap-3">
                <label
                  htmlFor="detail-status-select"
                  className="text-sm font-medium text-zinc-700"
                >
                  Status
                </label>
                <select
                  id="detail-status-select"
                  value={statusDraft ?? application.status}
                  disabled={statusUpdating}
                  onFocus={() => {
                    if (
                      application.status === "manager-review" ||
                      application.status === "client-review"
                    ) {
                      setStatusDraft("");
                    }
                  }}
                  onBlur={() => setStatusDraft(null)}
                  onChange={(event) => {
                    setStatusDraft(null);
                    applyNext(event.target.value as JobApplicationStatus);
                  }}
                  className="rounded-lg border border-black/15 bg-amal-white px-3 py-2 text-sm"
                >
                  {statusDraft === "" ? (
                    <option value="" disabled>
                      Select status…
                    </option>
                  ) : null}
                  {APPLICATION_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {labelFor(status)}
                    </option>
                  ))}
                </select>
                {statusUpdating ? (
                  <span className="text-xs text-zinc-500">Updating...</span>
                ) : null}
              </div>
              {application.status === "new" ||
              application.status === "in-review" ? (
                <PrimaryButton
                  type="button"
                  disabled={statusUpdating}
                  onClick={() =>
                    applyNext(
                      application.status === "new"
                        ? "in-review"
                        : "manager-review",
                    )
                  }
                >
                  Next Stage
                </PrimaryButton>
              ) : null}
            </div>
          </>
        )}
      </div>
    </CenteredOverlay>
  );
}
