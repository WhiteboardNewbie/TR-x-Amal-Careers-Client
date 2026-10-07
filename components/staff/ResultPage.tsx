"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, mediaUrl } from "@/lib/api";
import { getAssessment } from "@/lib/staff-api";
import type { ApplicationAssessment, WrittenTestSection } from "@/lib/types";
import { formatAssessmentStatusLabel } from "@/components/staff/assessment-status";
import { CheckIcon, ExternalLinkIcon, XIcon } from "./icons";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/10 bg-amal-sheet/60 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-zinc-900">{value}</p>
    </div>
  );
}

function FirstTestQuestionBlock({
  question,
}: {
  question: WrittenTestSection["questions"][number];
}) {
  const options = [
    { key: "A" as const, text: question.option_a },
    { key: "B" as const, text: question.option_b },
    { key: "C" as const, text: question.option_c },
    { key: "D" as const, text: question.option_d },
  ];
  const selected = (question.selected_option || "").toUpperCase();
  const correct = (question.correct_option || "").toUpperCase();
  const isCorrect = Boolean(question.is_correct);

  return (
    <div
      className={`rounded-xl border p-4 ${
        isCorrect ? "border-emerald-200" : "border-amal-red/30"
      }`}
    >
      <div className="flex items-start gap-3">
        {isCorrect ? (
          <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        ) : (
          <XIcon className="mt-0.5 h-5 w-5 shrink-0 text-amal-red" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-zinc-900">Question {question.order}</p>
          <p className="mt-1 text-sm text-zinc-700">{question.question_text}</p>
          <div className="mt-3 space-y-2">
            {options.map(({ key, text }) => {
              const isSelected = selected === key;
              const isAnswer = correct === key;
              return (
                <div
                  key={key}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    isAnswer
                      ? "border-emerald-300 bg-emerald-50"
                      : isSelected
                        ? "border-amal-red/40 bg-amal-red/10"
                        : "border-black/10 bg-amal-sheet/60"
                  }`}
                >
                  <span className="font-semibold">{key}.</span> {text || "—"}
                  {isAnswer ? (
                    <span className="ml-2 text-xs font-semibold text-emerald-700">
                      Correct
                    </span>
                  ) : null}
                  {isSelected && !isAnswer ? (
                    <span className="ml-2 text-xs font-semibold text-amal-red">
                      Selected
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionnaireResponseBlock({
  question,
}: {
  question: WrittenTestSection["questions"][number];
}) {
  const attachmentUrl = mediaUrl(question.attachment);
  const isImage = attachmentUrl?.match(/\.(jpg|jpeg|png|gif|webp)($|\?)/i);

  return (
    <div className="rounded-xl border border-black/10 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amal-ink text-sm font-semibold text-amal-white">
          {question.order}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-zinc-900">{question.question_text}</h3>
          <div className="mt-3 rounded-lg bg-amal-sheet/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Answer
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
              {question.answer_text?.trim() || "No answer provided"}
            </p>
          </div>
          {attachmentUrl ? (
            <div className="mt-3 space-y-2">
              {isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={attachmentUrl}
                  alt={`Attachment for question ${question.order}`}
                  className="max-h-64 rounded-lg border border-black/10 object-contain"
                />
              ) : null}
              <a
                href={attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-amal-red"
              >
                <ExternalLinkIcon className="h-3.5 w-3.5" />
                View attachment
              </a>
            </div>
          ) : null}
          {question.answered_at ? (
            <p className="mt-2 text-xs text-zinc-500">
              Answered {formatDate(question.answered_at)}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ResultPage({
  id,
  kind,
  onClose,
  assessment: assessmentProp,
  onSelectVideo,
}: {
  id: number;
  kind: "first-test" | "video" | "questionnaire";
  onClose?: () => void;
  assessment?: ApplicationAssessment | null;
  onSelectVideo?: (index: number) => void;
}) {
  const [fetchedAssessment, setFetchedAssessment] =
    useState<ApplicationAssessment | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (assessmentProp) {
      return;
    }
    let ignore = false;
    getAssessment(id)
      .then((data) => {
        if (!ignore) {
          setFetchedAssessment(data);
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
  }, [id, assessmentProp]);

  const assessment = assessmentProp ?? fetchedAssessment;
  const title =
    kind === "first-test"
      ? "First Test Answers"
      : kind === "video"
        ? "Video result"
        : "Questionnaire Answers";
  const firstTest = assessment?.first_test ?? null;
  const questionnaire = assessment?.questionnaire ?? null;
  const videoTest = assessment?.video_test ?? null;
  const videoQuestions = videoTest?.questions ?? [];
  const hasSection =
    kind === "first-test"
      ? Boolean(firstTest)
      : kind === "questionnaire"
        ? Boolean(questionnaire)
        : Boolean(videoTest);

  return (
    <div>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-semibold text-amal-red"
        >
          Close
        </button>
      ) : (
        <Link
          href={`/staff/applications/${id}`}
          className="text-sm font-semibold text-amal-red"
        >
          ← Application
        </Link>
      )}
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">{title}</h1>
      {notice ? (
        <p className="mt-4 text-sm text-amal-red">{notice}</p>
      ) : null}
      {!hasSection ? (
        <p className="mt-4 text-sm text-zinc-500">
          No result yet. Send an invite from the application.
        </p>
      ) : kind === "first-test" && firstTest ? (
        <div className="mt-4 space-y-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <MetricTile
              label="Score"
              value={
                firstTest.score_percentage != null
                  ? `${Number(firstTest.score_percentage).toFixed(0)}%`
                  : "—"
              }
            />
            <MetricTile
              label="Correct"
              value={`${firstTest.correct_count ?? "—"}/${firstTest.total_questions ?? firstTest.questions.length}`}
            />
            <MetricTile
              label="Attempted"
              value={String(firstTest.attempted_count ?? "—")}
            />
            <MetricTile
              label="Status"
              value={formatAssessmentStatusLabel(firstTest.status)}
            />
          </div>
          <div className="space-y-3">
            {firstTest.questions.map((question) => (
              <FirstTestQuestionBlock key={question.order} question={question} />
            ))}
          </div>
          {videoQuestions.length > 0 && onSelectVideo ? (
            <div className="border-t border-black/5 pt-5">
              <h3 className="font-bold text-zinc-900">Video Test Questions</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Select a video to close this modal and play it in the unified
                view.
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                {videoQuestions.map((response, index) => (
                  <button
                    key={response.order}
                    type="button"
                    onClick={() => onSelectVideo(index)}
                    className="rounded-xl border border-black/10 p-4 text-left hover:bg-amal-sheet"
                  >
                    <p className="font-semibold text-zinc-900">
                      Question {response.order}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
                      {response.prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : kind === "questionnaire" && questionnaire ? (
        <div className="mt-4 space-y-4">
          {questionnaire.questions.map((question) => (
            <QuestionnaireResponseBlock
              key={question.order}
              question={question}
            />
          ))}
        </div>
      ) : videoTest ? (
        <div className="mt-4 rounded-2xl border border-black/10 bg-amal-white p-5">
          <p className="text-sm text-zinc-600">
            {formatAssessmentStatusLabel(videoTest.status)} · Score{" "}
            {videoTest.score_percentage ?? "—"}
          </p>
          <ol className="mt-4 space-y-3">
            {videoQuestions.map((row) => {
              const src = mediaUrl(row.video);
              return (
                <li key={row.order} className="text-sm">
                  <p className="font-semibold">
                    {row.order}. {row.prompt}
                  </p>
                  {src ? (
                    <video
                      key={src}
                      src={src}
                      controls
                      preload="metadata"
                      className="mt-2 aspect-video w-full rounded-xl bg-amal-black object-contain"
                    >
                      <track kind="captions" />
                    </video>
                  ) : (
                    <p className="mt-2 text-zinc-500">No video file</p>
                  )}
                  <p className="mt-2 whitespace-pre-wrap text-zinc-600">
                    {row.transcript || "No transcript yet."}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
