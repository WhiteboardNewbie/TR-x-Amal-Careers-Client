"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  createShareLink,
  deactivateShareLink,
  getShareLinks,
  patchShareLink,
} from "@/lib/staff-api";
import type { ShareLink } from "@/lib/types";
import {
  CheckIcon,
  CopyIcon,
  LinkIcon,
  LoaderIcon,
  ScrollTextIcon,
  ShareIcon,
  XIcon,
} from "./icons";
import { CenteredOverlay, GhostButton, inputClass } from "./ui";

const EXPIRY_PRESETS = [
  { label: "1 day", days: 1 },
  { label: "3 days", days: 3 },
  { label: "7 days", days: 7 },
  { label: "14 days", days: 14 },
  { label: "30 days", days: 30 },
] as const;

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}

function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShareStatus(status: string | undefined): string {
  if (!status) return "—";
  return status.charAt(0).toUpperCase() + status.slice(1);
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
  const [creating, setCreating] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [link, setLink] = useState<ShareLink | null>(null);
  const [comment, setComment] = useState("");
  const [expiresLocal, setExpiresLocal] = useState("");
  const [copied, setCopied] = useState(false);
  const [existingLinks, setExistingLinks] = useState<ShareLink[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const patchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setCopyNotice("Shareable link copied to clipboard.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyNotice("Could not copy the link. Copy it manually.");
    }
  };

  const refreshExisting = async () => {
    setLoadingExisting(true);
    try {
      const data = await getShareLinks({
        job_application: applicationId,
        page_size: 50,
      });
      setExistingLinks(data.results);
    } catch {
      // non-blocking
    } finally {
      setLoadingExisting(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setCreating(true);
      setError(null);
      setCopyNotice(null);
      try {
        const created = await createShareLink({
          job_application: applicationId,
          expires_at: addDaysIso(7),
          comment: "",
        });
        if (cancelled) {
          void deactivateShareLink(created.id).catch(() => {});
          return;
        }
        setLink(created);
        setComment(created.comment ?? "");
        setExpiresLocal(
          created.expires_at ? toDatetimeLocalValue(created.expires_at) : "",
        );
        setCreating(false);
        setLoadingExisting(true);
        try {
          const data = await getShareLinks({
            job_application: applicationId,
            page_size: 50,
          });
          if (!cancelled) setExistingLinks(data.results);
        } catch {
          // non-blocking
        } finally {
          if (!cancelled) setLoadingExisting(false);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiError
              ? err.message
              : "Could not create a share link.";
          setError(message);
          onErrorRef.current(message);
          setCreating(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      if (patchTimer.current) clearTimeout(patchTimer.current);
    };
  }, [applicationId]);

  const schedulePatch = (next: { expires_at?: string; comment?: string }) => {
    if (!link) return;
    if (patchTimer.current) clearTimeout(patchTimer.current);
    patchTimer.current = setTimeout(() => {
      void (async () => {
        setSaving(true);
        setError(null);
        try {
          const updated = await patchShareLink(link.id, next);
          setLink(updated);
          void refreshExisting();
        } catch {
          setError("Could not update share link settings.");
        } finally {
          setSaving(false);
        }
      })();
    }, 400);
  };

  const applyPreset = (days: number) => {
    const iso = addDaysIso(days);
    setExpiresLocal(toDatetimeLocalValue(iso));
    schedulePatch({ expires_at: iso });
  };

  const handleDeactivate = async (shareId: string) => {
    try {
      await deactivateShareLink(shareId);
      setCopyNotice("Share link deactivated.");
      if (link?.id === shareId) {
        setLink((cur) =>
          cur ? { ...cur, is_active: false, status: "deactivated" } : cur,
        );
      }
      void refreshExisting();
    } catch {
      setError("Could not deactivate this share link.");
    }
  };

  return (
    <CenteredOverlay onClose={onClose} backdropClassName="bg-amal-ink/45">
      <div
        className="pointer-events-auto mx-auto flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-black/10 bg-amal-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-application-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShareIcon className="h-[18px] w-[18px] text-amal-red" />
            <h3
              id="share-application-title"
              className="text-lg font-semibold text-zinc-900"
            >
              Share application
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-500 hover:bg-amal-sheet hover:text-zinc-700"
            aria-label="Close"
          >
            <XIcon className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-5 py-4">
          {applicantName ? (
            <p className="text-sm text-zinc-600">
              Sharing{" "}
              <span className="font-medium text-zinc-900">{applicantName}</span>
            </p>
          ) : null}

          {creating ? (
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <LoaderIcon className="h-4 w-4 animate-spin text-amal-red" />
              Generating shareable link…
            </div>
          ) : null}

          {error ? <p className="text-sm text-amal-red">{error}</p> : null}
          {copyNotice && !error ? (
            <p className="text-sm text-zinc-600">{copyNotice}</p>
          ) : null}

          {link ? (
            <>
              <div>
                <label
                  htmlFor="share-modal-url"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500"
                >
                  Shareable link
                </label>
                <div className="flex gap-2">
                  <input
                    id="share-modal-url"
                    readOnly
                    value={link.share_url}
                    className={`${inputClass} min-w-0 flex-1 bg-amal-sheet`}
                  />
                  <button
                    type="button"
                    onClick={() => void copyUrl(link.share_url)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-amal-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-amal-sheet"
                  >
                    {copied ? (
                      <CheckIcon className="h-3.5 w-3.5" />
                    ) : (
                      <CopyIcon className="h-3.5 w-3.5" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                {!link.is_active ? (
                  <p className="mt-1.5 text-xs font-medium text-amal-red">
                    This link is deactivated.
                  </p>
                ) : link.is_expired ? (
                  <p className="mt-1.5 text-xs font-medium text-amber-700">
                    This link has expired.
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs text-zinc-500">
                    {saving
                      ? "Saving…"
                      : "Changes auto-save to this same link."}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="share-modal-expires"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500"
                >
                  Expires
                </label>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {EXPIRY_PRESETS.map((preset) => (
                    <button
                      key={preset.days}
                      type="button"
                      disabled={!link.is_active}
                      onClick={() => applyPreset(preset.days)}
                      className="rounded-full border border-black/15 bg-amal-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:border-amal-red/40 hover:bg-amal-red/5 hover:text-amal-red disabled:opacity-50"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <input
                  id="share-modal-expires"
                  type="datetime-local"
                  value={expiresLocal}
                  disabled={!link.is_active}
                  onChange={(e) => {
                    const value = e.target.value;
                    setExpiresLocal(value);
                    if (value) {
                      schedulePatch({
                        expires_at: fromDatetimeLocalValue(value),
                      });
                    }
                  }}
                  className={`${inputClass} disabled:opacity-50`}
                />
              </div>

              <div>
                <label
                  htmlFor="share-modal-comment"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500"
                >
                  Comment
                </label>
                <textarea
                  id="share-modal-comment"
                  value={comment}
                  disabled={!link.is_active}
                  rows={6}
                  placeholder="Optional note for your team (not shown on the public page)"
                  onChange={(e) => {
                    const value = e.target.value;
                    setComment(value);
                    schedulePatch({ comment: value });
                  }}
                  className={`${inputClass} min-h-32 resize-y py-2 placeholder:text-zinc-400 disabled:opacity-50`}
                />
              </div>
            </>
          ) : null}

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-zinc-900">
                Links for this application
              </h4>
              <Link
                href={`/staff/share-links?job_application=${applicationId}`}
                onClick={onClose}
                className="inline-flex items-center gap-1 text-xs font-semibold text-amal-red hover:text-amal-red/80"
              >
                <LinkIcon className="h-3 w-3" />
                Open hub
              </Link>
            </div>
            {loadingExisting ? (
              <p className="text-xs text-zinc-500">Loading…</p>
            ) : existingLinks.length === 0 ? (
              <p className="text-xs text-zinc-500">No share links yet.</p>
            ) : (
              <ul className="max-h-48 space-y-2 overflow-y-auto">
                {existingLinks.map((row) => (
                  <li
                    key={row.id}
                    className="rounded-lg border border-black/10 bg-amal-sheet/80 px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-zinc-800">
                          {formatShareStatus(row.status)} · expires{" "}
                          {formatDateTime(row.expires_at)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-zinc-500">
                          {row.access_count ?? 0} opens
                          {row.comment ? ` · ${row.comment}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Link
                          href={`/staff/share-links/${row.id}/logs`}
                          onClick={onClose}
                          className="rounded p-1 text-zinc-500 hover:bg-amal-white hover:text-amal-red"
                          title="Access logs"
                          aria-label="View access logs"
                        >
                          <ScrollTextIcon className="h-3.5 w-3.5" />
                        </Link>
                        {row.is_active ? (
                          <button
                            type="button"
                            onClick={() => void handleDeactivate(row.id)}
                            className="rounded px-1.5 py-0.5 text-[11px] font-semibold text-amal-red hover:bg-amal-red/10"
                          >
                            Deactivate
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-black/10 px-5 py-4">
          <GhostButton type="button" onClick={onClose}>
            Done
          </GhostButton>
        </div>
      </div>
    </CenteredOverlay>
  );
}

export function EditShareLinkModal({
  link: initialLink,
  onClose,
  onSaved,
}: {
  link: ShareLink;
  onClose: () => void;
  onSaved?: (link: ShareLink) => void;
}) {
  const [link, setLink] = useState(initialLink);
  const [comment, setComment] = useState(initialLink.comment ?? "");
  const [expiresLocal, setExpiresLocal] = useState(
    initialLink.expires_at ? toDatetimeLocalValue(initialLink.expires_at) : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const patchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (patchTimer.current) clearTimeout(patchTimer.current);
    };
  }, []);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(link.share_url);
      setCopied(true);
      setCopyNotice("Shareable link copied to clipboard.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyNotice("Could not copy the link. Copy it manually.");
    }
  };

  const schedulePatch = (next: { expires_at?: string; comment?: string }) => {
    if (!link.is_active) return;
    if (patchTimer.current) clearTimeout(patchTimer.current);
    patchTimer.current = setTimeout(() => {
      void (async () => {
        setSaving(true);
        setError(null);
        try {
          const updated = await patchShareLink(link.id, next);
          setLink(updated);
          onSaved?.(updated);
        } catch {
          setError("Could not update share link settings.");
        } finally {
          setSaving(false);
        }
      })();
    }, 400);
  };

  const applyPreset = (days: number) => {
    const iso = addDaysIso(days);
    setExpiresLocal(toDatetimeLocalValue(iso));
    schedulePatch({ expires_at: iso });
  };

  const handleDeactivate = async () => {
    try {
      const updated = await deactivateShareLink(link.id);
      setLink(updated);
      onSaved?.(updated);
      setCopyNotice("Share link deactivated.");
    } catch {
      setError("Could not deactivate this share link.");
    }
  };

  return (
    <CenteredOverlay onClose={onClose} backdropClassName="bg-amal-ink/45">
      <div
        className="pointer-events-auto mx-auto flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-black/10 bg-amal-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-share-link-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShareIcon className="h-[18px] w-[18px] text-amal-red" />
            <h3
              id="edit-share-link-title"
              className="text-lg font-semibold text-zinc-900"
            >
              Edit share link
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-500 hover:bg-amal-sheet hover:text-zinc-700"
            aria-label="Close"
          >
            <XIcon className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-5 py-4">
          <p className="text-sm text-zinc-600">
            {link.applicant_name ?? "Applicant"}
            {link.job_opening_title ? (
              <>
                {" "}
                · <span className="font-medium">{link.job_opening_title}</span>
              </>
            ) : null}
          </p>
          <p className="text-xs text-zinc-500">
            Status:{" "}
            <span className="font-semibold text-zinc-700">
              {formatShareStatus(link.status)}
            </span>
          </p>

          {error ? <p className="text-sm text-amal-red">{error}</p> : null}
          {copyNotice && !error ? (
            <p className="text-sm text-zinc-600">{copyNotice}</p>
          ) : null}

          <div>
            <label
              htmlFor="edit-share-modal-url"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500"
            >
              Shareable link
            </label>
            <div className="flex gap-2">
              <input
                id="edit-share-modal-url"
                readOnly
                value={link.share_url}
                className={`${inputClass} min-w-0 flex-1 bg-amal-sheet`}
              />
              <button
                type="button"
                onClick={() => void copyUrl()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-amal-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-amal-sheet"
              >
                {copied ? (
                  <CheckIcon className="h-3.5 w-3.5" />
                ) : (
                  <CopyIcon className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-zinc-500">
              {saving
                ? "Saving…"
                : link.is_active
                  ? "Changes auto-save to this same link."
                  : "This link is deactivated and cannot be edited."}
            </p>
          </div>

          <div>
            <label
              htmlFor="edit-share-modal-expires"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500"
            >
              Expires
            </label>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {EXPIRY_PRESETS.map((preset) => (
                <button
                  key={preset.days}
                  type="button"
                  disabled={!link.is_active}
                  onClick={() => applyPreset(preset.days)}
                  className="rounded-full border border-black/15 bg-amal-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:border-amal-red/40 hover:bg-amal-red/5 hover:text-amal-red disabled:opacity-50"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <input
              id="edit-share-modal-expires"
              type="datetime-local"
              value={expiresLocal}
              disabled={!link.is_active}
              onChange={(e) => {
                const value = e.target.value;
                setExpiresLocal(value);
                if (value) {
                  schedulePatch({ expires_at: fromDatetimeLocalValue(value) });
                }
              }}
              className={`${inputClass} disabled:opacity-50`}
            />
          </div>

          <div>
            <label
              htmlFor="edit-share-modal-comment"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500"
            >
              Comment
            </label>
            <textarea
              id="edit-share-modal-comment"
              value={comment}
              disabled={!link.is_active}
              rows={6}
              placeholder="Optional note for your team (not shown on the public page)"
              onChange={(e) => {
                const value = e.target.value;
                setComment(value);
                schedulePatch({ comment: value });
              }}
              className={`${inputClass} min-h-32 resize-y py-2 placeholder:text-zinc-400 disabled:opacity-50`}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-black/10 px-5 py-4">
          {link.is_active ? (
            <button
              type="button"
              onClick={() => void handleDeactivate()}
              className="rounded-lg border border-amal-red/30 px-3 py-2 text-sm font-medium text-amal-red hover:bg-amal-red/5"
            >
              Deactivate
            </button>
          ) : (
            <span />
          )}
          <GhostButton type="button" onClick={onClose}>
            Done
          </GhostButton>
        </div>
      </div>
    </CenteredOverlay>
  );
}
