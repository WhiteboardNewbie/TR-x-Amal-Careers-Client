"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckIcon, ClockIcon } from "@/components/staff/icons";
import {
  answerFirstTest,
  completeFirstTest,
  startFirstTest,
  type McqItem,
} from "@/lib/public-api";
import {
  AssessmentExpiredCard,
  isAssessmentLinkExpiredOrInvalid,
} from "./AssessmentExpiredCard";
import {
  AlertCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "./icons";
import { TestBackdrop } from "./TestBackdrop";
import { AssessmentHeaderMark, errorText, formatClock } from "./shared";

export function FirstTestScreen({
  token,
  timeLimitMinutes,
  onComplete,
}: {
  token: string;
  timeLimitMinutes: number;
  onComplete: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState<McqItem[]>([]);
  const [order, setOrder] = useState(1);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(timeLimitMinutes * 60);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSubmitted = useRef(false);

  const current = items.find((q) => q.order === order) ?? items[order - 1];
  const total = items.length;
  const answeredOrders = Object.keys(answers).map(Number);
  const answeredCount = answeredOrders.length;

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await completeFirstTest(token);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      onComplete();
    } catch (err) {
      setError(errorText(err));
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  }, [token, onComplete]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const rows = await startFirstTest(token);
        if (ignore) return;
        setItems(rows);
        setTimeRemaining(timeLimitMinutes * 60);
        setOrder(rows[0]?.order ?? 1);
      } catch (err) {
        if (ignore) return;
        setError(errorText(err));
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [token, timeLimitMinutes]);

  useEffect(() => {
    if (loading || items.length === 0 || error) return;
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (!autoSubmitted.current) {
            autoSubmitted.current = true;
            void handleSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, items.length, error, handleSubmit]);

  async function selectOption(option: string) {
    if (!current || submittingAnswer) return;
    setAnswers((prev) => ({ ...prev, [current.order]: option }));
    setSubmittingAnswer(true);
    try {
      await answerFirstTest(token, current.id, option);
    } catch (err) {
      setAnswers((prev) => {
        const next = { ...prev };
        delete next[current.order];
        return next;
      });
      setError(errorText(err));
    } finally {
      setSubmittingAnswer(false);
    }
  }

  if (loading) return <TestBackdrop message="Loading test..." />;
  if (error && isAssessmentLinkExpiredOrInvalid(error)) {
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

  const isTimeWarning = timeRemaining <= 120;
  const isLast = order >= total;

  return (
    <div className="min-h-screen bg-amal-sheet">
      <div className="sticky top-0 z-10 border-b border-black/10 bg-amal-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 pl-2 pr-4 sm:pl-3 sm:pr-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <AssessmentHeaderMark />
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold text-amal-ink">
                Assessment Test
              </h1>
              <p className="text-sm text-zinc-600">
                Question {order} of {total}
              </p>
            </div>
          </div>
          <div
            className={`flex items-center rounded-lg px-4 py-2 ${
              isTimeWarning ? "bg-amal-red/15" : "bg-amal-blue/10"
            }`}
          >
            <ClockIcon
              className={`mr-2 h-5 w-5 ${
                isTimeWarning ? "text-amal-red" : "text-amal-blue"
              }`}
            />
            <span
              className={`font-mono text-lg font-semibold ${
                isTimeWarning ? "text-amal-red" : "text-amal-blue"
              }`}
            >
              {formatClock(timeRemaining)}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {error ? (
          <p className="mb-4 rounded-lg border border-amal-red/30 bg-amal-red/10 px-3 py-2 text-sm text-amal-red">
            {error}
          </p>
        ) : null}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-lg bg-amal-white p-4 shadow-sm">
              <h3 className="mb-3 font-semibold text-amal-ink">Questions</h3>
              <div className="grid grid-cols-5 gap-2">
                {items.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setOrder(q.order)}
                    disabled={submittingAnswer}
                    className={`h-10 w-10 rounded-lg font-semibold transition ${
                      order === q.order
                        ? "bg-amal-red text-amal-white ring-2 ring-amal-red/30"
                        : answers[q.order]
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {q.order}
                  </button>
                ))}
              </div>
              <p className="mt-4 border-t pt-4 text-sm text-zinc-600">
                Answered: {answeredCount}/{total}
              </p>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="select-none rounded-lg bg-amal-white p-6 shadow-sm md:p-8">
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full bg-amal-blue/10 px-3 py-1 text-sm font-medium text-amal-blue">
                  Question {current.order}
                </span>
                {answers[current.order] ? (
                  <span className="flex items-center text-sm text-green-600">
                    <CheckIcon className="mr-1 h-4 w-4" />
                    Answered
                  </span>
                ) : null}
              </div>
              <h2 className="mb-6 text-xl font-medium leading-relaxed text-amal-ink md:text-2xl">
                {current.question_text}
              </h2>
              <div className="mb-8 space-y-3">
                {(["A", "B", "C", "D"] as const).map((opt) => {
                  const label = {
                    A: current.option_a,
                    B: current.option_b,
                    C: current.option_c,
                    D: current.option_d,
                  }[opt];
                  if (!label?.trim()) return null;
                  const selected = answers[current.order] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => void selectOption(opt)}
                      disabled={submittingAnswer}
                      className={`w-full rounded-lg border-2 p-4 text-left transition ${
                        selected
                          ? "border-amal-red bg-amal-red/5 ring-2 ring-amal-red/20"
                          : "border-black/10 hover:border-amal-red/40 hover:bg-amal-sheet"
                      } ${submittingAnswer ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-start">
                        <span
                          className={`mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-semibold ${
                            selected
                              ? "bg-amal-red text-amal-white"
                              : "bg-zinc-200 text-zinc-700"
                          }`}
                        >
                          {opt}
                        </span>
                        <span className="pt-0.5 text-amal-ink">{label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between border-t pt-6">
                <button
                  type="button"
                  onClick={() => setOrder((o) => Math.max(1, o - 1))}
                  disabled={order <= 1 || submittingAnswer}
                  className="flex items-center rounded-lg border border-black/15 px-4 py-2 text-zinc-700 hover:bg-amal-sheet disabled:opacity-50"
                >
                  <ChevronLeftIcon className="mr-1 h-5 w-5" />
                  Previous
                </button>
                {isLast ? (
                  <button
                    type="button"
                    onClick={() => setShowConfirm(true)}
                    disabled={isSubmitting}
                    className="rounded-lg bg-green-600 px-6 py-2 font-semibold text-amal-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Test"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOrder((o) => Math.min(total, o + 1))}
                    disabled={submittingAnswer}
                    className="flex items-center rounded-lg bg-amal-red px-4 py-2 font-semibold text-amal-white hover:bg-amal-red/90 disabled:opacity-50"
                  >
                    Next
                    <ChevronRightIcon className="ml-1 h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {isLast && answeredCount < total ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex">
                  <AlertCircleIcon className="mr-3 mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <h4 className="mb-1 font-semibold text-amber-900">
                      Unanswered Questions
                    </h4>
                    <p className="text-sm text-amber-800">
                      You have {total - answeredCount} unanswered question(s). Please
                      review before submitting.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {showConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-amal-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-semibold text-amal-ink">Submit Test?</h3>
            <p className="mb-2 text-zinc-600">
              You have answered {answeredCount} of {total} questions.
            </p>
            {answeredCount < total ? (
              <p className="mb-4 text-sm text-amber-800">
                {total - answeredCount} question(s) remain unanswered and will be
                marked as incorrect.
              </p>
            ) : null}
            <p className="mb-6 text-zinc-600">
              Once submitted, you cannot change your answers. Are you sure?
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
                {isSubmitting ? "Submitting..." : "Submit Test"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
