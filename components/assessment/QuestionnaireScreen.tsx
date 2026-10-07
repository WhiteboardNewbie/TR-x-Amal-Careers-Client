"use client";

import { useEffect, useState } from "react";
import { MessageSquareIcon } from "@/components/staff/icons";
import {
  answerQuestionnaire,
  completeQuestionnaire,
  startQuestionnaire,
  type QuestionnaireItem,
} from "@/lib/public-api";
import {
  AssessmentExpiredCard,
  isAssessmentLinkExpiredOrInvalid,
} from "./AssessmentExpiredCard";
import {
  AlertCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LoaderIcon,
} from "./icons";
import { TestBackdrop } from "./TestBackdrop";
import { errorText } from "./shared";

export function QuestionnaireScreen({
  token,
  onComplete,
}: {
  token: string;
  onComplete: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState<QuestionnaireItem[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [attachments, setAttachments] = useState<Record<number, File | null>>(
    {},
  );
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const current = items[index];
  const total = items.length;
  const answeredCount = items.filter(
    (q) => answers[q.id]?.trim() || attachments[q.id],
  ).length;

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const rows = await startQuestionnaire(token);
        if (ignore) return;
        setItems(rows);
        setIndex(0);
      } catch (err) {
        if (!ignore) setError(errorText(err));
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [token]);

  async function saveCurrent() {
    if (!current) return;
    const text = answers[current.id] ?? "";
    const file = attachments[current.id] ?? null;
    if (!text.trim() && !file) return;
    setSubmittingAnswer(true);
    try {
      await answerQuestionnaire(token, current.id, text, file);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSubmittingAnswer(false);
    }
  }

  async function handleNext() {
    await saveCurrent();
    setIndex((i) => Math.min(total - 1, i + 1));
  }

  async function handlePrevious() {
    await saveCurrent();
    setIndex((i) => Math.max(0, i - 1));
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      for (const q of items) {
        const text = answers[q.id] ?? "";
        const file = attachments[q.id] ?? null;
        if (text.trim() || file) {
          await answerQuestionnaire(token, q.id, text, file);
        }
      }
      await completeQuestionnaire(token);
      onComplete();
    } catch (err) {
      setError(errorText(err));
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  }

  if (loading) return <TestBackdrop message="Loading questionnaire..." />;
  if (error && isAssessmentLinkExpiredOrInvalid(error) && items.length === 0) {
    return <AssessmentExpiredCard message={error} />;
  }
  if (error && items.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amal-sheet p-4">
        <div className="w-full max-w-md rounded-lg bg-amal-white p-8 text-center shadow-xl">
          <AlertCircleIcon className="mx-auto mb-4 h-10 w-10 text-amal-red" />
          <h2 className="mb-2 text-2xl font-bold">Error</h2>
          <p className="text-zinc-600">{error}</p>
        </div>
      </div>
    );
  }
  if (!current) return null;

  const isLast = index >= total - 1;

  return (
    <div className="min-h-screen bg-amal-sheet">
      <div className="sticky top-0 z-10 border-b border-black/10 bg-amal-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-amal-ink">
              General Questionnaire
            </h1>
            <div className="flex items-center rounded-lg bg-amal-red/10 px-4 py-2">
              <MessageSquareIcon className="mr-2 h-5 w-5 text-amal-red" />
              <span className="font-semibold text-amal-red">
                {index + 1}/{total}
              </span>
            </div>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full bg-amal-red transition-all"
              style={{ width: `${total ? (answeredCount / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {error ? (
          <p className="mb-4 rounded-lg border border-amal-red/30 bg-amal-red/10 px-3 py-2 text-sm text-amal-red">
            {error}
          </p>
        ) : null}
        <div className="rounded-lg bg-amal-white p-6 shadow-sm md:p-8">
          <h2 className="mb-4 text-lg font-semibold text-amal-ink">
            Question {current.question_order}
          </h2>
          <p className="mb-6 text-zinc-700">{current.question_text}</p>

          <div className="mb-6">
            <label
              htmlFor={`question-answer-${current.id}`}
              className="mb-2 block text-sm font-medium text-zinc-700"
            >
              Your Answer
            </label>
            <textarea
              id={`question-answer-${current.id}`}
              value={answers[current.id] ?? ""}
              onChange={(e) =>
                setAnswers((prev) => ({
                  ...prev,
                  [current.id]: e.target.value,
                }))
              }
              rows={6}
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-amal-ink focus:border-amal-red focus:outline-none focus:ring-2 focus:ring-amal-red/20"
              placeholder="Type your response here..."
            />
          </div>

          <div className="mb-8">
            <label
              htmlFor={`question-attachment-${current.id}`}
              className="mb-2 block text-sm font-medium text-zinc-700"
            >
              Attachment (optional)
            </label>
            <input
              id={`question-attachment-${current.id}`}
              type="file"
              accept="image/*,.pdf"
              onChange={(e) =>
                setAttachments((prev) => ({
                  ...prev,
                  [current.id]: e.target.files?.[0] ?? null,
                }))
              }
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm text-zinc-700 file:mr-4 file:rounded file:border-0 file:bg-amal-sheet file:px-4 file:py-2 file:text-sm file:font-medium"
            />
            {attachments[current.id] ? (
              <p className="mt-1 text-xs text-zinc-500">
                Selected: {attachments[current.id]?.name}
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-between border-t pt-6">
            <button
              type="button"
              onClick={() => void handlePrevious()}
              disabled={index <= 0 || submittingAnswer}
              className="flex items-center rounded-lg border border-black/15 px-4 py-2 text-zinc-700 hover:bg-amal-sheet disabled:opacity-50"
            >
              <ChevronLeftIcon className="mr-1 h-5 w-5" />
              Previous
            </button>
            {isLast ? (
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                disabled={isSubmitting || submittingAnswer}
                className="rounded-lg bg-green-600 px-6 py-2 font-semibold text-amal-white hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <LoaderIcon className="h-4 w-4 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  "Submit Questionnaire"
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleNext()}
                disabled={submittingAnswer}
                className="flex items-center rounded-lg bg-amal-red px-4 py-2 font-semibold text-amal-white hover:bg-amal-red/90 disabled:opacity-50"
              >
                Next
                <ChevronRightIcon className="ml-1 h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {showConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-amal-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-semibold text-amal-ink">
              Submit Questionnaire?
            </h3>
            <p className="mb-6 text-zinc-600">
              You have answered {answeredCount} of {total} questions. Once
              submitted, you cannot change your answers. Are you sure?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isSubmitting}
                className="flex-1 rounded-lg border border-black/15 px-4 py-2 text-zinc-700 hover:bg-amal-sheet"
              >
                Review Again
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-semibold text-amal-white hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
