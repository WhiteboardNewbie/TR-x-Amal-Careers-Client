"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import { preventFocusScroll } from "@/lib/prevent-focus-scroll";
import {
  createBankQuestion,
  createQuestionnairePrompt,
  createVideoPrompt,
  getAssessmentInviteSettings,
  getAssessmentSettings,
  getBankQuestions,
  getOrgDepartments,
  getQuestionnairePrompts,
  getSkillsPage,
  getVideoPrompts,
  patchAssessmentInviteSettings,
  patchAssessmentSetting,
  patchBankQuestion,
  patchQuestionnairePrompt,
  patchVideoPrompt,
} from "@/lib/staff-api";
import type {
  AssessmentInviteSettings,
  AssessmentSetting,
  BankQuestion,
  Department,
  QuestionnairePrompt,
  Skill,
  VideoPrompt,
} from "@/lib/types";
import {
  CheckIcon,
  EyeIcon,
  FileTextIcon,
  MessageSquareIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
  TrashIcon,
  VideoIcon,
  XIcon,
} from "./icons";
import { StaffBanner } from "./StaffBanner";
import { Field, GhostButton, Modal, PrimaryButton, inputClass } from "./ui";

type Tab = "mcq" | "video" | "questionnaire";

type Filters = {
  departmentId: number | "";
  difficulty: string;
  skillId: number | "";
  domain: string;
  activity: "active" | "inactive" | "all";
  search: string;
};

const EMPTY_FILTERS: Filters = {
  departmentId: "",
  difficulty: "",
  skillId: "",
  domain: "",
  activity: "active",
  search: "",
};

const DOMAIN_OPTIONS = [
  { value: "", label: "All" },
  { value: "technical", label: "Technical" },
  { value: "behavioral", label: "Behavioral" },
];

const DIFFICULTY_OPTIONS = [
  { value: "", label: "All" },
  { value: "easy", label: "Easy" },
  { value: "intermediate", label: "Intermediate" },
  { value: "hard", label: "Hard" },
];

