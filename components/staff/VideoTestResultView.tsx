"use client";

import { useEffect, useState } from "react";
import { ApiError, mediaUrl } from "@/lib/api";
import { getAssessment } from "@/lib/staff-api";
import type { ApplicationAssessment, VideoTestSection } from "@/lib/types";
import { AssessmentCommentsPanel } from "@/components/staff/AssessmentCommentsPanel";
import {
  AssessmentResultBackNav,
  formatDateTime,
  formatDuration,
  formatFileSize,
  SectionCard,
  SectionHeader,
} from "@/components/staff/assessment-result-shared";
import {
  BriefcaseIcon,
  CalendarIcon,
  DownloadIcon,
  PlayIcon,
  ShareIcon,
  UserIcon,
  VideoIcon,
} from "@/components/staff/icons";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

type VideoQuestion = VideoTestSection["questions"][number];

export function VideoTestResultView({ id }: { id: number }) {
  const [assessment, setAssessment] = useState<ApplicationAssessment | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [loadedId, setLoadedId] = useState<number | null>(null);
  if (loadedId !== id) {
    setLoadedId(id);
    setAssessment(null);
    setNotice("");
    setLoading(true);
    setSelectedIndex(0);
  }

  useEffect(() => {
    let ignore = false;
    getAssessment(id)
      .then((data) => {
        if (!ignore) {
          setAssessment(data);
          setSelectedIndex(0);
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
        <p className="text-sm text-zinc-500">Loading video responses…</p>
      </div>
    );
  }

  const videoTest = assessment?.video_test ?? null;
  const responses = videoTest?.questions ?? [];
  if (notice || !videoTest) {
    return (
      <div className="space-y-4 p-6">
        <AssessmentResultBackNav applicationId={id} />
        <SectionCard>
          <div className="p-6">
            <p className="text-zinc-600">
              {notice || "No video responses yet."}
            </p>
          </div>
        </SectionCard>
      </div>
    );
  }

  const current = responses[selectedIndex] ?? null;

  return (
    <div className="space-y-6 p-6">
      <AssessmentResultBackNav applicationId={id} />

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
                {formatDateTime(videoTest.completed_at)}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-2">
              <VideoIcon className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">
                {responses.length} video{responses.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <SectionCard className="lg:col-span-1">
          <SectionHeader title="Video responses" />
          <div className="space-y-2 p-4">
            {responses.map((response, index) => {
              const active = selectedIndex === index;
              return (
                <button
                  key={response.order}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`w-full rounded-xl p-4 text-left transition-colors ${
                    active
                      ? "bg-amal-red text-amal-white shadow-md shadow-amal-red/25"
                      : "bg-amal-sheet hover:bg-zinc-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        active ? "bg-amal-white/20" : "bg-amal-red/10"
                      }`}
                    >
                      <PlayIcon
                        className={`h-5 w-5 ${
                          active ? "text-amal-white" : "text-amal-red"
                        }`}
                      />
                    </div>
                    <div>
                      <p
                        className={`font-medium ${
                          active ? "text-amal-white" : "text-zinc-900"
                        }`}
                      >
                        Question {response.order}
                      </p>
                      <p
                        className={`text-xs ${
                          active ? "text-amal-white/80" : "text-zinc-500"
                        }`}
                      >
                        {formatFileSize(response.file_size_bytes)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </SectionCard>

        <div className="lg:col-span-3">
          <SectionCard>
            {current ? (
              <VideoPlayerBlock response={current} />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                <VideoIcon className="mb-4 h-12 w-12" />
                <p>No video selected</p>
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      <AssessmentCommentsPanel
        applicationId={id}
        source="video_test"
        sourceFilter="video_test"
        headerTitle="Reviewer comments"
        headerSubtitle="Notes about this candidate's video responses"
      />
    </div>
  );
}

function inferVideoFormat(url: string): string {
  const path = url.split("?")[0].toLowerCase();
  if (path.endsWith(".webm")) {
    return "WebM";
  }
  if (path.endsWith(".mp4")) {
    return "MP4";
  }
  return "MP4";
}

function VideoPlayerBlock({ response }: { response: VideoQuestion }) {
  const resolvedUrl = mediaUrl(response.video) ?? "";
  const [videoError, setVideoError] = useState(false);
  const [shareNotice, setShareNotice] = useState("");
  const [playbackDuration, setPlaybackDuration] = useState<number | null>(null);
  const [trackedUrl, setTrackedUrl] = useState(resolvedUrl);
  if (trackedUrl !== resolvedUrl) {
    setTrackedUrl(resolvedUrl);
    setPlaybackDuration(null);
    setVideoError(false);
  }
  const hasVideo = Boolean(resolvedUrl) && !videoError;
  const durationSeconds =
    response.duration_seconds ?? playbackDuration ?? null;
  const recordedAt = response.recorded_at ?? response.uploaded_at ?? null;

  function handleDownload() {
    if (!resolvedUrl) {
      return;
    }
    const a = document.createElement("a");
    a.href = resolvedUrl;
    a.download = `response_q${response.order}.mp4`;
    a.rel = "noopener noreferrer";
    a.target = "_blank";
    a.click();
  }

  async function handleShare() {
    if (!resolvedUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(resolvedUrl);
      setShareNotice("Video URL copied.");
    } catch {
      setShareNotice("Could not copy URL.");
    }
    window.setTimeout(() => setShareNotice(""), 2500);
  }

  return (
    <>
      <div className="aspect-video bg-amal-black">
        {hasVideo ? (
          <video
            key={resolvedUrl}
            src={resolvedUrl}
            controls
            preload="metadata"
            className="h-full w-full object-contain"
            onLoadedMetadata={(event) => {
              const duration = event.currentTarget.duration;
              setPlaybackDuration(
                Number.isFinite(duration) ? Math.round(duration) : null,
              );
            }}
            onError={() => setVideoError(true)}
          >
            <track kind="captions" />
          </video>
        ) : (
          <div className="flex h-full items-center justify-center text-amal-white/70">
            {videoError ? "Unable to load video" : "No video file"}
          </div>
        )}
      </div>
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">
              Question {response.order}
            </h2>
            <p className="mt-1 text-sm text-zinc-600">{response.prompt}</p>
            {shareNotice ? (
              <p className="mt-2 text-xs font-medium text-emerald-700">
                {shareNotice}
              </p>
            ) : null}
          </div>
          {resolvedUrl ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-amal-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-amal-sheet"
              >
                <DownloadIcon className="h-4 w-4" />
                Download
              </button>
              <button
                type="button"
                onClick={() => void handleShare()}
                className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-amal-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-amal-sheet"
                title="Copy direct link to this video file"
              >
                <ShareIcon className="h-4 w-4" />
                Share
              </button>
            </div>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-black/5 pt-4 sm:grid-cols-4">
          <Meta label="Format" value={inferVideoFormat(resolvedUrl)} />
          <Meta
            label="File size"
            value={formatFileSize(response.file_size_bytes)}
          />
          <Meta label="Duration" value={formatDuration(durationSeconds)} />
          <Meta
            label="Recorded"
            value={
              recordedAt ? new Date(recordedAt).toLocaleDateString() : "—"
            }
          />
        </div>
      </div>
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-zinc-500">{label}</span>
      <p className="text-sm font-medium text-zinc-900">{value}</p>
    </div>
  );
}
