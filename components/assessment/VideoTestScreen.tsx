"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckIcon, ClockIcon, PlayIcon, VideoIcon } from "@/components/staff/icons";
import {
  completeVideoTest,
  startVideoTest,
  uploadVideoAnswer,
  type VideoItem,
} from "@/lib/public-api";
import {
  AssessmentExpiredCard,
  isAssessmentLinkExpiredOrInvalid,
} from "./AssessmentExpiredCard";
import {
  AlertCircleIcon,
  ChevronRightIcon,
  LoaderIcon,
  MicIcon,
  UploadIcon,
} from "./icons";
import { TestBackdrop } from "./TestBackdrop";
import { VideoRecorder } from "./VideoRecorder";
import { errorText } from "./shared";

const PER_QUESTION_SECONDS = 120;

function formatTimeLimit(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) return `${mins} minute${mins !== 1 ? "s" : ""}`;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function VideoTestScreen({
  token,
  onComplete,
}: {
  token: string;
  onComplete: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState<VideoItem[]>([]);
  const [index, setIndex] = useState(0);
  const [uploadedOrders, setUploadedOrders] = useState<number[]>([]);
  const [questionStarted, setQuestionStarted] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showNextPrompt, setShowNextPrompt] = useState(false);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = items[index];
  const total = items.length;
  const currentStep = index + 1;

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const rows = await startVideoTest(token);
        if (ignore) return;
        setItems(rows);
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

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    let stream: MediaStream | null = null;
    const init = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (mounted && !questionStarted && !showCountdown && !showNextPrompt) {
          setPreviewStream(stream);
        } else {
          stream.getTracks().forEach((t) => t.stop());
        }
      } catch {
        if (mounted) setPreviewStream(null);
      }
    };
    if (!questionStarted && !showCountdown && !showNextPrompt) {
      void init();
    }
    return () => {
      mounted = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [questionStarted, showCountdown, showNextPrompt]);

  useEffect(() => {
    const el = previewVideoRef.current;
    if (!el) return;
    el.srcObject = previewStream;
    return () => {
      if (el.srcObject) {
        (el.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
        el.srcObject = null;
      }
    };
  }, [previewStream]);

  const finishAll = useCallback(async () => {
    await completeVideoTest(token);
    onComplete();
  }, [token, onComplete]);

  async function handleRecordingComplete(blob: Blob) {
    if (!current) return;
    setIsUploading(true);
    setError("");
    try {
      const file = new File([blob], `question_${current.order}.mp4`, {
        type: blob.type || "video/mp4",
      });
      await uploadVideoAnswer(token, current.id, file);
      setUploadedOrders((prev) =>
        prev.includes(current.order)
          ? prev
          : [...prev, current.order].sort((a, b) => a - b),
      );
      if (index + 1 >= items.length) {
        await finishAll();
      } else {
        setShowNextPrompt(true);
      }
    } catch (err) {
      setError(errorText(err));
    } finally {
      setIsUploading(false);
    }
  }

  function beginCountdown() {
    if (previewStream) {
      previewStream.getTracks().forEach((t) => t.stop());
      setPreviewStream(null);
    }
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowCountdown(true);
    setCountdown(5);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          setShowCountdown(false);
          setQuestionStarted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function handleNextQuestion() {
    setShowNextPrompt(false);
    setQuestionStarted(false);
    setShowCountdown(false);
    setCountdown(0);
    setIndex((i) => i + 1);
  }

  if (loading) return <TestBackdrop message="Loading video test..." />;
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

  return (
    <div className="min-h-screen bg-amal-sheet">
      <div className="sticky top-0 z-10 border-b border-black/10 bg-amal-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div>
            <h1 className="text-xl font-semibold text-amal-ink">Video Assessment</h1>
            <p className="text-sm text-zinc-600">
              Question {currentStep} of {total}
            </p>
          </div>
          <div className="flex items-center rounded-lg bg-amal-red/10 px-4 py-2">
            <VideoIcon className="mr-2 h-5 w-5 text-amal-red" />
            <span className="font-semibold text-amal-red">
              {currentStep}/{total}
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
              <div className="grid grid-cols-3 gap-2">
                {items.map((q, i) => {
                  const uploaded = uploadedOrders.includes(q.order);
                  const isCurrent = i === index && !showNextPrompt;
                  return (
                    <div
                      key={q.id}
                      className={`flex h-12 w-full items-center justify-center rounded-lg font-semibold ${
                        uploaded
                          ? "bg-green-100 text-green-700"
                          : isCurrent
                            ? "bg-amal-red text-amal-white ring-2 ring-amal-red/30"
                            : "bg-zinc-100 text-zinc-400"
                      }`}
                    >
                      {uploaded ? <CheckIcon className="h-5 w-5" /> : q.order}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 border-t pt-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-zinc-600">Completed:</span>
                  <span className="font-semibold text-amal-ink">
                    {uploadedOrders.length}/{total}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600">Remaining:</span>
                  <span className="font-semibold text-amal-ink">
                    {Math.max(0, total - uploadedOrders.length)}
                  </span>
                </div>
              </div>
              <div className="mt-4 border-t pt-4">
                <div className="flex items-center text-sm text-zinc-600">
                  <ClockIcon className="mr-2 h-4 w-4 text-amal-red" />
                  <span>
                    {questionStarted || showCountdown
                      ? `${formatTimeLimit(PER_QUESTION_SECONDS)} per question`
                      : "Time limit appears when you start"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {showNextPrompt ? (
              <div className="rounded-lg bg-amal-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                  <CheckIcon className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="mb-3 text-2xl font-bold text-amal-ink">
                  Video Uploaded Successfully!
                </h3>
                <p className="mb-8 text-zinc-600">
                  Your response for Question {current.order} has been saved.
                  {currentStep < total ? (
                    <span className="mt-2 block">
                      Ready for Question {currentStep + 1}?
                    </span>
                  ) : null}
                </p>
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="inline-flex items-center rounded-lg bg-amal-red px-8 py-4 font-semibold text-amal-white hover:bg-amal-red/90"
                >
                  Continue to Question {currentStep + 1}
                  <ChevronRightIcon className="ml-2 h-5 w-5" />
                </button>
              </div>
            ) : isUploading ? (
              <div className="rounded-lg bg-amal-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amal-red/10">
                  <UploadIcon className="h-10 w-10 animate-bounce text-amal-red" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-amal-ink">
                  Uploading Your Video…
                </h3>
                <div className="flex items-center justify-center text-zinc-500">
                  <LoaderIcon className="mr-2 h-5 w-5 animate-spin" />
                  Processing…
                </div>
              </div>
            ) : showCountdown ? (
              <div className="overflow-hidden rounded-lg bg-amal-white shadow-sm">
                <div className="border-b p-6">
                  <span className="mb-4 inline-flex rounded-full bg-amal-red/10 px-3 py-1 text-sm font-medium text-amal-red">
                    Question {currentStep}
                  </span>
                  <h2 className="text-xl font-medium text-amal-ink md:text-2xl">
                    {current.prompt}
                  </h2>
                </div>
                <div className="flex flex-col items-center justify-center bg-amal-ink py-20">
                  <div className="mx-auto mb-6 flex h-32 w-32 animate-pulse items-center justify-center rounded-full bg-amal-red">
                    <span className="text-6xl font-bold text-amal-white">{countdown}</span>
                  </div>
                  <p className="text-xl font-medium text-amal-white">Get Ready!</p>
                  <p className="mt-2 text-zinc-400">
                    Recording will start automatically
                  </p>
                </div>
              </div>
            ) : !questionStarted ? (
              <div className="overflow-hidden rounded-lg bg-amal-white shadow-sm">
                <div className="relative aspect-video bg-amal-ink">
                  <video
                    ref={previewVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-amal-black/70 via-transparent to-amal-black/30">
                    <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
                      <span className="inline-flex items-center rounded-full bg-amal-white/90 px-3 py-1.5 text-sm font-medium text-amal-ink">
                        Question {currentStep} of {total}
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
                      <p className="mb-4 text-sm text-amal-white/90">
                        Check your camera position • Click start when ready
                      </p>
                      <button
                        type="button"
                        onClick={beginCountdown}
                        className="inline-flex items-center rounded-lg bg-amal-red px-10 py-4 text-lg font-semibold text-amal-white shadow-lg hover:bg-amal-red/90"
                      >
                        <PlayIcon className="mr-3 h-6 w-6" />
                        Start Question
                      </button>
                    </div>
                  </div>
                  {!previewStream ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-amal-ink">
                      <div className="text-center text-amal-white">
                        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-amal-red border-t-transparent" />
                        <p>Preparing camera…</p>
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="p-6">
                  <div className="mb-4 flex flex-wrap items-center justify-center gap-6 text-sm">
                    <span className="flex items-center text-green-600">
                      <VideoIcon className="mr-1.5 h-4 w-4" />
                      Camera Ready
                    </span>
                    <span className="flex items-center text-green-600">
                      <MicIcon className="mr-1.5 h-4 w-4" />
                      Microphone Ready
                    </span>
                  </div>
                  <div className="rounded-lg bg-amal-sheet p-4 text-center text-sm text-zinc-600">
                    <p className="mb-2 font-semibold text-zinc-700">What happens next?</p>
                    <p>1. Click &quot;Start Question&quot; to reveal the prompt</p>
                    <p>2. A 5-second countdown will begin</p>
                    <p>3. Recording starts automatically after countdown</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg bg-amal-white shadow-sm">
                <div className="border-b p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="inline-flex rounded-full bg-amal-red/10 px-3 py-1 text-sm font-medium text-amal-red">
                      Question {currentStep}
                    </span>
                    <div className="flex items-center text-sm text-zinc-500">
                      <ClockIcon className="mr-1 h-4 w-4" />
                      {formatTimeLimit(PER_QUESTION_SECONDS)}
                    </div>
                  </div>
                  <h2 className="text-xl font-medium text-amal-ink md:text-2xl">
                    {current.prompt}
                  </h2>
                </div>
                <VideoRecorder
                  key={`${current.id}-${questionStarted}`}
                  questionNumber={currentStep}
                  timeLimitSeconds={PER_QUESTION_SECONDS}
                  autoStart
                  onRecordingComplete={(blob) => void handleRecordingComplete(blob)}
                />
              </div>
            )}

            {!showNextPrompt && !isUploading && !questionStarted && !showCountdown ? (
              <div className="mt-4 rounded-lg border border-amal-blue/30 bg-amal-blue/5 p-4">
                <div className="flex">
                  <AlertCircleIcon className="mr-3 mt-0.5 h-5 w-5 shrink-0 text-amal-blue" />
                  <div>
                    <h4 className="mb-1 font-semibold text-amal-blue">Before You Start</h4>
                    <ul className="space-y-1 text-sm text-zinc-700">
                      <li>• Quiet environment with good lighting</li>
                      <li>• Prompt reveals when you click Start Question</li>
                      <li>• You cannot pause or redo once recording begins</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