const SETTING_LABEL: Record<string, string> = {
  first_test: "MCQ Based Settings",
  video_test: "Video Based Settings",
  general_questionnaire: "General Questions Based Settings",
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

function matchesFilters<
  T extends {
    is_active: boolean;
    department_id?: number | null;
    domain?: string | null;
    difficulty?: string | null;
    skill_ids?: number[];
  },
>(row: T, filters: Filters, text: string): boolean {
  if (filters.activity === "active" && !row.is_active) return false;
  if (filters.activity === "inactive" && row.is_active) return false;
  if (filters.departmentId !== "" && row.department_id !== filters.departmentId) {
    return false;
  }
  if (filters.domain && row.domain !== filters.domain) return false;
  if (filters.difficulty && row.difficulty !== filters.difficulty) return false;
  if (
    filters.skillId !== "" &&
    !(row.skill_ids ?? []).includes(filters.skillId)
  ) {
    return false;
  }
  if (filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    if (!text.toLowerCase().includes(q)) return false;
  }
  return true;
}

function deptName(
  departments: Department[],
  departmentId?: number | null,
): string {
  if (!departmentId) return "Unassigned";
  return departments.find((row) => row.id === departmentId)?.name ?? "Unassigned";
}

export function QuestionsScreen() {
  const [tab, setTab] = useState<Tab>("mcq");
  const [notice, setNotice] = useState("");
  const [defaultsOpen, setDefaultsOpen] = useState(false);
  const [mcq, setMcq] = useState<BankQuestion[]>([]);
  const [video, setVideo] = useState<VideoPrompt[]>([]);
  const [questionnaire, setQuestionnaire] = useState<QuestionnairePrompt[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [tick, setTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const onError = useCallback((value: string) => setNotice(value), []);
  const refresh = useCallback(() => {
    setLoading(true);
    setTick((value) => value + 1);
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      getBankQuestions(),
      getVideoPrompts(),
      getQuestionnairePrompts(),
      getOrgDepartments().catch(() => [] as Department[]),
      getSkillsPage()
        .then((page) => page.results)
        .catch(() => [] as Skill[]),
    ])
      .then(([nextMcq, nextVideo, nextQ, nextDepartments, nextSkills]) => {
        if (ignore) return;
        setMcq(nextMcq);
        setVideo(nextVideo);
        setQuestionnaire(
          [...nextQ].sort(
            (a, b) => a.question_order - b.question_order || a.id - b.id,
          ),
        );
        setDepartments(nextDepartments);
        setSkills(nextSkills);
      })
      .catch((error) => {
        if (!ignore) onError(errorText(error));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [tick, onError]);

  const totalActive =
    mcq.filter((row) => row.is_active).length +
    video.filter((row) => row.is_active).length +
    questionnaire.filter((row) => row.is_active).length;
  const totalInactive =
    mcq.filter((row) => !row.is_active).length +
    video.filter((row) => !row.is_active).length +
    questionnaire.filter((row) => !row.is_active).length;
  const totalQuestions = mcq.length + video.length + questionnaire.length;

  return (
    <div className="space-y-6">
      <StaffBanner
        title="Assessment Database"
        eyebrow="Talent Engine"
        actions={
          <button
            type="button"
            className="inline-flex shrink-0 self-start rounded-xl border border-amal-white/40 bg-amal-white/10 px-4 py-2 text-sm font-semibold hover:bg-amal-white/20"
            onMouseDown={preventFocusScroll}
            onClick={() => setDefaultsOpen(true)}
          >
            Assessment Defaults
          </button>
        }
      >
        Configure and maintain first-test, video, and questionnaire question
        pools in one place.
      </StaffBanner>

      {notice ? (
        <p className="rounded-lg border border-amal-red/30 bg-amal-white px-3 py-2 text-sm text-amal-red">
          {notice}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Total Questions" value={String(totalQuestions)} />
        <StatCard
          label="Active Questions"
          value={String(totalActive)}
          valueClassName="text-emerald-600"
        />
        <StatCard
          label="Inactive Questions"
          value={String(totalInactive)}
          valueClassName="text-amber-700"
          hint="Across all three pools; not shown in new candidate sessions"
        />
        <CoverageCard />
      </div>

      <div className="rounded-2xl border border-black/10 bg-amal-white p-4 shadow-sm md:p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Question Bank</h2>
        <p className="mt-0.5 text-sm text-zinc-500">
          Manage your test questions pool
        </p>

        <div className="mt-4 flex flex-wrap border-b border-black/10">
          <BankTab
            active={tab === "mcq"}
            label="MCQ Questions"
            count={mcq.length}
            icon={<FileTextIcon className="h-5 w-5" />}
            onClick={() => setTab("mcq")}
          />
          <BankTab
            active={tab === "video"}
            label="Video Questions"
            count={video.length}
            icon={<VideoIcon className="h-5 w-5" />}
            onClick={() => setTab("video")}
          />
          <BankTab
            active={tab === "questionnaire"}
            label="General Questions"
            count={questionnaire.length}
            icon={<MessageSquareIcon className="h-5 w-5" />}
            onClick={() => setTab("questionnaire")}
          />
        </div>

        <div className="mt-6">
          {loading ? (
            <p className="text-sm text-zinc-500">Loading questions…</p>
          ) : null}
          {tab === "mcq" ? (
            <McqPanel
              rows={mcq}
              departments={departments}
              skills={skills}
              onError={onError}
              onRefresh={refresh}
            />
          ) : null}
          {tab === "video" ? (
            <VideoPanel
              rows={video}
              departments={departments}
              skills={skills}
              onError={onError}
              onRefresh={refresh}
            />
          ) : null}
          {tab === "questionnaire" ? (
            <QuestionnairePanel
              rows={questionnaire}
              onError={onError}
              onRefresh={refresh}
            />
          ) : null}
        </div>
      </div>

      {defaultsOpen ? (
        <DefaultsModal
          onClose={() => setDefaultsOpen(false)}
          onError={onError}
        />
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  valueClassName = "text-zinc-900",
  hint,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-black/10 bg-amal-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className={`mt-1 text-3xl font-bold ${valueClassName}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

function CoverageCard() {
  return (
    <div className="rounded-xl border border-amal-red/20 bg-gradient-to-r from-amal-red/5 to-amal-sheet p-4 shadow-sm">
      <div className="flex items-start gap-2">
        <SparklesIcon className="mt-0.5 h-4 w-4 shrink-0 text-amal-red" />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-amal-red">
            Coverage
          </p>
          <p className="mt-1 text-sm font-semibold text-zinc-900">
            First Test, Video, and General Questionnaire
          </p>
        </div>
      </div>
    </div>
  );
}

function BankTab({
  active,
  label,
  count,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={preventFocusScroll}
      onClick={onClick}
      className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? "border-amal-red bg-amal-red/5 text-amal-red"
          : "border-transparent text-zinc-500 hover:border-black/20 hover:text-zinc-700"
      }`}
    >
      {icon}
      {label}
      <span
        className={`rounded-full px-2 py-0.5 text-xs ${
          active ? "bg-amal-red/15 text-amal-red" : "bg-amal-sheet text-zinc-600"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function MiniStats({
  total,
  active,
  inactive,
}: {
  total: number;
  active: number;
  inactive: number;
}) {
  return (
    <div className="mb-4 grid grid-cols-3 gap-3">
      <div className="rounded-lg border border-black/10 bg-amal-sheet px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Total Questions
        </p>
        <p className="text-lg font-bold text-zinc-900">{total}</p>
      </div>
      <div className="rounded-lg border border-black/10 bg-amal-sheet px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Active Questions
        </p>
        <p className="text-lg font-bold text-emerald-600">{active}</p>
      </div>
      <div className="rounded-lg border border-black/10 bg-amal-sheet px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Inactive Questions
        </p>
        <p className="text-lg font-bold text-amal-red">{inactive}</p>
      </div>
    </div>
  );
}

function FiltersBar({
  filters,
  onChange,
  departments,
  skills,
  showTaxonomy,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
  departments: Department[];
  skills: Skill[];
  showTaxonomy: boolean;
}) {
  const sel =
    "min-w-[120px] rounded-lg border border-black/15 bg-amal-white px-2 py-1.5 text-sm outline-none focus:border-amal-red focus:ring-1 focus:ring-amal-red/30";
  return (
    <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-black/10 bg-amal-white p-4">
      {showTaxonomy ? (
        <>
          <label className="text-xs font-medium text-zinc-500">
            Department
            <select
              className={`mt-1 block ${sel}`}
              value={filters.departmentId === "" ? "" : String(filters.departmentId)}
              onChange={(event) =>
                onChange({
                  ...filters,
                  departmentId: event.target.value
                    ? Number(event.target.value)
                    : "",
                })
              }
            >
              <option value="">All</option>
              {departments.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-zinc-500">
            Difficulty
            <select
              className={`mt-1 block ${sel}`}
              value={filters.difficulty}
              onChange={(event) =>
                onChange({ ...filters, difficulty: event.target.value })
              }
            >
              {DIFFICULTY_OPTIONS.map((row) => (
                <option key={row.value || "all"} value={row.value}>
                  {row.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-zinc-500">
            Skill
            <select
              className={`mt-1 block ${sel}`}
              value={filters.skillId === "" ? "" : String(filters.skillId)}
              onChange={(event) =>
                onChange({
                  ...filters,
                  skillId: event.target.value ? Number(event.target.value) : "",
                })
              }
            >
              <option value="">All</option>
              {skills.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-zinc-500">
            Domain
            <select
              className={`mt-1 block ${sel}`}
              value={filters.domain}
              onChange={(event) =>
                onChange({ ...filters, domain: event.target.value })
              }
            >
              {DOMAIN_OPTIONS.map((row) => (
                <option key={row.value || "all"} value={row.value}>
                  {row.label}
                </option>
              ))}
            </select>
          </label>
        </>
      ) : null}
      <label className="text-xs font-medium text-zinc-500">
        Activity
        <select
          className={`mt-1 block ${sel}`}
          value={filters.activity}
          onChange={(event) =>
            onChange({
              ...filters,
              activity: event.target.value as Filters["activity"],
            })
          }
        >
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
          <option value="all">All</option>
        </select>
      </label>
    </div>
  );
}

function SearchAddRow({
  search,
  onSearch,
  onAdd,
  addLabel,
}: {
  search: string;
  onSearch: (value: string) => void;
  onAdd: () => void;
  addLabel: string;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          className={`${inputClass} pl-9`}
          placeholder="Search questions"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
        />
      </div>
      <PrimaryButton type="button" onClick={onAdd}>
        <span className="inline-flex items-center gap-1.5">
          <PlusIcon className="h-4 w-4" />
          {addLabel}
        </span>
      </PrimaryButton>
    </div>
  );
}

function ActionIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="rounded-lg p-1.5 text-zinc-500 hover:bg-amal-sheet hover:text-amal-ink"
    >
      {children}
    </button>
  );
}

function TaxonomyFields({
  departments,
  skills,
  departmentId,
  domain,
  difficulty,
  skillIds,
  active,
  onDepartment,
  onDomain,
  onDifficulty,
  onSkillIds,
  onActive,
}: {
  departments: Department[];
  skills: Skill[];
  departmentId: number | "";
  domain: string;
  difficulty: string;
  skillIds: number[];
  active: boolean;
  onDepartment: (value: number | "") => void;
  onDomain: (value: string) => void;
  onDifficulty: (value: string) => void;
  onSkillIds: (value: number[]) => void;
  onActive: (value: boolean) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-black/10 bg-amal-sheet/40 p-4">
      <h3 className="text-sm font-semibold text-zinc-900">Classification</h3>
      <Field label="Department">
        <select
          className={inputClass}
          value={departmentId === "" ? "" : String(departmentId)}
          onChange={(event) =>
            onDepartment(event.target.value ? Number(event.target.value) : "")
          }
        >
          <option value="">Not Set</option>
          {departments.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Domain">
        <select
          className={inputClass}
          value={domain}
          onChange={(event) => onDomain(event.target.value)}
        >
          <option value="">Not Set</option>
          <option value="technical">Technical</option>
          <option value="behavioral">Behavioral</option>
        </select>
      </Field>
      <Field label="Difficulty">
        <select
          className={inputClass}
          value={difficulty}
          onChange={(event) => onDifficulty(event.target.value)}
        >
          <option value="easy">Easy</option>
          <option value="intermediate">Intermediate</option>
          <option value="hard">Hard</option>
        </select>
      </Field>
      <div>
        <p className="mb-2 text-xs font-medium text-zinc-600">Skills</p>
        <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto">
          {skills.map((row) => (
            <label
              key={row.id}
              className="inline-flex items-center gap-2 rounded-md border border-black/10 bg-amal-white px-2 py-1 text-xs"
            >
              <input
                type="checkbox"
                checked={skillIds.includes(row.id)}
                onChange={() =>
                  onSkillIds(
                    skillIds.includes(row.id)
                      ? skillIds.filter((id) => id !== row.id)
                      : [...skillIds, row.id],
                  )
                }
              />
              {row.name}
            </label>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          checked={active}
          onChange={(event) => onActive(event.target.checked)}
        />
        Active in tests
      </label>
    </div>
  );
}

function McqPanel({
  rows,
  departments,
  skills,
  onError,
  onRefresh,
}: {
  rows: BankQuestion[];
  departments: Department[];
  skills: Skill[];
  onError: (value: string) => void;
  onRefresh: () => void;
}) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [editing, setEditing] = useState<BankQuestion | "new" | null>(null);
  const [preview, setPreview] = useState<BankQuestion | null>(null);

  const filtered = useMemo(
    () =>
      rows.filter((row) =>
        matchesFilters(row, filters, row.question_text),
      ),
    [rows, filters],
  );
  const active = rows.filter((row) => row.is_active).length;

  async function deactivate(row: BankQuestion) {
    try {
      await patchBankQuestion(row.id, { is_active: false });
      onRefresh();
    } catch (error) {
      onError(errorText(error));
    }
  }

  return (
    <div>
      <MiniStats
        total={rows.length}
        active={active}
        inactive={rows.length - active}
      />
      <FiltersBar
        filters={filters}
        onChange={setFilters}
        departments={departments}
        skills={skills}
        showTaxonomy
      />
      <SearchAddRow
        search={filters.search}
        onSearch={(search) => setFilters((current) => ({ ...current, search }))}
        onAdd={() => setEditing("new")}
        addLabel="Add Question"
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">No questions match these filters.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-zinc-500">
                <th className="py-2">Question</th>
                <th>Dept</th>
                <th>Correct Answer</th>
                <th className="text-center">Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-t border-black/5">
                  <td className="max-w-md py-3 font-medium text-zinc-900">
                    {row.question_text}
                  </td>
                  <td className="text-zinc-600">
                    {deptName(departments, row.department_id)}
                  </td>
                  <td>
                    <span className="inline-flex rounded-full bg-amal-sheet px-2.5 py-1 text-xs font-semibold text-zinc-700">
                      Option {row.correct_option}
                    </span>
                  </td>
                  <td className="text-center">
                    <QuestionStatusBadge active={row.is_active} />
                  </td>
                  <td className="text-right">
                    <div className="inline-flex items-center gap-0.5">
                      <ActionIconButton
                        label="Preview"
                        onClick={() => setPreview(row)}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </ActionIconButton>
                      <ActionIconButton
                        label="Edit"
                        onClick={() => setEditing(row)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </ActionIconButton>
                      <ActionIconButton
                        label="Deactivate"
                        onClick={() => void deactivate(row)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </ActionIconButton>
                    </div>
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
          departments={departments}
          skills={skills}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onRefresh();
          }}
          onError={onError}
        />
      ) : null}
      {preview ? (
        <McqPreviewModal question={preview} onClose={() => setPreview(null)} />
      ) : null}
    </div>
  );
}

function McqModal({
  question,
  departments,
  skills,
  onClose,
  onSaved,
  onError,
}: {
  question: BankQuestion | null;
  departments: Department[];
  skills: Skill[];
  onClose: () => void;
  onSaved: () => void;
  onError: (value: string) => void;
}) {
  const [text, setText] = useState(question?.question_text ?? "");
  const [a, setA] = useState(question?.option_a ?? "");
  const [b, setB] = useState(question?.option_b ?? "");
  const [c, setC] = useState(question?.option_c ?? "");
  const [d, setD] = useState(question?.option_d ?? "");
  const [correct, setCorrect] = useState(question?.correct_option ?? "");
  const [active, setActive] = useState(question?.is_active ?? true);
  const [departmentId, setDepartmentId] = useState<number | "">(
    question?.department_id ?? "",
  );
  const [domain, setDomain] = useState(question?.domain ?? "");
  const [difficulty, setDifficulty] = useState(
    question?.difficulty ?? "intermediate",
  );
  const [skillIds, setSkillIds] = useState<number[]>(question?.skill_ids ?? []);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!correct) {
      onError("Select a correct answer.");
      return;
    }
    setBusy(true);
    const body = {
      question_text: text,
      option_a: a,
      option_b: b,
      option_c: c,
      option_d: d,
      correct_option: correct,
      is_active: active,
      department_id: departmentId === "" ? null : departmentId,
      domain: domain || null,
      difficulty,
      skill_ids: skillIds,
    };
    try {
      if (question) await patchBankQuestion(question.id, body);
      else await createBankQuestion(body);
      onSaved();
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={question ? "Edit Question" : "Add New Question"}
      onClose={onClose}
      wide
    >
      <form onSubmit={onSubmit}>
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-3">
            <Field label="Question Text *">
              <textarea
                className={`${inputClass} h-28 py-2`}
                placeholder="Enter your question..."
                value={text}
                onChange={(event) => setText(event.target.value)}
                required
              />
            </Field>
            <p className="text-sm font-semibold text-zinc-800">Answer Options</p>
            {(["A", "B", "C", "D"] as const).map((letter, index) => {
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
            <Field label="Correct Answer *">
              <select
                className={inputClass}
                value={correct}
                onChange={(event) => setCorrect(event.target.value)}
                required
              >
                <option value="">Please Select An Option</option>
                {["A", "B", "C", "D"].map((letter) => (
                  <option key={letter} value={letter}>
                    Option {letter}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <TaxonomyFields
            departments={departments}
            skills={skills}
            departmentId={departmentId}
            domain={domain}
            difficulty={difficulty}
            skillIds={skillIds}
            active={active}
            onDepartment={setDepartmentId}
            onDomain={setDomain}
            onDifficulty={setDifficulty}
            onSkillIds={setSkillIds}
            onActive={setActive}
          />
        </div>
        <div className="mt-5 flex justify-end gap-2 border-t border-black/10 pt-4">
          <GhostButton type="button" onClick={onClose}>
            Cancel
          </GhostButton>
          <PrimaryButton type="submit" disabled={busy}>
            {busy ? "Saving…" : question ? "Save Question" : "Add Question"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

function McqPreviewModal({
  question,
  onClose,
}: {
  question: BankQuestion;
  onClose: () => void;
}) {
  return (
    <Modal title="Question preview" onClose={onClose}>
      <p className="mb-4 font-medium text-zinc-900">{question.question_text}</p>
      <div className="space-y-2">
        {(
          [
            ["A", question.option_a],
            ["B", question.option_b],
            ["C", question.option_c],
            ["D", question.option_d],
          ] as const
        ).map(([key, text]) => (
          <div
            key={key}
            className={`rounded-lg border-2 px-3 py-2 text-sm ${
              question.correct_option === key
                ? "border-emerald-400 bg-emerald-50"
                : "border-black/10 bg-amal-white"
            }`}
          >
            <span className="font-semibold">{key}.</span> {text}
          </div>
        ))}
      </div>
    </Modal>
  );
}

function VideoPanel({
  rows,
  departments,
  skills,
  onError,
  onRefresh,
}: {
  rows: VideoPrompt[];
  departments: Department[];
  skills: Skill[];
  onError: (value: string) => void;
  onRefresh: () => void;
}) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [editing, setEditing] = useState<VideoPrompt | "new" | null>(null);
  const filtered = useMemo(
    () => rows.filter((row) => matchesFilters(row, filters, row.prompt)),
    [rows, filters],
  );
  const active = rows.filter((row) => row.is_active).length;

  async function deactivate(row: VideoPrompt) {
    try {
      await patchVideoPrompt(row.id, { is_active: false });
      onRefresh();
    } catch (error) {
      onError(errorText(error));
    }
  }

  return (
    <div>
      <MiniStats
        total={rows.length}
        active={active}
        inactive={rows.length - active}
      />
      <FiltersBar
        filters={filters}
        onChange={setFilters}
        departments={departments}
        skills={skills}
        showTaxonomy
      />
      <SearchAddRow
        search={filters.search}
        onSearch={(search) => setFilters((current) => ({ ...current, search }))}
        onAdd={() => setEditing("new")}
        addLabel="Add Prompt"
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">No prompts match these filters.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-zinc-500">
                <th className="py-2">Order</th>
                <th>Question</th>
                <th>Dept / Domain</th>
                <th>Time Limit</th>
                <th className="text-center">Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-t border-black/5">
                  <td className="py-3">{row.question_order ?? "—"}</td>
                  <td className="max-w-md font-medium">{row.prompt}</td>
                  <td className="text-zinc-600">
                    {deptName(departments, row.department_id)}
                    {row.domain ? ` · ${row.domain}` : ""}
                  </td>
                  <td>
                    {row.time_limit_seconds
                      ? `${row.time_limit_seconds}s`
                      : "—"}
                  </td>
                  <td className="text-center">
                    <QuestionStatusBadge active={row.is_active} />
                  </td>
                  <td className="text-right">
                    <div className="inline-flex items-center gap-0.5">
                      <ActionIconButton
                        label="Edit"
                        onClick={() => setEditing(row)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </ActionIconButton>
                      <ActionIconButton
                        label="Deactivate"
                        onClick={() => void deactivate(row)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </ActionIconButton>
                    </div>
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
          departments={departments}
          skills={skills}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onRefresh();
          }}
          onError={onError}
        />
      ) : null}
    </div>
  );
}

function VideoModal({
  prompt,
  departments,
  skills,
  onClose,
  onSaved,
  onError,
}: {
  prompt: VideoPrompt | null;
  departments: Department[];
  skills: Skill[];
  onClose: () => void;
  onSaved: () => void;
  onError: (value: string) => void;
}) {
  const [text, setText] = useState(prompt?.prompt ?? "");
  const [order, setOrder] = useState(prompt?.question_order ?? 1);
  const [timeLimit, setTimeLimit] = useState(prompt?.time_limit_seconds ?? 120);
  const [active, setActive] = useState(prompt?.is_active ?? true);
  const [departmentId, setDepartmentId] = useState<number | "">(
    prompt?.department_id ?? "",
  );
  const [domain, setDomain] = useState(prompt?.domain ?? "");
  const [difficulty, setDifficulty] = useState(
    prompt?.difficulty ?? "intermediate",
  );
  const [skillIds, setSkillIds] = useState<number[]>(prompt?.skill_ids ?? []);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const body = {
      prompt: text,
      is_active: active,
      question_order: order,
      time_limit_seconds: timeLimit,
      department_id: departmentId === "" ? null : departmentId,
      domain: domain || null,
      difficulty,
      skill_ids: skillIds,
    };
    try {
      if (prompt) await patchVideoPrompt(prompt.id, body);
      else await createVideoPrompt(body);
      onSaved();
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={prompt ? "Edit Video Question" : "Add Video Question"} onClose={onClose} wide>
      <form onSubmit={onSubmit}>
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-3">
            <Field label="Question Text *">
              <textarea
                className={`${inputClass} h-28 py-2`}
                value={text}
                onChange={(event) => setText(event.target.value)}
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Question Order *">
                <input
                  type="number"
                  min={1}
                  className={inputClass}
                  value={order}
                  onChange={(event) => setOrder(Number(event.target.value) || 1)}
                  required
                />
              </Field>
              <Field label="Time Limit (seconds) *">
                <input
                  type="number"
                  min={30}
                  className={inputClass}
                  value={timeLimit}
                  onChange={(event) =>
                    setTimeLimit(Number(event.target.value) || 120)
                  }
                  required
                />
              </Field>
            </div>
          </div>
          <TaxonomyFields
            departments={departments}
            skills={skills}
            departmentId={departmentId}
            domain={domain}
            difficulty={difficulty}
            skillIds={skillIds}
            active={active}
            onDepartment={setDepartmentId}
            onDomain={setDomain}
            onDifficulty={setDifficulty}
            onSkillIds={setSkillIds}
            onActive={setActive}
          />
        </div>
        <div className="mt-5 flex justify-end gap-2 border-t border-black/10 pt-4">
          <GhostButton type="button" onClick={onClose}>
            Cancel
          </GhostButton>
          <PrimaryButton type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

function QuestionnairePanel({
  rows,
  onError,
  onRefresh,
}: {
  rows: QuestionnairePrompt[];
  onError: (value: string) => void;
  onRefresh: () => void;
}) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [editing, setEditing] = useState<QuestionnairePrompt | "new" | null>(
    null,
  );
  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        if (filters.activity === "active" && !row.is_active) return false;
        if (filters.activity === "inactive" && row.is_active) return false;
        if (
          filters.search.trim() &&
          !row.question_text.toLowerCase().includes(filters.search.trim().toLowerCase())
        ) {
          return false;
        }
        return true;
      }),
    [rows, filters],
  );
  const active = rows.filter((row) => row.is_active).length;

  async function deactivate(row: QuestionnairePrompt) {
    try {
      await patchQuestionnairePrompt(row.id, { is_active: false });
      onRefresh();
    } catch (error) {
      onError(errorText(error));
    }
  }

  return (
    <div>
      <MiniStats
        total={rows.length}
        active={active}
        inactive={rows.length - active}
      />
      <FiltersBar
        filters={filters}
        onChange={setFilters}
        departments={[]}
        skills={[]}
        showTaxonomy={false}
      />
      <SearchAddRow
        search={filters.search}
        onSearch={(search) => setFilters((current) => ({ ...current, search }))}
        onAdd={() => setEditing("new")}
        addLabel="Add Question"
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">No questions match these filters.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-zinc-500">
                <th className="py-2">Order</th>
                <th>Question</th>
                <th className="text-center">Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-t border-black/5">
                  <td className="py-3">{row.question_order}</td>
                  <td className="font-medium">{row.question_text}</td>
                  <td className="text-center">
                    <QuestionStatusBadge active={row.is_active} />
                  </td>
                  <td className="text-right">
                    <div className="inline-flex items-center gap-0.5">
                      <ActionIconButton
                        label="Edit"
                        onClick={() => setEditing(row)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </ActionIconButton>
                      <ActionIconButton
                        label="Deactivate"
                        onClick={() => void deactivate(row)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </ActionIconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing ? (
        <QuestionnaireModal
          question={editing === "new" ? null : editing}
          nextOrder={
            rows.reduce((max, row) => Math.max(max, row.question_order), 0) + 1
          }
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onRefresh();
          }}
          onError={onError}
        />
      ) : null}
    </div>
  );
}

function QuestionnaireModal({
  question,
  nextOrder,
  onClose,
  onSaved,
  onError,
}: {
  question: QuestionnairePrompt | null;
  nextOrder: number;
  onClose: () => void;
  onSaved: () => void;
  onError: (value: string) => void;
}) {
  const [text, setText] = useState(question?.question_text ?? "");
  const [order, setOrder] = useState(question?.question_order ?? nextOrder);
  const [active, setActive] = useState(question?.is_active ?? true);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (question) {
        await patchQuestionnairePrompt(question.id, {
          question_text: text,
          question_order: order,
          is_active: active,
        });
      } else {
        await createQuestionnairePrompt({
          question_text: text,
          question_order: order,
          is_active: active,
        });
      }
      onSaved();
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={question ? "Edit General Question" : "Add General Question"}
      onClose={onClose}
    >
      <form onSubmit={onSubmit}>
        <Field label="Question Text *">
          <textarea
            className={`${inputClass} h-24 py-2`}
            value={text}
            onChange={(event) => setText(event.target.value)}
            required
          />
        </Field>
        <Field label="Question Order *">
          <input
            className={inputClass}
            type="number"
            min={1}
            value={order}
            onChange={(event) => setOrder(Number(event.target.value) || 1)}
            required
          />
        </Field>
        <label className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
          />
          Active in tests
        </label>
        <div className="flex justify-end gap-2">
          <GhostButton type="button" onClick={onClose}>
            Cancel
          </GhostButton>
          <PrimaryButton type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

function DefaultsModal({
  onClose,
  onError,
}: {
  onClose: () => void;
  onError: (value: string) => void;
}) {
  const [rows, setRows] = useState<AssessmentSetting[]>([]);
  const [drafts, setDrafts] = useState<Record<string, AssessmentSetting>>({});
  const [inviteDays, setInviteDays] = useState(3);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let ignore = false;
    Promise.all([getAssessmentSettings(), getAssessmentInviteSettings()])
      .then(([data, invite]) => {
        if (!ignore) {
          setRows(data);
          setDrafts(Object.fromEntries(data.map((row) => [row.test_type, row])));
          setInviteDays(invite.default_validity_days);
        }
      })
      .catch((error) => {
        if (!ignore) onError(errorText(error));
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
      const [updated] = await Promise.all([
        Promise.all(
          rows.map((row) =>
            patchAssessmentSetting(row.test_type, drafts[row.test_type]),
          ),
        ),
        patchAssessmentInviteSettings({
          default_validity_days: inviteDays,
        } satisfies Partial<AssessmentInviteSettings>),
      ]);
      setRows(updated);
      onClose();
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Assessment Defaults" onClose={onClose} wide>
      <div className="space-y-4">
        <section className="rounded-xl border border-black/10 p-4">
          <h2 className="mb-3 text-sm font-bold">Invite link</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Default validity (days)">
              <input
                className={inputClass}
                type="number"
                min={1}
                value={inviteDays}
                onChange={(event) => setInviteDays(Number(event.target.value))}
              />
            </Field>
          </div>
          <p className="mt-2 text-xs text-black/55">
            Used when a new assessment invite is created. Extending an invite still
            uses 3, 5, or 7 days from the application screen.
          </p>
        </section>
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
              </div>
            </section>
          );
        })}
        <div className="flex justify-end gap-2">
          <GhostButton type="button" onClick={onClose}>
            Cancel
          </GhostButton>
          <PrimaryButton type="button" disabled={busy} onClick={() => void save()}>
            {busy ? "Saving…" : "Save defaults"}
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}
