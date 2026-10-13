"use client";

import { useEffect, useState } from "react";
import { ApiError, mediaUrl } from "@/lib/api";
import { getAssessment } from "@/lib/staff-api";
import type { ApplicationAssessment, WrittenTestSection } from "@/lib/types";
import { AssessmentCommentsPanel } from "@/components/staff/AssessmentCommentsPanel";
import {
  AssessmentResultBackNav,
  formatDateTime,
  SectionCard,
  SectionHeader,
} from "@/components/staff/assessment-result-shared";
import { formatAssessmentStatusLabel } from "@/components/staff/assessment-status";
import {
  BriefcaseIcon,
  CalendarIcon,
  DownloadIcon,
  FileTextIcon,
  ImageIcon,
  MessageSquareIcon,
  UserIcon,
} from "@/components/staff/icons";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

export function QuestionnaireResultView({ id }: { id: number }) {
  const [assessment, setAssessment] = useState<ApplicationAssessment | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const [loadedId, setLoadedId] = useState<number | null>(null);
  if (loadedId !== id) {
    setLoadedId(id);
    setAssessment(null);
    setNotice("");
    setLoading(true);
  }

  useEffect(() => {
    let ignore = false;
    getAssessment(id)
      .then((data) => {
        if (!ignore) {
          setAssessment(data);
        }
      })
      .catch((error) => {
        if (!ignore) {
          setNotice(errorText(error));
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <p className="text-sm text-zinc-500">Loading questionnaire responses…</p>
      </div>
    );
  }

  const questionnaire = assessment?.questionnaire ?? null;
  if (notice || !questionnaire) {
    return (
      <div className="space-y-4 p-6">
        <AssessmentResultBackNav
          applicationId={id}
          currentLabel="Questionnaire"
        />
        <SectionCard>
          <div className="p-6">
            <p className="text-zinc-600">
              {notice || "No questionnaire responses yet."}
            </p>
          </div>
        </SectionCard>
      </div>
    );
  }

  const status = questionnaire.status;
  const statusClass =
    status === "completed"
      ? "bg-emerald-100 text-emerald-700"
      : status === "in_progress"
        ? "bg-amber-100 text-amber-700"
        : "bg-amal-sheet text-zinc-700";
  const responses = [...questionnaire.questions].sort(
    (a, b) => a.order - b.order,
  );

  return (
    <div className="space-y-6 p-6">
      <AssessmentResultBackNav
        applicationId={id}
        currentLabel="Questionnaire"
      />

      <SectionCard>
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100">
              <UserIcon className="h-7 w-7 text-violet-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900">
                {assessment?.applicant_name ?? "Applicant"}
              </h1>
              <p className="text-sm text-zinc-600">
                {assessment?.applicant_email ?? "—"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-amal-sheet px-4 py-2">
              <BriefcaseIcon className="h-4 w-4 text-zinc-500" />
              <span className="text-sm font-medium text-zinc-700">
                {assessment?.job_title ?? "—"}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-amal-sheet px-4 py-2">
              <CalendarIcon className="h-4 w-4 text-zinc-500" />
              <span className="text-sm text-zinc-700">
                {questionnaire.completed_at
                  ? formatDateTime(questionnaire.completed_at)
                  : questionnaire.started_at
                    ? `Started ${formatDateTime(questionnaire.started_at)}`
                    : responses[0]?.answered_at
                      ? formatDateTime(responses[0].answered_at)
                      : "—"}
              </span>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
            >
              {formatAssessmentStatusLabel(status)}
            </span>
          </div>
        </div>
      </SectionCard>

      <AssessmentCommentsPanel
        applicationId={id}
        source="general_questionnaire"
        sourceFilter="general_questionnaire"
        headerTitle="Reviewer comments"
        headerSubtitle="Notes about this candidate's questionnaire responses"
      />

      <SectionCard>
        <SectionHeader
          title="Candidate responses"
          subtitle={`${responses.length} question${responses.length !== 1 ? "s" : ""}`}
        />
        <div className="p-5">
          {responses.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-zinc-500">
              <MessageSquareIcon className="mb-4 h-12 w-12" />
              <p>No responses submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {responses.map((response) => (
                <ResponseBlock key={response.order} response={response} />
              ))}
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

function ResponseBlock({
  response,
}: {
  response: WrittenTestSection["questions"][number];
}) {
  const attachmentUrl = mediaUrl(response.attachment);
  const isImage = Boolean(
    attachmentUrl?.match(/\.(jpg|jpeg|png|gif|webp)($|\?)/i),
  );
  const isPdf = Boolean(attachmentUrl?.match(/\.pdf($|\?)/i));

  return (
    <div className="rounded-xl border border-black/10 p-6 hover:shadow-sm">
      <div className="flex items-start gap-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">
          {response.order}
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-zinc-900">
            {response.question_text}
          </h4>
          <div className="mt-3 rounded-lg bg-amal-sheet p-4">
            <p className="mb-2 text-sm font-medium text-zinc-600">Answer</p>
            <p className="whitespace-pre-wrap leading-relaxed text-zinc-800">
              {response.answer_text?.trim() || (
                <span className="italic text-zinc-400">No answer provided</span>
              )}
            </p>
          </div>
          {attachmentUrl ? (
            <div className="mt-4 rounded-lg border border-violet-100 bg-violet-50/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {isImage ? (
                    <ImageIcon className="h-5 w-5 text-violet-600" />
                  ) : (
                    <FileTextIcon className="h-5 w-5 text-violet-600" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-zinc-700">
                      Attachment
                    </p>
                    <p className="text-xs text-zinc-500">
                      {isPdf ? "PDF document" : isImage ? "Image file" : "File"}
                    </p>
                  </div>
                </div>
                <a
                  href={attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-amal-white hover:bg-violet-700"
                >
                  <DownloadIcon className="h-4 w-4" />
                  Download
                </a>
              </div>
              {isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={attachmentUrl}
                  alt="Response attachment"
                  className="mt-4 max-h-96 rounded-lg border border-black/10 object-contain"
                />
              ) : null}
            </div>
          ) : null}
          {response.answered_at ? (
            <p className="mt-2 text-xs text-zinc-500">
              Answered {formatDateTime(response.answered_at)}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
