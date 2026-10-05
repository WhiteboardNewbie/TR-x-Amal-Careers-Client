"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  decideClientApplication,
  getClientApplication,
  openClientResume,
  type ClientApplicationDetail,
} from "@/lib/client-api";
import { labelFor } from "@/lib/status";
import { GhostButton, PrimaryButton } from "@/components/staff/ui";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

export function ClientApplication({ id }: { id: number }) {
  const [row, setRow] = useState<ClientApplicationDetail | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    let ignore = false;
    getClientApplication(id)
      .then((data) => {
        if (!ignore) {
          setRow(data);
        }
      })
      .catch((error) => {
        if (!ignore) {
          setNotice(errorText(error));
        }
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  async function decide(decision: "approved" | "rejected") {
    setBusy(decision);
    setNotice("");
    try {
      const review = await decideClientApplication(id, decision);
      setRow((current) =>
        current
          ? { ...current, review: { ...current.review, status: review.status } }
          : current,
      );
    } catch (error) {
      setNotice(errorText(error));
    } finally {
      setBusy("");
    }
  }

  if (!row) {
    return <p className="text-sm text-zinc-500">{notice || "Loading…"}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/client/roles/${row.role.slug}`}
          className="text-sm font-semibold text-amal-red"
        >
          ← {row.role.title}
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          {row.applicant_name}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          {labelFor(row.status)} · Your review {labelFor(row.review.status)}
        </p>
      </div>
      {notice ? (
        <p className="rounded-lg border border-amal-red/30 bg-amal-white px-3 py-2 text-sm text-amal-red">
          {notice}
        </p>
      ) : null}
      <section className="rounded-2xl border border-black/10 bg-amal-white p-5">
        {row.has_resume ? (
          <GhostButton
            type="button"
            onClick={() =>
              void openClientResume(id).catch((error) =>
                setNotice(errorText(error)),
              )
            }
          >
            Open resume
          </GhostButton>
        ) : (
          <p className="text-sm text-zinc-500">No resume on file.</p>
        )}
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
          <p>First test: {row.first_test?.score_percentage ?? "—"}</p>
          <p>Video: {row.video_test?.score_percentage ?? "—"}</p>
          <p>Questionnaire: {row.questionnaire?.score_percentage ?? "—"}</p>
        </div>
      </section>
      <section className="rounded-2xl border border-black/10 bg-amal-white p-5">
        <h2 className="text-sm font-bold">Decision</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <PrimaryButton
            type="button"
            disabled={busy !== "" || row.review.status !== "pending"}
            onClick={() => void decide("approved")}
          >
            {busy === "approved" ? "Saving…" : "Approve"}
          </PrimaryButton>
          <GhostButton
            type="button"
            disabled={busy !== "" || row.review.status !== "pending"}
            onClick={() => void decide("rejected")}
          >
            {busy === "rejected" ? "Saving…" : "Reject"}
          </GhostButton>
        </div>
      </section>
      <section className="rounded-2xl border border-black/10 bg-amal-white p-5">
        <h2 className="text-sm font-bold">Stages</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {row.stages.map((stage) => (
            <li key={stage.id}>
              {stage.name || "Review"} · {labelFor(stage.status)}
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-2xl border border-black/10 bg-amal-white p-5">
        <h2 className="text-sm font-bold">Comments</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {row.comments.map((comment) => (
            <li key={comment.id} className="rounded-lg bg-amal-sheet px-3 py-2">
              {comment.text}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
