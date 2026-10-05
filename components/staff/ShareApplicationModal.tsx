"use client";

import Link from "next/link";
import { useState } from "react";
import { ApiError } from "@/lib/api";
import { createShareLink } from "@/lib/staff-api";
import { GhostButton, PrimaryButton, inputClass } from "./ui";

const EXPIRY_PRESETS = [
  { label: "1 day", days: 1 },
  { label: "3 days", days: 3 },
  { label: "7 days", days: 7 },
  { label: "14 days", days: 14 },
  { label: "30 days", days: 30 },
] as const;

function addDaysIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function ShareApplicationModal({
  applicationId,
  applicantName,
  onClose,
  onError,
}: {
  applicationId: number;
  applicantName: string;
  onClose: () => void;
  onError: (value: string) => void;
}) {
  const [days, setDays] = useState<(typeof EXPIRY_PRESETS)[number]["days"]>(7);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  async function onCreate() {
    setBusy(true);
    try {
      const link = await createShareLink({
        job_application: applicationId,
        comment: comment.trim() || undefined,
        expires_at: addDaysIso(days),
      });
      setShareUrl(link.share_url);
    } catch (error) {
      onError(error instanceof ApiError ? error.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-amal-ink/45 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-black/10 bg-amal-white p-5 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-application-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="share-application-title" className="text-lg font-bold">
          Share application
        </h3>
        <p className="mt-1 text-sm text-zinc-500">{applicantName}</p>
        {shareUrl ? (
          <div className="mt-4 space-y-3">
            <p className="break-all rounded-lg bg-amal-sheet px-3 py-2 text-sm">
              {shareUrl}
            </p>
            <div className="flex justify-end gap-2">
              <GhostButton
                type="button"
                onClick={() => void navigator.clipboard.writeText(shareUrl)}
              >
                Copy
              </GhostButton>
              <Link
                href="/staff/share-links"
                className="inline-flex items-center justify-center rounded-lg bg-amal-red px-4 py-2 text-sm font-semibold text-amal-white"
              >
                Shared links
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-medium">Expires in</p>
            <div className="flex flex-wrap gap-2">
              {EXPIRY_PRESETS.map((preset) => (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => setDays(preset.days)}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                    days === preset.days
                      ? "border-amal-red bg-amal-red text-amal-white"
                      : "border-black/15 bg-amal-white text-zinc-700 hover:bg-amal-sheet"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <label className="block text-sm font-semibold">
              Comment (optional)
              <input
                className={`${inputClass} mt-1 font-normal`}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
            </label>
            <div className="flex justify-end gap-2">
              <GhostButton type="button" onClick={onClose}>
                Cancel
              </GhostButton>
              <PrimaryButton type="button" disabled={busy} onClick={() => void onCreate()}>
                {busy ? "Creating..." : "Create link"}
              </PrimaryButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
