"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckIcon, VideoIcon } from "@/components/staff/icons";
import {
  AlertCircleIcon,
  CircleIcon,
  MicIcon,
  SquareIcon,
} from "./icons";
import { formatClock } from "./shared";

export function getSupportedMp4MimeType(): string {
  const candidates = [
    "video/mp4; codecs=hvc1",
    "video/mp4; codecs=hev1",
    "video/mp4; codecs=avc1.42E01E",
    "video/mp4",
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) {
      return c;
    }
  }
  return "";
}

export function VideoRecorder({
  onRecordingComplete,
  onRecordingStart,
  timeLimitSeconds,
  autoStart = true,
  questionNumber,
}: {
  onRecordingComplete: (blob: Blob) => void;
  onRecordingStart?: () => void;
  timeLimitSeconds: number;
  autoStart?: boolean;
  questionNumber: number;
}) {
  const mp4Mime = getSupportedMp4MimeType();
  if (!mp4Mime) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center bg-amal-sheet p-8">
        <AlertCircleIcon className="mb-3 h-8 w-8 text-amber-600" />
        <h3 className="mb-2 text-xl font-semibold text-amal-ink">
          MP4 recording not supported
        </h3>
        <p className="max-w-md text-center text-zinc-600">
          This browser cannot record video in MP4 format, which is required for
          this assessment. Try the latest Safari on iPhone/iPad or Chrome / Edge on
          desktop.
        </p>
      </div>
    );
  }
  return (
    <VideoRecorderInner
      mp4Mime={mp4Mime}
      onRecordingComplete={onRecordingComplete}
      onRecordingStart={onRecordingStart}
      timeLimitSeconds={timeLimitSeconds}
      autoStart={autoStart}
      questionNumber={questionNumber}
    />
  );
}

function VideoRecorderInner({
  onRecordingComplete,
  onRecordingStart,
  timeLimitSeconds,
  autoStart = true,
  questionNumber,
  mp4Mime,
}: {
  onRecordingComplete: (blob: Blob) => void;
  onRecordingStart?: () => void;
  timeLimitSeconds: number;
  autoStart?: boolean;
  questionNumber: number;
  mp4Mime: string;
}) {
  const [timeRemaining, setTimeRemaining] = useState(timeLimitSeconds);
  const [isRecordingStarted, setIsRecordingStarted] = useState(false);
  const [recordingCompleted, setRecordingCompleted] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isAcquiring, setIsAcquiring] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [recorderError, setRecorderError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    let mounted = true;
    const initStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsAcquiring(false);
      } catch (err: unknown) {
        if (!mounted) return;
        setIsAcquiring(false);
        const e = err as { name?: string; message?: string };
        if (e.name === "NotAllowedError") {
          setPermissionError("Camera & microphone permissions denied.");
        } else if (e.name === "NotFoundError") {
          setPermissionError("No camera or microphone found.");
        } else {
          setPermissionError(`Error: ${e.message ?? "Unknown"}`);
        }
      }
    };
    void initStream();
    return () => {
      mounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const handleStartRecording = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) {
      setRecorderError("Camera is not ready yet.");
      return;
    }
    try {
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: mp4Mime });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mp4Mime });
        const url = URL.createObjectURL(blob);
        setPlaybackUrl(url);
        setRecordingCompleted(true);
        onRecordingComplete(blob);
      };
      recorder.onerror = () => {
        setRecorderError("Recording failed. Please try again.");
        setIsRecording(false);
      };
      setIsRecordingStarted(true);
      setTimeRemaining(timeLimitSeconds);
      recorder.start();
      setIsRecording(true);
      onRecordingStart?.();
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setRecorderError(e.message ?? "Could not start recording.");
    }
  }, [mp4Mime, onRecordingComplete, onRecordingStart, stopRecording, timeLimitSeconds]);

  useEffect(() => {
    if (autoStart && !isRecordingStarted && !isAcquiring && !permissionError) {
      const t = setTimeout(() => handleStartRecording(), 800);
      return () => clearTimeout(t);
    }
  }, [
    autoStart,
    isRecordingStarted,
    isAcquiring,
    permissionError,
    handleStartRecording,
  ]);

  const isTimeWarning = timeRemaining <= 30;

  if (permissionError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center bg-amal-sheet p-8">
        <AlertCircleIcon className="mb-3 h-8 w-8 text-amal-red" />
        <h3 className="mb-2 text-xl font-semibold text-amal-ink">Permission Required</h3>
        <p className="mb-6 text-center text-zinc-600">{permissionError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-amal-red px-6 py-3 text-amal-white hover:bg-amal-red/90"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (recordingCompleted && playbackUrl) {
    return (
      <div className="flex flex-col items-center bg-amal-sheet p-6">
        <CheckIcon className="mb-3 h-6 w-6 text-green-600" />
        <h3 className="font-medium text-green-700">Recording Complete</h3>
        <video
          src={playbackUrl}
          controls
          className="mt-4 w-full rounded"
          aria-label="Recording playback"
        >
          <track kind="captions" />
        </video>
        <p className="mt-2 text-sm text-zinc-500">
          Response for Question {questionNumber} recorded. Uploading...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-amal-sheet">
      <div className="relative aspect-video w-full bg-amal-black">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-cover"
        />
        {isRecording ? (
          <div className="absolute left-4 top-4 flex animate-pulse items-center rounded-full bg-amal-red px-3 py-1.5">
            <CircleIcon className="mr-2 h-3 w-3 text-amal-white" />
            <span className="text-sm font-medium text-amal-white">REC</span>
          </div>
        ) : null}
        <div
          className={`absolute right-4 top-4 rounded-lg px-4 py-2 ${
            isTimeWarning ? "bg-amal-red/15" : "bg-amal-white"
          }`}
        >
          <span className="font-mono text-2xl font-bold text-amal-red">
            {formatClock(timeRemaining)}
          </span>
        </div>
        {isAcquiring ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-amal-black/60 text-amal-white">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-amal-red border-t-transparent" />
            <p>Preparing camera...</p>
          </div>
        ) : null}
      </div>
      <div className="border-t border-black/10 bg-amal-white p-4">
        <div className="flex justify-center">
          {isRecording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center rounded-lg bg-amal-red px-6 py-3 text-amal-white hover:bg-amal-red/90"
            >
              <SquareIcon className="mr-2 h-5 w-5" />
              Stop Recording
            </button>
          ) : !recordingCompleted && !isRecordingStarted ? (
            <button
              type="button"
              onClick={handleStartRecording}
              disabled={isAcquiring}
              className="flex items-center rounded-lg bg-amal-red px-6 py-3 text-amal-white hover:bg-amal-red/90 disabled:opacity-50"
            >
              <CircleIcon className="mr-2 h-5 w-5" />
              Start Recording
            </button>
          ) : null}
        </div>
        <div className="mt-4 flex justify-center gap-4 text-sm text-zinc-500">
          <span className="flex items-center">
            <VideoIcon className="mr-1 h-4 w-4 text-green-500" /> Camera Active
          </span>
          <span className="flex items-center">
            <MicIcon className="mr-1 h-4 w-4 text-green-500" /> Microphone Active
          </span>
        </div>
        {recorderError ? (
          <div className="mt-4 rounded border border-amal-red/30 bg-amal-red/10 p-3 text-center text-amal-red">
            {recorderError}
          </div>
        ) : null}
      </div>
    </div>
  );
}
