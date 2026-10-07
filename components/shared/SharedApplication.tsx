"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  getSharedApplication,
  sharedResumeUrl,
  type SharedApplication as SharedPayload,
} from "@/lib/public-api";
import { labelFor } from "@/lib/status";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

export function SharedApplication({ id }: { id: string }) {
  const [row, setRow] = useState<SharedPayload | null>(null);
  const [state, setState] = useState<"load" | "ready" | "missing" | "unavailable">(
    "load",
  );
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let ignore = false;
    getSharedApplication(id)
      .then((data) => {
        if (!ignore) {
          setRow(data);
          setState("ready");
        }
      })
      .catch((error) => {
        if (ignore) {
          return;
        }
        if (error instanceof ApiError && error.status === 404) {
          setState("missing");
        } else if (error instanceof ApiError && error.status === 410) {
          setState("unavailable");
        } else {
          setNotice(errorText(error));
          setState("unavailable");
        }
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  if (state === "load") {
    return <p className="px-4 py-16 text-center text-sm text-zinc-500">Loading…</p>;
  }
  if (state === "missing") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not found</h1>
        <p className="mt-3 text-sm text-zinc-600">This share link is not valid.</p>
      </div>
    );
  }
  if (state !== "ready" || !row) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Unavailable</h1>
        <p className="mt-3 text-sm text-zinc-600">
          {notice || "This share link is inactive or expired."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Shared application
        </p>
        <h1 className="mt-2 text-2xl font-semibold">{row.applicant.name}</h1>
        <p className="mt-1 text-sm text-zinc-600">
          {row.role.title} · {row.role.department_name} · {row.role.location}
        </p>
      </div>
      <section className="rounded-2xl border border-black/10 bg-amal-white p-5 text-sm">
        <p>
          <span className="text-zinc-500">Email</span>
          <br />
          <span className="font-semibold">{row.applicant.email}</span>
        </p>
        {row.has_resume ? (
          <a
            href={sharedResumeUrl(id)}
            className="mt-4 inline-block font-semibold text-amal-red"
            target="_blank"
            rel="noreferrer"
          >
            Open resume
          </a>
        ) : (
          <p className="mt-4 text-zinc-500">No resume on file.</p>
        )}
      </section>
      <TestBlock title="First test" section={row.first_test} kind="mcq" />
      <TestBlock title="Video" section={row.video_test} kind="video" />
      <TestBlock
        title="Questionnaire"
        section={row.questionnaire}
        kind="questionnaire"
      />
    </div>
  );
}

function TestBlock({
  title,
  section,
  kind,
}: {
  title: string;
  section:
    | SharedPayload["first_test"]
    | SharedPayload["video_test"]
    | SharedPayload["questionnaire"];
  kind: "mcq" | "video" | "questionnaire";
}) {
  return (
    <section className="rounded-2xl border border-black/10 bg-amal-white p-5">
      <h2 className="text-sm font-bold">{title}</h2>
      {!section ? (
        <p className="mt-2 text-sm text-zinc-500">No result yet.</p>
      ) : (
        <div className="mt-2 text-sm">
          <p className="text-zinc-600">
            {labelFor(section.status)} · Score {section.score_percentage ?? "—"}
          </p>
          <ol className="mt-3 space-y-2">
            {kind === "video"
              ? ((section as SharedPayload["video_test"])?.questions ?? []).map(
                  (item) => (
                    <li key={item.order}>
                      <p className="font-semibold">
                        {item.order}. {item.prompt}
                      </p>
                      <p className="text-zinc-600">
                        {item.transcript || "No transcript yet."}
                      </p>
                    </li>
                  ),
                )
              : kind === "questionnaire"
                ? (
                    (section as SharedPayload["questionnaire"])?.questions ?? []
                  ).map((item) => (
                    <li key={item.order}>
                      <p className="font-semibold">
                        {item.order}. {item.question_text}
                      </p>
                      <p className="whitespace-pre-wrap text-zinc-600">
                        {item.answer_text?.trim() || "—"}
                      </p>
                    </li>
                  ))
                : (
                    (section as SharedPayload["first_test"])?.questions ?? []
                  ).map((item) => (
                    <li key={item.order}>
                      <p className="font-semibold">
                        {item.order}. {item.question_text}
                      </p>
                      <p className="text-zinc-600">
                        Answer: {item.selected_option || "—"}
                      </p>
                    </li>
                  ))}
          </ol>
        </div>
      )}
    </section>
  );
}
