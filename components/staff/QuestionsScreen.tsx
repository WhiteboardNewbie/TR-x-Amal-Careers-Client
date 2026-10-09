"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, mediaUrl } from "@/lib/api";
import { preventFocusScroll } from "@/lib/prevent-focus-scroll";
import {
  createBankQuestionForm,
  createQuestionnairePrompt,
  createSkill,
  createVideoPrompt,
  getAssessmentSettings,
  getBankQuestions,
  getOrgDepartments,
  getQuestionnairePrompts,
  getSkillsPage,
  getVideoPrompts,
  patchAssessmentSetting,
  patchBankQuestion,
  patchBankQuestionForm,
  patchQuestionnairePrompt,
  patchVideoPrompt,
} from "@/lib/staff-api";
import type {
  AssessmentSetting,
  BankQuestion,
  Department,
  QuestionnairePrompt,
  Skill,
  VideoPrompt,
} from "@/lib/types";
import {
  CheckIcon,
  ClockIcon,
  EyeIcon,
  FileTextIcon,
  MessageSquareIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
  TrashIcon,
  UploadIcon,
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

function QuestionStatusToggle({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex h-7 items-center justify-center gap-1 rounded-full px-3 text-xs font-semibold transition-colors ${
        active
          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
          : "bg-amal-sheet text-zinc-600 hover:bg-zinc-200"
      }`}
    >
      {active ? (
        <CheckIcon className="h-3.5 w-3.5" />
      ) : (
        <XIcon className="h-3.5 w-3.5" />
      )}
      {active ? "Active" : "Inactive"}
    </button>
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
  if (!departmentId) return "—";
  return departments.find((row) => row.id === departmentId)?.name ?? "—";
}

function domainLabel(domain?: string | null): string {
  if (!domain) return "—";
  return DOMAIN_OPTIONS.find((row) => row.value === domain)?.label ?? domain;
}

function difficultyLabel(difficulty?: string | null): string {
  if (!difficulty) return "—";
  return (
    DIFFICULTY_OPTIONS.find((row) => row.value === difficulty)?.label ??
    difficulty
  );
}

function OrderBadge({ order }: { order: number | null | undefined }) {
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amal-red/10 text-sm font-semibold text-amal-red">
      {order ?? "—"}
    </span>
  );
}

function formatTimeLimit(seconds?: number | null): string | null {
  if (seconds == null || seconds <= 0) return null;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function TimeLimitCell({ seconds }: { seconds?: number | null }) {
  const formatted = formatTimeLimit(seconds);
  if (!formatted) {
    return <td className="text-zinc-500">—</td>;
  }
  return (
    <td>
      <span className="inline-flex items-center gap-1 rounded-full bg-amal-sheet px-2.5 py-1 text-xs font-semibold text-zinc-700">
        <ClockIcon className="h-3.5 w-3.5" />
        {formatted}
      </span>
    </td>
  );
}

function DeptDomainCell({
  departments,
  departmentId,
  domain,
  difficulty,
  showDifficulty = true,
  isActive = true,
}: {
  departments: Department[];
  departmentId?: number | null;
  domain?: string | null;
  difficulty?: string | null;
  showDifficulty?: boolean;
  isActive?: boolean;
}) {
  return (
    <td className="text-xs text-zinc-600">
      <div className="font-medium text-zinc-800">
        {deptName(departments, departmentId)}
      </div>
      <div className="mt-0.5 text-zinc-500">{domainLabel(domain)}</div>
      {showDifficulty ? (
        <div className="mt-0.5 text-zinc-500">{difficultyLabel(difficulty)}</div>
      ) : null}
      {!isActive ? (
        <span className="mt-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-900">
          Inactive
        </span>
      ) : null}
    </td>
  );
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
        setMcq(Array.isArray(nextMcq) ? nextMcq : []);
        setVideo(Array.isArray(nextVideo) ? nextVideo : []);
        setQuestionnaire(
          (Array.isArray(nextQ) ? [...nextQ] : []).sort(
            (a, b) => a.question_order - b.question_order || a.id - b.id,
          ),
        );
        setDepartments(
          Array.isArray(nextDepartments) ? nextDepartments : [],
        );
        setSkills(Array.isArray(nextSkills) ? nextSkills : []);
      })
      .catch((error) => {
        if (!ignore) {
          setMcq([]);
          setVideo([]);
          setQuestionnaire([]);
          onError(errorText(error));
        }
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

      <div className="rounded-2xl border border-zinc-200 bg-amal-white p-4 shadow-sm md:p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Question Bank</h2>
        <p className="mt-0.5 text-sm text-zinc-500">
          Manage your test questions pool
        </p>

        <div className="mt-4 flex flex-wrap border-b border-zinc-200">
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
              onSkillCreated={(skill) =>
                setSkills((current) =>
                  current.some((row) => row.id === skill.id)
                    ? current
                    : [...current, skill].sort((a, b) =>
                        a.name.localeCompare(b.name),
                      ),
                )
              }
            />
          ) : null}
          {tab === "video" ? (
            <VideoPanel
              rows={video}
              departments={departments}
              skills={skills}
              onError={onError}
              onRefresh={refresh}
              onSkillCreated={(skill) =>
                setSkills((current) =>
                  current.some((row) => row.id === skill.id)
                    ? current
                    : [...current, skill].sort((a, b) =>
                        a.name.localeCompare(b.name),
                      ),
                )
              }
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
    <div className="rounded-xl border border-zinc-200 bg-amal-white p-4 shadow-sm">
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
      className={`flex items-center gap-2 border-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? "border-b-amal-red bg-amal-red/5 text-amal-red"
          : "border-b-transparent text-zinc-500 hover:border-b-zinc-300 hover:text-zinc-700"
      }`}
    >
      {icon}
      {label}
      <span
        className={`rounded-full px-2 py-0.5 text-xs ${
          active ? "bg-amal-red/15 text-amal-red" : "bg-zinc-100 text-zinc-600"
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
  placeholder,
}: {
  search: string;
  onSearch: (value: string) => void;
  onAdd: () => void;
  addLabel: string;
  placeholder: string;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          className={`${inputClass} pl-9`}
          placeholder={placeholder}
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

function quoteSnippet(text: string, max = 120): string {
  const clipped = text.length > max ? `${text.slice(0, max)}…` : text;
  return `"${clipped}"`;
}

function ConfirmDeleteModal({
  message,
  busy,
  onCancel,
  onConfirm,
}: {
  message: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal title="Confirm Deletion" onClose={onCancel} compact>
      <p className="mt-3 text-sm text-zinc-600">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <GhostButton type="button" onClick={onCancel} disabled={busy}>
          Cancel
        </GhostButton>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="inline-flex items-center justify-center rounded-lg bg-amal-red px-4 py-2 text-sm font-semibold text-amal-white hover:bg-amal-red/90 disabled:opacity-60"
        >
          {busy ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Modal>
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
  onSkillCreated,
  onError,
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
  onSkillCreated: (skill: Skill) => void;
  onError: (value: string) => void;
}) {
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [creatingSkill, setCreatingSkill] = useState(false);

  async function handleCreateSkill() {
    const name = newSkillName.trim();
    if (!name) {
      onError("Skill name is required.");
      return;
    }
    setCreatingSkill(true);
    try {
      const created = await createSkill(name);
      onSkillCreated(created);
      onSkillIds([...skillIds, created.id]);
      setNewSkillName("");
      setSkillModalOpen(false);
    } catch (error) {
      onError(errorText(error));
    } finally {
      setCreatingSkill(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-black/10 bg-amal-sheet/50 p-4">
      <h3 className="text-sm font-semibold text-zinc-800">Classification</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Department">
          <select
            className={inputClass}
            value={departmentId === "" ? "" : String(departmentId)}
            onChange={(event) =>
              onDepartment(event.target.value ? Number(event.target.value) : "")
            }
          >
            <option value="">Unassigned</option>
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
            <option value="">Not Set (Defaults To Intermediate)</option>
            <option value="easy">Easy</option>
            <option value="intermediate">Intermediate</option>
            <option value="hard">Hard</option>
          </select>
        </Field>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-zinc-600">Skills</p>
          <button
            type="button"
            onClick={() => setSkillModalOpen(true)}
            className="inline-flex items-center gap-1 rounded-md bg-amal-red px-2 py-1 text-xs font-semibold text-amal-white hover:bg-amal-red/90"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Add Skill
          </button>
        </div>
        <div className="max-h-36 overflow-y-auto rounded-lg border border-black/10 bg-amal-white p-2">
          <div className="flex flex-wrap gap-2">
            {skills.map((row) => (
              <label
                key={row.id}
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-black/5 px-2 py-1 text-xs"
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
          {skills.length === 0 ? (
            <p className="text-xs text-zinc-500">No skills in directory yet.</p>
          ) : null}
        </div>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          checked={active}
          onChange={(event) => onActive(event.target.checked)}
        />
        Active in tests
      </label>
      {skillModalOpen ? (
        <Modal
          title="Add Skill"
          onClose={() => setSkillModalOpen(false)}
          compact
        >
          <p className="mt-1 text-sm text-zinc-500">
            Enter a skill name to add it to the list.
          </p>
          <input
            type="text"
            value={newSkillName}
            onChange={(event) => setNewSkillName(event.target.value)}
            placeholder="e.g. React, Python, Communication"
            className={`${inputClass} mt-4`}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleCreateSkill();
              }
            }}
          />
          <div className="mt-6 flex justify-end gap-3">
            <GhostButton
              type="button"
              onClick={() => setSkillModalOpen(false)}
              disabled={creatingSkill}
            >
              Cancel
            </GhostButton>
            <PrimaryButton
              type="button"
              onClick={() => void handleCreateSkill()}
              disabled={creatingSkill}
            >
              {creatingSkill ? "Adding…" : "Add Skill"}
            </PrimaryButton>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function McqPanel({
  rows,
  departments,
  skills,
  onError,
  onRefresh,
  onSkillCreated,
}: {
  rows: BankQuestion[];
  departments: Department[];
  skills: Skill[];
  onError: (value: string) => void;
  onRefresh: () => void;
  onSkillCreated: (skill: Skill) => void;
}) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [editing, setEditing] = useState<BankQuestion | "new" | null>(null);
  const [preview, setPreview] = useState<BankQuestion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BankQuestion | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(
    () =>
      rows.filter((row) =>
        matchesFilters(row, filters, row.question_text),
      ),
    [rows, filters],
  );
  const active = rows.filter((row) => row.is_active).length;

  async function confirmDeactivate() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await patchBankQuestion(deleteTarget.id, { is_active: false });
      setDeleteTarget(null);
      onRefresh();
    } catch (error) {
      onError(errorText(error));
    } finally {
      setDeleting(false);
    }
  }

  async function toggleActive(row: BankQuestion) {
    try {
      await patchBankQuestion(row.id, { is_active: !row.is_active });
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
        placeholder="Search questions..."
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {filters.search.trim()
            ? "No questions found matching your search."
            : "No questions match these filters."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-zinc-500">
                <th className="py-2">Question</th>
                <th>Dept / Domain</th>
                <th>Correct Option</th>
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
                  <DeptDomainCell
                    departments={departments}
                    departmentId={row.department_id}
                    domain={row.domain}
                    difficulty={row.difficulty}
                    isActive={row.is_active}
                  />
                  <td>
                    {row.correct_option ? (
                      <span className="inline-flex rounded-full bg-amal-red/10 px-2.5 py-1 text-xs font-semibold text-amal-red">
                        Option {row.correct_option}
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-amal-sheet px-2.5 py-1 text-xs font-semibold text-zinc-600">
                        Not Set
                      </span>
                    )}
                  </td>
                  <td className="text-center">
                    <QuestionStatusToggle
                      active={row.is_active}
                      onToggle={() => void toggleActive(row)}
                    />
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
                        label="Delete"
                        onClick={() => setDeleteTarget(row)}
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
          onSkillCreated={onSkillCreated}
        />
      ) : null}
      {preview ? (
        <McqPreviewModal question={preview} onClose={() => setPreview(null)} />
      ) : null}
      {deleteTarget ? (
        <ConfirmDeleteModal
          message={`Are you sure you want to delete the question: ${quoteSnippet(deleteTarget.question_text)}?`}
          busy={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void confirmDeactivate()}
        />
      ) : null}
    </div>
  );
}

type McqImageKey =
  | "question_image"
  | "option_a_image"
  | "option_b_image"
  | "option_c_image"
  | "option_d_image";

function McqModal({
  question,
  departments,
  skills,
  onClose,
  onSaved,
  onError,
  onSkillCreated,
}: {
  question: BankQuestion | null;
  departments: Department[];
  skills: Skill[];
  onClose: () => void;
  onSaved: () => void;
  onError: (value: string) => void;
  onSkillCreated: (skill: Skill) => void;
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
  const [difficulty, setDifficulty] = useState(question?.difficulty ?? "");
  const [skillIds, setSkillIds] = useState<number[]>(question?.skill_ids ?? []);
  const [files, setFiles] = useState<Partial<Record<McqImageKey, File | null>>>(
    {},
  );
  const [previews, setPreviews] = useState<Record<McqImageKey, string | null>>({
    question_image: mediaUrl(question?.question_image) ?? null,
    option_a_image: mediaUrl(question?.option_a_image) ?? null,
    option_b_image: mediaUrl(question?.option_b_image) ?? null,
    option_c_image: mediaUrl(question?.option_c_image) ?? null,
    option_d_image: mediaUrl(question?.option_d_image) ?? null,
  });
  const [busy, setBusy] = useState(false);

  function handleImage(field: McqImageKey, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onError("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onError("Image size should be less than 5MB");
      return;
    }
    setFiles((current) => ({ ...current, [field]: file }));
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviews((current) => ({
        ...current,
        [field]: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  }

  function removeImage(field: McqImageKey) {
    setFiles((current) => ({ ...current, [field]: null }));
    setPreviews((current) => ({ ...current, [field]: null }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!text.trim()) {
      onError("Question text is required");
      return;
    }
    if (!a.trim() || !b.trim() || !c.trim() || !d.trim()) {
      onError("All options are required");
      return;
    }
    if (!correct) {
      onError("Please select the correct answer option");
      return;
    }
    setBusy(true);
    const body = {
      question_text: text.trim(),
      option_a: a.trim(),
      option_b: b.trim(),
      option_c: c.trim(),
      option_d: d.trim(),
      correct_option: correct,
      is_active: active,
      department_id: departmentId === "" ? null : departmentId,
      domain: domain || null,
      difficulty: difficulty || "intermediate",
      skill_ids: skillIds,
    };
    const imageFiles = {
      question_image: files.question_image ?? undefined,
      option_a_image: files.option_a_image ?? undefined,
      option_b_image: files.option_b_image ?? undefined,
      option_c_image: files.option_c_image ?? undefined,
      option_d_image: files.option_d_image ?? undefined,
    };
    try {
      if (question) await patchBankQuestionForm(question.id, body, imageFiles);
      else await createBankQuestionForm(body, imageFiles);
      onSaved();
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  const optionText = { A: a, B: b, C: c, D: d } as const;
  const optionSetter = {
    A: setA,
    B: setB,
    C: setC,
    D: setD,
  } as const;
  const optionImageKey = {
    A: "option_a_image",
    B: "option_b_image",
    C: "option_c_image",
    D: "option_d_image",
  } as const;

  return (
    <Modal
      title={question ? "Edit Question" : "Add New Question"}
      onClose={onClose}
      wide
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <div className="space-y-3 rounded-xl border border-black/10 bg-amal-sheet/40 p-4">
              <Field label="Question Text *">
                <textarea
                  className={`${inputClass} py-2`}
                  rows={4}
                  placeholder="Enter your question..."
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  required
                />
              </Field>
              <p className="text-xs text-zinc-500">
                Keep wording clear and candidate-friendly for first-test
                display.
              </p>
            </div>

            <div className="rounded-xl border border-black/10 bg-amal-sheet/40 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-zinc-800">
                  Answer Options
                </h3>
                <p className="text-xs text-zinc-500">
                  Enter text and optional image per option
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {(["A", "B", "C", "D"] as const).map((letter) => {
                  const imageKey = optionImageKey[letter];
                  return (
                    <div
                      key={letter}
                      className="rounded-xl border border-black/10 bg-amal-white p-3 shadow-sm"
                    >
                      <span className="mb-2 inline-flex rounded-full bg-amal-red/10 px-2 py-0.5 text-xs font-semibold text-amal-red">
                        Option {letter}
                      </span>
                      <input
                        className={`${inputClass} mb-2`}
                        placeholder={`Enter option ${letter} text`}
                        value={optionText[letter]}
                        onChange={(event) =>
                          optionSetter[letter](event.target.value)
                        }
                        required
                      />
                      <div className="mt-1">
                        {previews[imageKey] ? (
                          <div className="relative inline-block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={previews[imageKey] ?? ""}
                              alt={`Option ${letter}`}
                              className="h-20 w-20 rounded border-2 border-black/10 object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(imageKey)}
                              className="absolute -right-2 -top-2 rounded-full bg-amal-red p-1 text-amal-white hover:bg-amal-red/90"
                              aria-label={`Remove option ${letter} image`}
                            >
                              <XIcon className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <label className="inline-flex cursor-pointer items-center rounded-lg bg-amal-red/10 px-3 py-2 text-sm font-medium text-amal-red hover:bg-amal-red/15">
                            <UploadIcon className="mr-2 h-4 w-4" />
                            Upload Image
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(event) =>
                                handleImage(imageKey, event)
                              }
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-black/10 bg-amal-sheet/40 p-4">
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
          </div>

          <div className="space-y-6">
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
              onSkillCreated={onSkillCreated}
              onError={onError}
            />

            <div className="rounded-xl border border-black/10 bg-amal-sheet/40 p-4">
              <p className="mb-2 text-sm font-medium text-zinc-700">
                Question Image (Optional)
              </p>
              <div className="mt-1 flex items-center justify-center">
                {previews.question_image ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previews.question_image}
                      alt="Question"
                      className="h-36 w-36 rounded-lg border-2 border-black/10 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage("question_image")}
                      className="absolute -right-2 -top-2 rounded-full bg-amal-red p-1 text-amal-white hover:bg-amal-red/90"
                      aria-label="Remove question image"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-36 w-36 items-center justify-center rounded-lg border-2 border-dashed border-black/20">
                    <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center text-center">
                      <PlusIcon className="h-8 w-8 text-zinc-400" />
                      <span className="mt-2 text-xs text-zinc-500">
                        Upload Image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) =>
                          handleImage("question_image", event)
                        }
                      />
                    </label>
                  </div>
                )}
              </div>
              <p className="mt-2 text-center text-xs text-zinc-500">
                PNG, JPG, GIF up to 5MB
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-black/10 pt-4">
          <GhostButton type="button" onClick={onClose} disabled={busy}>
            Cancel
          </GhostButton>
          <PrimaryButton type="submit" disabled={busy}>
            {busy
              ? "Saving…"
              : question
                ? "Update Question"
                : "Add Question"}
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
  onSkillCreated,
}: {
  rows: VideoPrompt[];
  departments: Department[];
  skills: Skill[];
  onError: (value: string) => void;
  onRefresh: () => void;
  onSkillCreated: (skill: Skill) => void;
}) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [editing, setEditing] = useState<VideoPrompt | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VideoPrompt | null>(null);
  const [deleting, setDeleting] = useState(false);
  const filtered = useMemo(
    () =>
      [...rows]
        .filter((row) => matchesFilters(row, filters, row.prompt))
        .sort(
          (a, b) =>
            (a.question_order ?? 0) - (b.question_order ?? 0) || a.id - b.id,
        ),
    [rows, filters],
  );
  const active = rows.filter((row) => row.is_active).length;

  async function confirmDeactivate() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await patchVideoPrompt(deleteTarget.id, { is_active: false });
      setDeleteTarget(null);
      onRefresh();
    } catch (error) {
      onError(errorText(error));
    } finally {
      setDeleting(false);
    }
  }

  async function toggleActive(row: VideoPrompt) {
    try {
      await patchVideoPrompt(row.id, { is_active: !row.is_active });
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
        addLabel="Add Video Question"
        placeholder="Search video questions..."
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {filters.search.trim()
            ? "No video questions found matching your search."
            : "No video questions match these filters."}
        </p>
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
                  <td className="py-3">
                    <OrderBadge order={row.question_order} />
                  </td>
                  <td className="max-w-md font-medium">{row.prompt}</td>
                  <DeptDomainCell
                    departments={departments}
                    departmentId={row.department_id}
                    domain={row.domain}
                    showDifficulty={false}
                    isActive={row.is_active}
                  />
                  <TimeLimitCell seconds={row.time_limit_seconds} />
                  <td className="text-center">
                    <QuestionStatusToggle
                      active={row.is_active}
                      onToggle={() => void toggleActive(row)}
                    />
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
                        label="Delete"
                        onClick={() => setDeleteTarget(row)}
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
          nextOrder={
            rows.reduce(
              (max, row) => Math.max(max, row.question_order ?? 0),
              0,
            ) + 1
          }
          departments={departments}
          skills={skills}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onRefresh();
          }}
          onError={onError}
          onSkillCreated={onSkillCreated}
        />
      ) : null}
      {deleteTarget ? (
        <ConfirmDeleteModal
          message={`Are you sure you want to delete the video question: ${quoteSnippet(deleteTarget.prompt)}?`}
          busy={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void confirmDeactivate()}
        />
      ) : null}
    </div>
  );
}

function VideoModal({
  prompt,
  nextOrder,
  departments,
  skills,
  onClose,
  onSaved,
  onError,
  onSkillCreated,
}: {
  prompt: VideoPrompt | null;
  nextOrder: number;
  departments: Department[];
  skills: Skill[];
  onClose: () => void;
  onSaved: () => void;
  onError: (value: string) => void;
  onSkillCreated: (skill: Skill) => void;
}) {
  const [text, setText] = useState(prompt?.prompt ?? "");
  const [order, setOrder] = useState(
    prompt?.question_order ?? Math.min(Math.max(nextOrder, 1), 10),
  );
  const [timeLimit, setTimeLimit] = useState(prompt?.time_limit_seconds ?? 120);
  const [active, setActive] = useState(prompt?.is_active ?? true);
  const [departmentId, setDepartmentId] = useState<number | "">(
    prompt?.department_id ?? "",
  );
  const [domain, setDomain] = useState(prompt?.domain ?? "");
  const [difficulty, setDifficulty] = useState(prompt?.difficulty ?? "");
  const [skillIds, setSkillIds] = useState<number[]>(prompt?.skill_ids ?? []);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!text.trim()) {
      onError("Question text is required");
      return;
    }
    if (order < 1 || order > 10) {
      onError("Question order must be between 1 and 10");
      return;
    }
    if (timeLimit < 30 || timeLimit > 600) {
      onError("Time limit must be between 30 and 600 seconds");
      return;
    }
    setBusy(true);
    const body = {
      prompt: text.trim(),
      is_active: active,
      question_order: order,
      time_limit_seconds: timeLimit,
      department_id: departmentId === "" ? null : departmentId,
      domain: domain || null,
      difficulty: difficulty || "intermediate",
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
    <Modal
      title={
        <span className="inline-flex items-center gap-2">
          <VideoIcon className="h-6 w-6 text-amal-red" />
          {prompt ? "Edit Video Question" : "Add Video Question"}
        </span>
      }
      onClose={onClose}
      medium
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="Question Text *">
          <textarea
            className={`${inputClass} py-2`}
            rows={4}
            placeholder="Enter your video question..."
            value={text}
            onChange={(event) => setText(event.target.value)}
            required
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Field label="Question Order *">
              <input
                type="number"
                min={1}
                max={10}
                className={inputClass}
                value={order}
                onChange={(event) =>
                  setOrder(parseInt(event.target.value, 10) || 0)
                }
                required
              />
            </Field>
            <p className="mt-1 text-xs text-zinc-500">
              Order in which question appears (1-10)
            </p>
          </div>
          <div>
            <Field label="Time Limit (seconds) *">
              <input
                type="number"
                min={30}
                max={600}
                step={30}
                className={inputClass}
                value={timeLimit}
                onChange={(event) =>
                  setTimeLimit(parseInt(event.target.value, 10) || 0)
                }
                required
              />
            </Field>
            <p className="mt-1 text-xs text-zinc-500">
              {Math.floor(timeLimit / 60)} min {timeLimit % 60} sec
            </p>
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
          onSkillCreated={onSkillCreated}
          onError={onError}
        />
        <div className="flex justify-end gap-3 border-t border-black/10 pt-4">
          <GhostButton type="button" onClick={onClose} disabled={busy}>
            Cancel
          </GhostButton>
          <PrimaryButton type="submit" disabled={busy}>
            {busy
              ? "Saving…"
              : prompt
                ? "Update Question"
                : "Add Question"}
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
  const [deleteTarget, setDeleteTarget] =
    useState<QuestionnairePrompt | null>(null);
  const [deleting, setDeleting] = useState(false);
  const filtered = useMemo(
    () =>
      [...rows]
        .filter((row) => {
          if (filters.activity === "active" && !row.is_active) return false;
          if (filters.activity === "inactive" && row.is_active) return false;
          if (
            filters.search.trim() &&
            !row.question_text
              .toLowerCase()
              .includes(filters.search.trim().toLowerCase())
          ) {
            return false;
          }
          return true;
        })
        .sort((a, b) => a.question_order - b.question_order || a.id - b.id),
    [rows, filters],
  );

  async function confirmDeactivate() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await patchQuestionnairePrompt(deleteTarget.id, { is_active: false });
      setDeleteTarget(null);
      onRefresh();
    } catch (error) {
      onError(errorText(error));
    } finally {
      setDeleting(false);
    }
  }

  async function toggleActive(row: QuestionnairePrompt) {
    try {
      await patchQuestionnairePrompt(row.id, { is_active: !row.is_active });
      onRefresh();
    } catch (error) {
      onError(errorText(error));
    }
  }

  return (
    <div>
      <FiltersBar
        filters={filters}
        onChange={setFilters}
        departments={[]}
        skills={[]}
        showTaxonomy={false}
      />
      <div className="mb-4 rounded-xl border border-black/10 bg-amal-white px-4 py-3 shadow-sm">
        <p className="text-sm text-zinc-600">
          These questions are shown to{" "}
          <span className="font-medium text-zinc-800">every</span> candidate in
          the unified flow.
        </p>
      </div>
      <SearchAddRow
        search={filters.search}
        onSearch={(search) => setFilters((current) => ({ ...current, search }))}
        onAdd={() => setEditing("new")}
        addLabel="Add General Question"
        placeholder="Search general questions..."
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {filters.search.trim()
            ? "No general questions found matching your search."
            : "No general questions match these filters."}
        </p>
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
                  <td className="py-3">
                    <OrderBadge order={row.question_order} />
                  </td>
                  <td className="font-medium">{row.question_text}</td>
                  <td className="text-center">
                    <QuestionStatusToggle
                      active={row.is_active}
                      onToggle={() => void toggleActive(row)}
                    />
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
                        label="Delete"
                        onClick={() => setDeleteTarget(row)}
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
      {deleteTarget ? (
        <ConfirmDeleteModal
          message={`Are you sure you want to delete the question: ${quoteSnippet(deleteTarget.question_text)}?`}
          busy={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void confirmDeactivate()}
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
      <form onSubmit={onSubmit} className="space-y-4">
        <p className="text-xs text-zinc-500">
          General questionnaire items are shown to every candidate (no
          department, domain, or skills). Inactive questions are hidden from the
          unified questionnaire.
        </p>
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
        <label className="flex items-center gap-2 text-sm font-semibold">
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
      const updated = await Promise.all(
        rows.map((row) =>
          patchAssessmentSetting(row.test_type, drafts[row.test_type]),
        ),
      );
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
                {row.test_type !== "general_questionnaire" ? (
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
                ) : null}
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
                {row.test_type !== "general_questionnaire" ? (
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
                ) : null}
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
