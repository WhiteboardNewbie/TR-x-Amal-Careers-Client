"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { addComment, getComments } from "@/lib/staff-api";
import type { Comment } from "@/lib/types";
import {
  formatDateTime,
  SectionCard,
  SectionHeader,
} from "@/components/staff/assessment-result-shared";
import { MessageSquareIcon, SendIcon } from "@/components/staff/icons";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

export function AssessmentCommentsPanel({
  applicationId,
  source = "general",
  sourceFilter,
  headerTitle = "Comments",
  headerSubtitle = "Notes and feedback from reviewers",
  showHeader = true,
  compact = false,
}: {
  applicationId: number;
  source?: "general" | "video_test" | "general_questionnaire";
  sourceFilter?: "general" | "video_test" | "general_questionnaire";
  headerTitle?: string;
  headerSubtitle?: string;
  showHeader?: boolean;
  compact?: boolean;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [loadedKey, setLoadedKey] = useState("");
  const fetchKey = `${applicationId}:${sourceFilter ?? "all"}`;
  if (loadedKey !== fetchKey) {
    setLoadedKey(fetchKey);
    setComments([]);
    setNotice("");
    setLoading(true);
  }

  useEffect(() => {
    let ignore = false;
    getComments(applicationId)
      .then((page) => {
        if (ignore) {
          return;
        }
        const rows = page.results ?? [];
        setComments(
          sourceFilter
            ? rows.filter((row) => row.source === sourceFilter)
            : rows,
        );
      })
      .catch((error) => {
        if (!ignore) {
          setNotice(errorText(error));
          setComments([]);
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
  }, [applicationId, sourceFilter]);

  async function onSubmit() {
    const text = draft.trim();
    if (!text || busy) {
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const created = await addComment(applicationId, text, source);
      setComments((current) => [...current, created]);
      setDraft("");
    } catch (error) {
      setNotice(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  const body = (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {loading ? (
        <div className="flex items-center justify-center py-6 text-zinc-400">
          <p className="text-sm">Loading comments…</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 bg-amal-sheet/70 px-4 py-6 text-center">
          <MessageSquareIcon className="mx-auto h-7 w-7 text-zinc-300" />
          <p className="mt-2 text-sm font-medium text-zinc-600">
            No comments yet
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Be the first to add a note on this application.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {comments.map((row) => (
            <li
              key={row.id}
              className="rounded-xl border border-black/10 bg-amal-sheet/50 px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
                <span className="font-semibold text-zinc-700">
                  {row.author_display_name || "Staff"}
                </span>
                <span aria-hidden>·</span>
                <time dateTime={row.created_at}>
                  {formatDateTime(row.created_at)}
                </time>
                {row.source && row.source !== "general" ? (
                  <span className="rounded-full bg-amal-sheet px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                    {row.source_label || row.source}
                  </span>
                ) : null}
                {row.stage_name ? (
                  <span className="rounded-full bg-amal-red/10 px-2 py-0.5 text-[11px] font-medium text-amal-red">
                    {row.stage_name}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-800">
                {row.text}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={compact ? 2 : 3}
          placeholder="Write a comment..."
          className="w-full rounded-lg border border-black/15 bg-amal-white px-3 py-2 text-sm placeholder:text-zinc-400 outline-none focus:border-amal-red focus:ring-1 focus:ring-amal-red"
        />
        <div className="flex items-center justify-between gap-2">
          {notice ? (
            <p className="text-xs text-amal-red">{notice}</p>
          ) : (
            <span />
          )}
          <button
            type="button"
            disabled={busy || !draft.trim()}
            onClick={() => void onSubmit()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amal-red px-3 py-1.5 text-sm font-medium text-amal-white transition-colors hover:bg-amal-red/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SendIcon className="h-3.5 w-3.5" />
            {busy ? "Saving…" : "Add comment"}
          </button>
        </div>
      </div>
    </div>
  );

  if (!showHeader) {
    return body;
  }

  return (
    <SectionCard className="overflow-hidden p-0">
      <SectionHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        icon={<MessageSquareIcon className="h-3.5 w-3.5" />}
      />
      <div className={compact ? "p-4" : "p-5"}>{body}</div>
    </SectionCard>
  );
}
