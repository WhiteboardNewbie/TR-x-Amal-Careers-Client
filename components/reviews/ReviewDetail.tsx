"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  addComment,
  completeStage,
  getApplicationStages,
  getComments,
  getStaffApplication,
  requestInterview,
  setManagerStageStatus,
} from "@/lib/staff-api";
import { labelFor } from "@/lib/status";
import type { ApplicationStage, Comment, StaffApplication } from "@/lib/types";
import { Field, GhostButton, PrimaryButton, inputClass } from "@/components/staff/ui";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

export function ReviewDetail({ id }: { id: number }) {
  const [application, setApplication] = useState<StaffApplication | null>(null);
  const [stages, setStages] = useState<ApplicationStage[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const onError = useCallback((value: string) => setNotice(value), []);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      getStaffApplication(id),
      getApplicationStages(id),
      getComments(id),
    ])
      .then(([app, stagePage, commentPage]) => {
        if (!ignore) {
          setApplication(app);
          setStages(stagePage.results);
          setComments(commentPage.results);
        }
      })
      .catch((error) => {
        if (!ignore) {
          onError(errorText(error));
        }
      });
    return () => {
      ignore = true;
    };
  }, [id, onError]);

  async function run(name: string, work: () => Promise<void>) {
    setBusy(name);
    setNotice("");
    try {
      await work();
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy("");
    }
  }

  if (!application) {
    return <p className="text-sm text-zinc-500">{notice || "Loading review…"}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/reviews" className="text-sm font-semibold text-amal-red">
          ← Reviews
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          {application.applicant.name}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          {application.job_opening_name} · {labelFor(application.status)}
        </p>
      </div>
      {notice ? (
        <p className="rounded-lg border border-amal-red/30 bg-amal-white px-3 py-2 text-sm text-amal-red">
          {notice}
        </p>
      ) : null}
      <section className="rounded-2xl border border-black/10 bg-amal-white p-5">
        <h2 className="text-sm font-bold">Stages</h2>
        <ul className="mt-3 space-y-4">
          {stages.map((row) => (
            <li key={row.id} className="rounded-lg bg-amal-sheet p-3 text-sm">
              <p className="font-semibold">{row.name || "Review"}</p>
              <p className="text-zinc-500">{labelFor(row.status)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <GhostButton
                  type="button"
                  disabled={busy !== ""}
                  onClick={() =>
                    void run("request", async () => {
                      const updated = await requestInterview(row.id);
                      setStages((current) =>
                        current.map((item) =>
                          item.id === row.id ? updated : item,
                        ),
                      );
                    })
                  }
                >
                  Request interview
                </GhostButton>
                <GhostButton
                  type="button"
                  disabled={busy !== ""}
                  onClick={() =>
                    void run("status", async () => {
                      const updated = await setManagerStageStatus(
                        row.id,
                        "rejected",
                      );
                      setStages((current) =>
                        current.map((item) =>
                          item.id === row.id ? updated : item,
                        ),
                      );
                    })
                  }
                >
                  Reject stage
                </GhostButton>
                <GhostButton
                  type="button"
                  disabled={busy !== ""}
                  onClick={() =>
                    void run("complete", async () => {
                      const updated = await completeStage(row.id, feedback);
                      setStages((current) =>
                        current.map((item) =>
                          item.id === row.id ? updated : item,
                        ),
                      );
                    })
                  }
                >
                  Complete
                </GhostButton>
              </div>
            </li>
          ))}
        </ul>
        <Field label="Interview feedback">
          <textarea
            className={`${inputClass} h-20 py-2`}
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
          />
        </Field>
      </section>
      <section className="rounded-2xl border border-black/10 bg-amal-white p-5">
        <h2 className="text-sm font-bold">Comments</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {comments.map((row) => (
            <li key={row.id} className="rounded-lg bg-amal-sheet px-3 py-2">
              {row.text}
            </li>
          ))}
        </ul>
        <Field label="Comment">
          <textarea
            className={`${inputClass} h-20 py-2`}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>
        <PrimaryButton
          type="button"
          disabled={busy === "comment" || !note.trim()}
          onClick={() =>
            void run("comment", async () => {
              const created = await addComment(id, note.trim());
              setComments((current) => [...current, created]);
              setNote("");
            })
          }
        >
          {busy === "comment" ? "Saving…" : "Save comment"}
        </PrimaryButton>
      </section>
    </div>
  );
}
