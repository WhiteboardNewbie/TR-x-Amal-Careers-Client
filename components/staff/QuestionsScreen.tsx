"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { preventFocusScroll } from "@/lib/prevent-focus-scroll";
import {
  createBankQuestion,
  createVideoPrompt,
  getAssessmentSettings,
  getBankQuestions,
  getVideoPrompts,
  patchAssessmentSetting,
  patchBankQuestion,
  patchVideoPrompt,
} from "@/lib/staff-api";
import type { AssessmentSetting, BankQuestion, VideoPrompt } from "@/lib/types";
import { CheckIcon, XIcon } from "./icons";
import { StaffBanner } from "./StaffBanner";
import { Field, GhostButton, Modal, PrimaryButton, inputClass } from "./ui";

type Tab = "mcq" | "video" | "defaults";

const TABS: { id: Tab; label: string }[] = [
  { id: "mcq", label: "MCQ" },
  { id: "video", label: "Video" },
  { id: "defaults", label: "Assessment Defaults" },
];

const SETTING_LABEL: Record<string, string> = {
  first_test: "First test",
  video_test: "Video test",
  general_questionnaire: "Questionnaire",
};

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

function QuestionStatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex h-7 items-center justify-center gap-1 rounded-full px-3 text-xs font-semibold ${
        active
          ? "bg-emerald-100 text-emerald-800"
          : "bg-amal-sheet text-zinc-600"
      }`}
    >
      {active ? (
        <CheckIcon className="h-3.5 w-3.5" />
      ) : (
        <XIcon className="h-3.5 w-3.5" />
      )}
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function QuestionsScreen() {
  const [tab, setTab] = useState<Tab>("mcq");
  const [notice, setNotice] = useState("");
  const onError = useCallback((value: string) => setNotice(value), []);

  return (
    <div>
      <StaffBanner
        title="Assessment database"
        actions={
          <button
            type="button"
            className="inline-flex shrink-0 self-start rounded-xl border border-amal-white/40 bg-amal-white/10 px-4 py-2 text-sm font-semibold hover:bg-amal-white/20"
            onMouseDown={preventFocusScroll}
            onClick={() => setTab("defaults")}
          >
            Assessment Defaults
          </button>
        }
      >
        Multiple-choice questions, video prompts, and the three assessment
        defaults.
      </StaffBanner>
      {notice ? (
        <p className="mt-4 rounded-lg border border-amal-red/30 bg-amal-white px-3 py-2 text-sm text-amal-red">
          {notice}
        </p>
      ) : null}
      <div className="overflow-anchor-none mt-6 rounded-2xl border border-black/10 bg-amal-white p-4 md:p-6">
        <div className="mb-5 flex flex-wrap gap-2">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`rounded-lg px-3 py-2 text-sm font-bold ${
                tab === item.id
                  ? "bg-amal-red text-amal-white"
                  : "bg-amal-sheet text-zinc-600"
              }`}
              onMouseDown={preventFocusScroll}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        {tab === "mcq" ? <McqTab onError={onError} /> : null}
        {tab === "video" ? <VideoTab onError={onError} /> : null}
        {tab === "defaults" ? <DefaultsTab onError={onError} /> : null}
      </div>
    </div>
  );
}

function McqTab({ onError }: { onError: (value: string) => void }) {
  const [rows, setRows] = useState<BankQuestion[]>([]);
  const [tick, setTick] = useState(0);
  const [editing, setEditing] = useState<BankQuestion | "new" | null>(null);

  useEffect(() => {
    let ignore = false;
    getBankQuestions()
      .then((data) => {
        if (!ignore) {
          setRows(data);
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
  }, [tick, onError]);

  return (
    <div>
      <div className="mb-4">
        <PrimaryButton type="button" onClick={() => setEditing("new")}>
          Add question
        </PrimaryButton>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500">No questions yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-zinc-500">
                <th className="py-2">Question</th>
                <th>Answer</th>
                <th className="text-center">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-black/5">
                  <td className="py-3 font-semibold">{row.question_text}</td>
                  <td>{row.correct_option}</td>
                  <td className="text-center">
                    <QuestionStatusBadge active={row.is_active} />
                  </td>
                  <td className="text-right">
                    <GhostButton type="button" onClick={() => setEditing(row)}>
                      Edit
                    </GhostButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing ? (
        <McqModal
          question={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setTick((value) => value + 1);
          }}
          onError={onError}
        />
      ) : null}
    </div>
  );
}

function McqModal({
  question,
  onClose,
  onSaved,
  onError,
}: {
  question: BankQuestion | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (value: string) => void;
}) {
  const [text, setText] = useState(question?.question_text ?? "");
  const [a, setA] = useState(question?.option_a ?? "");
  const [b, setB] = useState(question?.option_b ?? "");
  const [c, setC] = useState(question?.option_c ?? "");
  const [d, setD] = useState(question?.option_d ?? "");
  const [correct, setCorrect] = useState(question?.correct_option ?? "A");
  const [active, setActive] = useState(question?.is_active ?? true);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const body = {
      question_text: text,
      option_a: a,
      option_b: b,
      option_c: c,
      option_d: d,
      correct_option: correct,
      is_active: active,
    };
    try {
      if (question) {
        await patchBankQuestion(question.id, body);
      } else {
        await createBankQuestion(body);
      }
      onSaved();
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={question ? "Edit question" : "Add question"} onClose={onClose}>
      <form onSubmit={onSubmit}>
        <Field label="Question">
          <textarea
            className={`${inputClass} h-20 py-2`}
            value={text}
            onChange={(event) => setText(event.target.value)}
            required
          />
        </Field>
        {["A", "B", "C", "D"].map((letter, index) => {
          const value = [a, b, c, d][index];
          const setter = [setA, setB, setC, setD][index];
          return (
            <Field key={letter} label={`Option ${letter}`}>
              <input
                className={inputClass}
                value={value}
                onChange={(event) => setter(event.target.value)}
                required
              />
            </Field>
          );
        })}
        <Field label="Correct option">
          <select
            className={inputClass}
            value={correct}
            onChange={(event) => setCorrect(event.target.value)}
          >
            {["A", "B", "C", "D"].map((letter) => (
              <option key={letter} value={letter}>
                {letter}
              </option>
            ))}
          </select>
        </Field>
        <label className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
          />
          Active
        </label>
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </PrimaryButton>
      </form>
    </Modal>
  );
}

function VideoTab({ onError }: { onError: (value: string) => void }) {
  const [rows, setRows] = useState<VideoPrompt[]>([]);
  const [tick, setTick] = useState(0);
  const [editing, setEditing] = useState<VideoPrompt | "new" | null>(null);

  useEffect(() => {
    let ignore = false;
    getVideoPrompts()
      .then((data) => {
        if (!ignore) {
          setRows(data);
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
  }, [tick, onError]);

  return (
    <div>
      <div className="mb-4">
        <PrimaryButton type="button" onClick={() => setEditing("new")}>
          Add prompt
        </PrimaryButton>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500">No video prompts yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-zinc-500">
                <th className="py-2">Prompt</th>
                <th className="text-center">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-black/5">
                  <td className="py-3 font-semibold">{row.prompt}</td>
                  <td className="text-center">
                    <QuestionStatusBadge active={row.is_active} />
                  </td>
                  <td className="text-right">
                    <GhostButton type="button" onClick={() => setEditing(row)}>
                      Edit
                    </GhostButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing ? (
        <VideoModal
          prompt={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setTick((value) => value + 1);
          }}
          onError={onError}
        />
      ) : null}
    </div>
  );
}

function VideoModal({
  prompt,
  onClose,
  onSaved,
  onError,
}: {
  prompt: VideoPrompt | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (value: string) => void;
}) {
  const [text, setText] = useState(prompt?.prompt ?? "");
  const [active, setActive] = useState(prompt?.is_active ?? true);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (prompt) {
        await patchVideoPrompt(prompt.id, { prompt: text, is_active: active });
      } else {
        await createVideoPrompt(text);
      }
      onSaved();
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={prompt ? "Edit prompt" : "Add prompt"} onClose={onClose}>
      <form onSubmit={onSubmit}>
        <Field label="Prompt">
          <textarea
            className={`${inputClass} h-24 py-2`}
            value={text}
            onChange={(event) => setText(event.target.value)}
            required
          />
        </Field>
        {prompt ? (
          <label className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
            />
            Active
          </label>
        ) : null}
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </PrimaryButton>
      </form>
    </Modal>
  );
}

function DefaultsTab({ onError }: { onError: (value: string) => void }) {
  const [rows, setRows] = useState<AssessmentSetting[]>([]);
  const [drafts, setDrafts] = useState<Record<string, AssessmentSetting>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let ignore = false;
    getAssessmentSettings()
      .then((data) => {
        if (!ignore) {
          setRows(data);
          setDrafts(Object.fromEntries(data.map((row) => [row.test_type, row])));
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
  }, [onError]);

  function update(type: string, key: keyof AssessmentSetting, value: number) {
    setDrafts((current) => ({
      ...current,
      [type]: { ...current[type], [key]: value },
    }));
  }

  async function save() {
    setBusy(true);
    try {
      const updated = await Promise.all(
        rows.map((row) =>
          patchAssessmentSetting(row.test_type, drafts[row.test_type]),
        ),
      );
      setRows(updated);
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => {
        const draft = drafts[row.test_type] ?? row;
        return (
          <section
            key={row.test_type}
            className="rounded-xl border border-black/10 p-4"
          >
            <h2 className="mb-3 text-sm font-bold">
              {SETTING_LABEL[row.test_type] ?? row.test_type}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Total questions">
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  value={draft.total_questions}
                  onChange={(event) =>
                    update(
                      row.test_type,
                      "total_questions",
                      Number(event.target.value),
                    )
                  }
                />
              </Field>
              {row.test_type === "first_test" ? (
                <>
                  <Field label="Technical">
                    <input
                      className={inputClass}
                      type="number"
                      min={0}
                      value={draft.technical_question_count ?? 0}
                      onChange={(event) =>
                        update(
                          row.test_type,
                          "technical_question_count",
                          Number(event.target.value),
                        )
                      }
                    />
                  </Field>
                  <Field label="Behavioral">
                    <input
                      className={inputClass}
                      type="number"
                      min={0}
                      value={draft.behavioral_question_count ?? 0}
                      onChange={(event) =>
                        update(
                          row.test_type,
                          "behavioral_question_count",
                          Number(event.target.value),
                        )
                      }
                    />
                  </Field>
                </>
              ) : null}
              <Field label="Time limit (minutes)">
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  value={draft.time_limit_minutes}
                  onChange={(event) =>
                    update(
                      row.test_type,
                      "time_limit_minutes",
                      Number(event.target.value),
                    )
                  }
                />
              </Field>
              <Field label="Validity (days)">
                <input
                  className={inputClass}
                  type="number"
                  min={1}
                  value={draft.validity_days}
                  onChange={(event) =>
                    update(
                      row.test_type,
                      "validity_days",
                      Number(event.target.value),
                    )
                  }
                />
              </Field>
            </div>
          </section>
        );
      })}
      <PrimaryButton type="button" disabled={busy} onClick={() => void save()}>
        {busy ? "Saving…" : "Save defaults"}
      </PrimaryButton>
    </div>
  );
}
