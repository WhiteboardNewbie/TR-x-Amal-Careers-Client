"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { getAssessment } from "@/lib/staff-api";
import type { ApplicationAssessment, WrittenTestSection } from "@/lib/types";
import {
  AssessmentResultBackNav,
  formatDateTime,
  getScoreTone,
  SectionCard,
  SectionHeader,
} from "@/components/staff/assessment-result-shared";
import {
  AwardIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  XIcon,
} from "@/components/staff/icons";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

export function FirstTestResultView({ id }: { id: number }) {
  const [assessment, setAssessment] = useState<ApplicationAssessment | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(
    () => new Set(),
  );

  const [loadedId, setLoadedId] = useState<number | null>(null);
  if (loadedId !== id) {
    setLoadedId(id);
    setAssessment(null);
    setNotice("");
    setLoading(true);
    setExpandedOrders(new Set());
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

  function toggleQuestion(order: number) {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(order)) {
        next.delete(order);
      } else {
        next.add(order);
      }
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <p className="text-sm text-zinc-500">Loading test result…</p>
      </div>
    );
  }

  const firstTest = assessment?.first_test ?? null;
  if (notice || !firstTest) {
    return (
      <div className="space-y-4 p-6">
        <AssessmentResultBackNav applicationId={id} />
        <SectionCard>
          <div className="p-6">
            <p className="text-zinc-600">
              {notice || "No first-test result yet."}
            </p>
          </div>
        </SectionCard>
      </div>
    );
  }

  const scorePct = Number(firstTest.score_percentage ?? 0);
  const tone = getScoreTone(
    Number.isFinite(scorePct) ? scorePct : 0,
  );
  const correct = firstTest.correct_count ?? 0;
  const attempted = firstTest.attempted_count ?? firstTest.questions.length;
  const total = firstTest.total_questions ?? firstTest.questions.length;
  const incorrect = Math.max(0, attempted - correct);
  const timeTaken =
    firstTest.started_at && firstTest.completed_at
      ? (() => {
          const start = new Date(firstTest.started_at).getTime();
          const end = new Date(firstTest.completed_at).getTime();
          if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
            return "—";
          }
          const mins = Math.floor((end - start) / 60000);
          const secs = Math.floor(((end - start) % 60000) / 1000);
          return `${mins}m ${secs}s`;
        })()
      : "—";
  const completedLabel = firstTest.completed_at
    ? `Completed ${formatDateTime(firstTest.completed_at)}`
    : firstTest.status === "completed"
      ? "Completed"
      : firstTest.status.replace(/_/g, " ");

  return (
    <div className="space-y-6 p-6">
      <AssessmentResultBackNav applicationId={id} />

      <SectionCard>
        <div className="p-6">
          <div className="mb-6 flex flex-col items-center text-center">
            <div
              className={`inline-flex h-16 w-16 items-center justify-center rounded-full ${tone.bg}`}
            >
              <AwardIcon className={`h-8 w-8 ${tone.text}`} />
            </div>
            <h1 className="mt-4 text-xl font-bold text-zinc-900">
              Test completed
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Result for {assessment?.applicant_name ?? "Applicant"}
            </p>
          </div>

          <div className={`rounded-xl border-2 p-6 ${tone.bg} ${tone.border}`}>
            <div className="text-center">
              <span className={`text-4xl font-bold ${tone.text}`}>
                {Number.isFinite(scorePct) ? scorePct.toFixed(0) : "—"}%
              </span>
              <p className="mt-2 text-sm font-medium text-zinc-700">
                {correct} of {total} correct
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-amal-sheet p-4">
              <div className="flex items-center gap-2 text-zinc-600">
                <CheckIcon className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-medium">Correct</span>
              </div>
              <p className="mt-1 text-xl font-bold text-zinc-900">{correct}</p>
            </div>
            <div className="rounded-xl bg-amal-sheet p-4">
              <div className="flex items-center gap-2 text-zinc-600">
                <XIcon className="h-5 w-5 text-amal-red" />
                <span className="text-sm font-medium">Incorrect</span>
              </div>
              <p className="mt-1 text-xl font-bold text-zinc-900">{incorrect}</p>
            </div>
            <div className="rounded-xl bg-amal-sheet p-4">
              <div className="flex items-center gap-2 text-zinc-600">
                <ClockIcon className="h-5 w-5 text-zinc-600" />
                <span className="text-sm font-medium">Time</span>
              </div>
              <p className="mt-1 text-xl font-bold text-zinc-900">{timeTaken}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-amal-sheet px-4 py-3">
            <span className="text-sm font-medium text-zinc-700">Position</span>
            <span className="text-sm text-zinc-900">
              {assessment?.job_title ?? "—"}
            </span>
            <span className="text-zinc-400">·</span>
            <span className="text-xs text-zinc-500">{completedLabel}</span>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionHeader title="Detailed results" />
        <div className="space-y-3 p-5">
          {firstTest.questions.map((question) => (
            <AccordionQuestion
              key={question.order}
              question={question}
              expanded={expandedOrders.has(question.order)}
              onToggle={() => toggleQuestion(question.order)}
            />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function AccordionQuestion({
  question,
  expanded,
  onToggle,
}: {
  question: WrittenTestSection["questions"][number];
  expanded: boolean;
  onToggle: () => void;
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
      className={`overflow-hidden rounded-xl border-2 ${
        isCorrect ? "border-emerald-200" : "border-amal-red/30"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-amal-sheet/60"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {isCorrect ? (
            <CheckIcon className="h-6 w-6 shrink-0 text-emerald-600" />
          ) : (
            <XIcon className="h-6 w-6 shrink-0 text-amal-red" />
          )}
          <div className="min-w-0">
            <span className="font-semibold text-zinc-900">
              Question {question.order}
            </span>
            <p className="mt-0.5 truncate text-sm text-zinc-600">
              {question.question_text}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUpIcon className="h-5 w-5 shrink-0 text-zinc-400" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 shrink-0 text-zinc-400" />
        )}
      </button>
      {expanded ? (
        <div className="border-t border-black/5 bg-amal-sheet/50 p-4">
          <p className="mb-4 font-medium text-zinc-800">
            {question.question_text}
          </p>
          <div className="space-y-2">
            {options.map(({ key, text }) => {
              const isSelected = selected === key;
              const isAnswer = correct === key;
              return (
                <div
                  key={key}
                  className={`rounded-lg border-2 p-3 ${
                    isAnswer && isSelected
                      ? "border-emerald-500 bg-emerald-50"
                      : isAnswer
                        ? "border-emerald-300 bg-emerald-50"
                        : isSelected
                          ? "border-amal-red bg-amal-red/10"
                          : "border-black/10 bg-amal-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                        isAnswer
                          ? "bg-emerald-600 text-amal-white"
                          : isSelected
                            ? "bg-amal-red text-amal-white"
                            : "bg-zinc-200 text-zinc-700"
                      }`}
                    >
                      {key}
                    </span>
                    <div className="flex-1">
                      <span className="text-zinc-800">{text || "—"}</span>
                      {isAnswer ? (
                        <span className="ml-2 text-xs font-semibold text-emerald-600">
                          Correct
                        </span>
                      ) : null}
                      {isSelected && !isAnswer ? (
                        <span className="ml-2 text-xs font-semibold text-amal-red">
                          Selected
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
