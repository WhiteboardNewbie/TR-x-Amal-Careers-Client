"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  answerFirstTest,
  answerQuestionnaire,
  completeFirstTest,
  completeQuestionnaire,
  completeVideoTest,
  getPublicInvite,
  startFirstTest,
  startQuestionnaire,
  startVideoTest,
  uploadVideoAnswer,
  type InvitePayload,
  type McqItem,
  type VideoItem,
} from "@/lib/public-api";
import { PrimaryButton, inputClass } from "@/components/staff/ui";

type Step =
  | "load"
  | "first"
  | "video"
  | "questionnaire"
  | "done"
  | "missing"
  | "expired"
  | "error";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

export function AssessmentFlow({ token }: { token: string }) {
  const [step, setStep] = useState<Step>("load");
  const [invite, setInvite] = useState<InvitePayload | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let ignore = false;
    getPublicInvite(token)
      .then((data) => {
        if (ignore) {
          return;
        }
        setInvite(data);
        if (data.first_test.status !== "completed") {
          setStep("first");
        } else if (data.video_test.status !== "completed") {
          setStep("video");
        } else if (data.questionnaire.status !== "completed") {
          setStep("questionnaire");
        } else {
          setStep("done");
        }
      })
      .catch((error) => {
        if (ignore) {
          return;
        }
        if (error instanceof ApiError && error.status === 404) {
          setStep("missing");
        } else if (error instanceof ApiError && error.status === 410) {
          setStep("expired");
        } else {
          setNotice(errorText(error));
          setStep("error");
        }
      });
    return () => {
      ignore = true;
    };
  }, [token]);

  if (step === "load") {
    return <p className="text-sm text-zinc-500">Loading assessment…</p>;
  }
  if (step === "missing") {
    return <StatusCard title="Not found" body="This assessment link is not valid." />;
  }
  if (step === "expired") {
    return (
      <StatusCard title="Expired" body="This assessment invite has expired." />
    );
  }
  if (step === "error") {
    return <StatusCard title="Unavailable" body={notice || "Request failed."} />;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
        Assessment
      </p>
      <h1 className="mt-2 text-2xl font-semibold">
        {invite?.role.title ?? "Assessment"}
      </h1>
      <p className="mt-1 text-sm text-zinc-600">{invite?.applicant.name}</p>
      {step === "first" ? (
        <McqSession
          title="First test"
          onStart={() => startFirstTest(token)}
          onAnswer={(id, option) => answerFirstTest(token, id, option)}
          onComplete={() => completeFirstTest(token)}
          onDone={() => setStep("video")}
        />
      ) : null}
      {step === "video" ? (
        <VideoSession
          onStart={() => startVideoTest(token)}
          onUpload={(id, file) => uploadVideoAnswer(token, id, file)}
          onComplete={() => completeVideoTest(token)}
          onDone={() => setStep("questionnaire")}
        />
      ) : null}
      {step === "questionnaire" ? (
        <McqSession
          title="Questionnaire"
          onStart={() => startQuestionnaire(token)}
          onAnswer={(id, option) => answerQuestionnaire(token, id, option)}
          onComplete={() => completeQuestionnaire(token)}
          onDone={() => setStep("done")}
        />
      ) : null}
      {step === "done" ? (
        <p className="mt-8 text-sm text-zinc-600">
          Thank you. Your assessment is complete.
        </p>
      ) : null}
    </div>
  );
}

function StatusCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-3 text-sm text-zinc-600">{body}</p>
    </div>
  );
}

function McqSession({
  title,
  onStart,
  onAnswer,
  onComplete,
  onDone,
}: {
  title: string;
  onStart: () => Promise<McqItem[]>;
  onAnswer: (id: number, option: string) => Promise<unknown>;
  onComplete: () => Promise<unknown>;
  onDone: () => void;
}) {
  const [items, setItems] = useState<McqItem[]>([]);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const current = items[index];

  async function begin() {
    setBusy(true);
    setNotice("");
    try {
      const rows = await onStart();
      setItems(rows);
    } catch (error) {
      setNotice(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!current || !choice) {
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      await onAnswer(current.id, choice);
      if (index + 1 < items.length) {
        setIndex(index + 1);
        setChoice("");
      } else {
        await onComplete();
        onDone();
      }
    } catch (error) {
      setNotice(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-black/10 bg-amal-white p-5">
      <h2 className="text-lg font-bold">{title}</h2>
      {notice ? <p className="mt-3 text-sm text-amal-red">{notice}</p> : null}
      {items.length === 0 ? (
        <div className="mt-4">
          <PrimaryButton type="button" disabled={busy} onClick={() => void begin()}>
            {busy ? "Starting…" : "Start"}
          </PrimaryButton>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Question {index + 1} of {items.length}
          </p>
          <p className="mt-2 font-semibold">{current.question_text}</p>
          <div className="mt-4 space-y-2">
            {(["A", "B", "C", "D"] as const).map((letter) => {
              const label = {
                A: current.option_a,
                B: current.option_b,
                C: current.option_c,
                D: current.option_d,
              }[letter];
              return (
                <label key={letter} className="flex items-start gap-2 text-sm">
                  <input
                    type="radio"
                    name={`q-${current.id}`}
                    checked={choice === letter}
                    onChange={() => setChoice(letter)}
                  />
                  <span>
                    {letter}. {label}
                  </span>
                </label>
              );
            })}
          </div>
          <div className="mt-4">
            <PrimaryButton
              type="button"
              disabled={busy || !choice}
              onClick={() => void save()}
            >
              {busy
                ? "Saving…"
                : index + 1 < items.length
                  ? "Next"
                  : "Finish"}
            </PrimaryButton>
          </div>
        </div>
      )}
    </section>
  );
}

function VideoSession({
  onStart,
  onUpload,
  onComplete,
  onDone,
}: {
  onStart: () => Promise<VideoItem[]>;
  onUpload: (id: number, file: File) => Promise<unknown>;
  onComplete: () => Promise<unknown>;
  onDone: () => void;
}) {
  const [items, setItems] = useState<VideoItem[]>([]);
  const [index, setIndex] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const current = items[index];

  async function begin() {
    setBusy(true);
    setNotice("");
    try {
      setItems(await onStart());
    } catch (error) {
      setNotice(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!current || !file) {
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      await onUpload(current.id, file);
      if (index + 1 < items.length) {
        setIndex(index + 1);
        setFile(null);
      } else {
        await onComplete();
        onDone();
      }
    } catch (error) {
      setNotice(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-black/10 bg-amal-white p-5">
      <h2 className="text-lg font-bold">Video</h2>
      {notice ? <p className="mt-3 text-sm text-amal-red">{notice}</p> : null}
      {items.length === 0 ? (
        <div className="mt-4">
          <PrimaryButton type="button" disabled={busy} onClick={() => void begin()}>
            {busy ? "Starting…" : "Start"}
          </PrimaryButton>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Prompt {index + 1} of {items.length}
          </p>
          <p className="mt-2 font-semibold">{current.prompt}</p>
          <input
            className={`${inputClass} mt-4`}
            type="file"
            accept="video/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <div className="mt-4">
            <PrimaryButton
              type="button"
              disabled={busy || !file}
              onClick={() => void save()}
            >
              {busy
                ? "Uploading…"
                : index + 1 < items.length
                  ? "Next"
                  : "Finish"}
            </PrimaryButton>
          </div>
        </div>
      )}
    </section>
  );
}
