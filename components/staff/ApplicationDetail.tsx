"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ApiError, getJobOpening, mediaUrl } from "@/lib/api";
import {
  addComment,
  extendAssessment,
  getApplicationStages,
  getAssessment,
  getComments,
  getStaffApplication,
  getTimeline,
  handoffToClients,
  scoreResume,
  sendAssessmentInvite,
} from "@/lib/staff-api";
import { labelFor } from "@/lib/status";
import type {
  ApplicationAssessment,
  ApplicationStage,
  Comment,
  StaffApplication,
} from "@/lib/types";
import { Field, GhostButton, PrimaryButton, inputClass } from "./ui";
import { CareersBackLink } from "./CareersBackLink";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

function scoreText(value: string | number | null | undefined): string {
  if (value == null || value === "") {
    return "—";
  }
  return String(value);
}

export function ApplicationDetail({ id }: { id: number }) {
  const [application, setApplication] = useState<StaffApplication | null>(null);
  const [stages, setStages] = useState<ApplicationStage[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [timeline, setTimeline] = useState<
    { type: string; date: string | null; label: string }[]
  >([]);
  const [assessment, setAssessment] = useState<ApplicationAssessment | null>(
    null,
  );
  const [score, setScore] = useState<{
    ai_relevance_score: number;
    ai_relevance_rationale: string;
  } | null>(null);
  const [clients, setClients] = useState<
    { id: number; first_name: string; last_name: string; email: string }[]
  >([]);
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [busy, setBusy] = useState("");
  const onError = useCallback((value: string) => setNotice(value), []);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      getStaffApplication(id),
      getApplicationStages(id),
      getComments(id),
      getTimeline(id),
      getAssessment(id),
    ])
      .then(async ([app, stagePage, commentPage, events, tests]) => {
        if (ignore) {
          return;
        }
        setApplication(app);
        setStages(stagePage.results);
        setComments(commentPage.results);
        setTimeline(events);
        setAssessment(tests);
        setInviteUrl(tests.invite_url ?? "");
        const opening = await getJobOpening(app.job_opening);
        if (!ignore) {
          setClients(opening.client_users ?? []);
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
    return (
      <p className="text-sm text-zinc-500">
        {notice || "Loading application…"}
      </p>
    );
  }

  const resume = mediaUrl(application.resume);

  return (
    <div className="space-y-6">
      <div>
        <CareersBackLink
          href="/staff"
          className="text-sm font-semibold text-amal-red"
        >
          ← Careers
        </CareersBackLink>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          {application.applicant.name}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          {application.job_opening_name} · {labelFor(application.status)} ·{" "}
          {application.applied_at.slice(0, 10)}
        </p>
      </div>

      {notice ? (
        <p className="rounded-lg border border-amal-red/30 bg-amal-white px-3 py-2 text-sm text-amal-red">
          {notice}
        </p>
      ) : null}

      <section className="rounded-2xl border border-black/10 bg-amal-white p-5">
        <h2 className="text-sm font-bold">Applicant</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">Email</dt>
            <dd className="font-semibold">{application.applicant.email}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">City</dt>
            <dd className="font-semibold">{application.applicant.city || "—"}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Phone</dt>
            <dd className="font-semibold">
              {application.applicant.contact || "—"}
            </dd>
          </div>
        </dl>
        {resume ? (
          <a
            href={resume}
            className="mt-4 inline-block text-sm font-semibold text-amal-red"
            target="_blank"
            rel="noreferrer"
          >
            Open resume
          </a>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">No resume on file.</p>
        )}
      </section>

      <section className="rounded-2xl border border-black/10 bg-amal-white p-5">
        <h2 className="text-sm font-bold">Scores</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <PrimaryButton
            type="button"
            disabled={busy === "score"}
            onClick={() =>
              void run("score", async () => {
                const result = await scoreResume(id);
                setScore(result);
              })
            }
          >
            {busy === "score" ? "Scoring…" : "Run resume score"}
          </PrimaryButton>
        </div>
        {score ? (
          <p className="mt-3 text-sm">
            <span className="font-bold">{score.ai_relevance_score}</span>
            <span className="ml-2 text-zinc-600">{score.ai_relevance_rationale}</span>
          </p>
        ) : null}
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
          <p>
            First test: {scoreText(assessment?.first_test?.score_percentage)}
          </p>
          <p>Video: {scoreText(assessment?.video_test?.score_percentage)}</p>
          <p>
            Questionnaire:{" "}
            {scoreText(assessment?.questionnaire?.score_percentage)}
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
          <Link className="text-amal-red" href={`/staff/applications/${id}/results/first-test`}>
            First-test result
          </Link>
          <Link className="text-amal-red" href={`/staff/applications/${id}/results/video`}>
            Video result
          </Link>
          <Link
            className="text-amal-red"
            href={`/staff/applications/${id}/results/questionnaire`}
          >
            Questionnaire result
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-black/10 bg-amal-white p-5">
        <h2 className="text-sm font-bold">Assessment invite</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <PrimaryButton
            type="button"
            disabled={busy === "invite" || Boolean(assessment?.invite_token)}
            onClick={() =>
              void run("invite", async () => {
                const created = await sendAssessmentInvite(id);
                setInviteUrl(created.invite_url);
                setAssessment((current) =>
                  current
                    ? {
                        ...current,
                        invite_token: created.invite_token,
                        expires_at: created.expires_at,
                        invite_url: created.invite_url,
                      }
                    : current,
                );
              })
            }
          >
            {busy === "invite" ? "Sending…" : "Send invite"}
          </PrimaryButton>
          {[3, 5, 7].map((days) => (
            <GhostButton
              key={days}
              type="button"
              disabled={busy === "extend" || !assessment?.invite_token}
              onClick={() =>
                void run("extend", async () => {
                  const extended = await extendAssessment(
                    id,
                    days as 3 | 5 | 7,
                  );
                  setInviteUrl(extended.invite_url);
                  setAssessment((current) =>
                    current
                      ? { ...current, expires_at: extended.expires_at }
                      : current,
                  );
                })
              }
            >
              Extend {days}d
            </GhostButton>
          ))}
        </div>
        {inviteUrl ? (
          <p className="mt-3 break-all text-sm text-zinc-600">{inviteUrl}</p>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">No invite yet.</p>
        )}
        {assessment?.expires_at ? (
          <p className="mt-1 text-sm text-zinc-500">
            Expires {assessment.expires_at.slice(0, 16).replace("T", " ")}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-black/10 bg-amal-white p-5">
        <h2 className="text-sm font-bold">Client handoff</h2>
        {clients.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            No client users are linked to this role.
          </p>
        ) : (
          <form
            className="mt-3 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void run("handoff", async () => {
                await handoffToClients(id, selectedClients);
              });
            }}
          >
            {clients.map((row) => (
              <label key={row.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedClients.includes(row.id)}
                  onChange={(event) =>
                    setSelectedClients((current) =>
                      event.target.checked
                        ? [...current, row.id]
                        : current.filter((value) => value !== row.id),
                    )
                  }
                />
                {row.first_name} {row.last_name} · {row.email}
              </label>
            ))}
            <PrimaryButton
              type="submit"
              disabled={busy === "handoff" || selectedClients.length === 0}
            >
              {busy === "handoff" ? "Sending…" : "Hand to selected clients"}
            </PrimaryButton>
          </form>
        )}
      </section>

      <section className="rounded-2xl border border-black/10 bg-amal-white p-5">
        <h2 className="text-sm font-bold">Stages</h2>
        {stages.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">No stages assigned.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {stages.map((row) => (
              <li key={row.id} className="rounded-lg bg-amal-sheet px-3 py-2">
                <p className="font-semibold">{row.name || "Review"}</p>
                <p className="text-zinc-500">{labelFor(row.status)}</p>
              </li>
            ))}
          </ul>
        )}
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
        <Field label="Add a comment">
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

      <section className="rounded-2xl border border-black/10 bg-amal-white p-5">
        <h2 className="text-sm font-bold">Timeline</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {timeline.map((event, index) => (
            <li key={`${event.type}-${index}`}>
              <span className="text-zinc-500">
                {event.date ? event.date.slice(0, 10) : "—"}
              </span>{" "}
              {event.label}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
