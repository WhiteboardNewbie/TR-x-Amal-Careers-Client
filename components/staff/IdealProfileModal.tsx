"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  assignIdealProfileTemplate,
  createIdealProfileForRole,
  createIdealProfileTemplate,
  getIdealProfileForRole,
  getIdealProfileMetricCatalog,
  getIdealProfileTemplates,
  getOrgDepartments,
  getOrgTitles,
  getSkillsPage,
  updateIdealProfileForRole,
} from "@/lib/staff-api";
import type {
  Department,
  IdealProfile,
  IdealProfileMetric,
  IdealProfileMetricCatalogItem,
  IdealProfilePayload,
  IdealProfileTestConfig,
  OrgTitle,
  Skill,
  StaffJobOpening,
} from "@/lib/types";
import { AddSkillDialog } from "./AddSkillDialog";
import { GhostButton, PrimaryButton, CenteredOverlay } from "./ui";

const fieldClass =
  "mt-1 w-full rounded-lg border border-black/15 bg-amal-white px-3 py-2 text-sm outline-none focus:border-amal-red focus:ring-2 focus:ring-amal-red/20";

const TEST_CONFIG_LABELS: Record<string, string> = {
  first_test: "First test",
  video_test: "Video test",
  general_questionnaire: "Questionnaire",
};

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

function defaultMetrics(
  catalog: IdealProfileMetricCatalogItem[],
  existing: IdealProfileMetric[],
): IdealProfileMetric[] {
  const weights = new Map(existing.map((row) => [row.metric_id, row.client_weight]));
  return [...catalog]
    .sort(
      (a, b) =>
        a.display_order - b.display_order || a.label.localeCompare(b.label),
    )
    .map((row) => ({
      metric_id: row.id,
      client_weight: weights.get(row.id) ?? 5,
    }));
}

function defaultTestConfigs(
  existing: IdealProfileTestConfig[] = [],
): IdealProfileTestConfig[] {
  const defaults: IdealProfileTestConfig[] = [
    {
      test_type: "first_test",
      question_count: 15,
      time_limit_minutes: 15,
      domain: null,
      easy_count: 0,
      intermediate_count: 15,
      hard_count: 0,
    },
    {
      test_type: "video_test",
      question_count: 3,
      time_limit_minutes: 10,
      domain: null,
      easy_count: 0,
      intermediate_count: 3,
      hard_count: 0,
    },
    {
      test_type: "general_questionnaire",
      question_count: 5,
      time_limit_minutes: 8,
      domain: null,
      easy_count: 0,
      intermediate_count: 0,
      hard_count: 0,
    },
  ];
  return defaults.map((row) => {
    const found = existing.find((item) => item.test_type === row.test_type);
    if (!found) {
      return row;
    }
    const easy = found.easy_count ?? 0;
    const intermediate = found.intermediate_count ?? 0;
    const hard = found.hard_count ?? 0;
    const difficultyTotal = easy + intermediate + hard;
    return {
      ...row,
      ...found,
      domain: found.domain ?? null,
      easy_count: easy,
      intermediate_count:
        found.test_type === "general_questionnaire"
          ? 0
          : difficultyTotal === 0
            ? found.question_count
            : intermediate,
      hard_count: hard,
    };
  });
}

export function IdealProfileModal({
  role,
  onClose,
  onSaved,
  onError,
}: {
  role: StaffJobOpening | null;
  onClose: () => void;
  onSaved: (created?: IdealProfile) => void;
  onError: (value: string) => void;
}) {
  const standalone = role == null;
  const [mode, setMode] = useState<"template" | "custom">("template");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [templates, setTemplates] = useState<IdealProfile[]>([]);
  const [catalog, setCatalog] = useState<IdealProfileMetricCatalogItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [titles, setTitles] = useState<OrgTitle[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillOpen, setSkillOpen] = useState(false);
  const [templateId, setTemplateId] = useState<number | "">("");
  const [existing, setExisting] = useState<IdealProfile | null>(null);
  const [name, setName] = useState(
    role ? `${role.title} Ideal Profile` : "",
  );
  const [departmentId, setDepartmentId] = useState<number | "">(
    role?.department ?? "",
  );
  const [titleId, setTitleId] = useState<number | "">("");
  const [skillIds, setSkillIds] = useState<number[]>([]);
  const [metrics, setMetrics] = useState<IdealProfileMetric[]>([]);
  const [testConfigs, setTestConfigs] = useState<IdealProfileTestConfig[]>(() =>
    defaultTestConfigs(),
  );
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !skillOpen) {
        event.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, skillOpen]);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      getIdealProfileTemplates()
        .then((page) => page.results)
        .catch(() => [] as IdealProfile[]),
      getIdealProfileMetricCatalog().catch(
        () => [] as IdealProfileMetricCatalogItem[],
      ),
      getOrgDepartments().catch(() => [] as Department[]),
      getOrgTitles().catch(() => [] as OrgTitle[]),
      getSkillsPage()
        .then((page) => page.results)
        .catch(() => [] as Skill[]),
      role
        ? getIdealProfileForRole(role.slug).catch(() => null)
        : Promise.resolve(null),
    ])
      .then(
        ([
          nextTemplates,
          nextCatalog,
          nextDepartments,
          nextTitles,
          nextSkills,
          profile,
        ]) => {
          if (ignore) {
            return;
          }
          setTemplates(nextTemplates);
          setCatalog(nextCatalog);
          setDepartments(nextDepartments);
          setTitles(nextTitles);
          setSkills(nextSkills);
          setExisting(profile);
          setMetrics(defaultMetrics(nextCatalog, profile?.metric_weights ?? []));
          setTestConfigs(defaultTestConfigs(profile?.test_configurations ?? []));
          if (profile) {
            setName(profile.name);
            setDepartmentId(profile.department?.id ?? "");
            setTitleId(profile.title?.id ?? "");
            setSkillIds((profile.skills ?? []).map((row) => row.id));
            setTemplateId("");
            setMode("template");
          } else if (role) {
            setName(`${role.title} Ideal Profile`);
            setDepartmentId(role.department);
            setSkillIds(role.skills.map((row) => row.id));
          }
        },
      )
      .catch((error) => {
        if (!ignore) {
          onError(errorText(error));
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
  }, [onError, role]);

  const filteredTitles = useMemo(
    () =>
      titles.filter(
        (row) => !departmentId || row.department.id === departmentId,
      ),
    [titles, departmentId],
  );

  function payload(): IdealProfilePayload {
    return {
      name: name.trim(),
      department_id: departmentId === "" ? null : departmentId,
      title_id: titleId === "" ? null : titleId,
      skill_ids: skillIds,
      metric_weights: metrics,
      test_configurations: testConfigs.map((row) => {
        if (row.test_type === "general_questionnaire") {
          return {
            ...row,
            domain: null,
            easy_count: 0,
            intermediate_count: 0,
            hard_count: 0,
          };
        }
        const easy = row.easy_count ?? 0;
        const intermediate = row.intermediate_count ?? 0;
        const hard = row.hard_count ?? 0;
        const sum = easy + intermediate + hard;
        return {
          ...row,
          question_count: sum > 0 ? sum : row.question_count,
          easy_count: easy,
          intermediate_count: sum > 0 ? intermediate : row.question_count,
          hard_count: hard,
        };
      }),
    };
  }

  async function save() {
    if (standalone || mode === "custom") {
      if (!name.trim()) {
        onError("Ideal profile name is required.");
        return;
      }
    }
    setBusy(true);
    try {
      if (standalone) {
        onSaved(await createIdealProfileTemplate(payload()));
        return;
      }
      if (mode === "template") {
        if (!templateId) {
          onError("Select a template first.");
          return;
        }
        await assignIdealProfileTemplate(role.slug, templateId);
        onSaved();
        return;
      }
      const body = payload();
      if (saveAsTemplate) {
        const template = await createIdealProfileTemplate(body);
        await assignIdealProfileTemplate(role.slug, template.id);
      } else if (existing) {
        await updateIdealProfileForRole(role.slug, body);
      } else {
        await createIdealProfileForRole(role.slug, body);
      }
      onSaved();
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <CenteredOverlay
        onClose={onClose}
        zClass="z-[80]"
        backdropClassName="bg-amal-black/45"
      >
        <div
          className="pointer-events-auto flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-black/10 bg-amal-white shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ideal-profile-title"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-black/10 px-6 py-4">
            <div>
              <h3 id="ideal-profile-title" className="text-lg font-bold">
                {standalone
                  ? "Create Ideal Profile Template"
                  : `Ideal Profile • ${role.title}`}
              </h3>
              <p className="text-sm text-zinc-500">
                {standalone
                  ? "Build a reusable template you can assign to roles later."
                  : "Keep profile optional and attach when ready."}
              </p>
            </div>
            <button
              type="button"
              className="rounded-full px-2 py-1 text-sm font-semibold text-zinc-500 hover:bg-amal-sheet hover:text-amal-ink"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
            {!standalone ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("template")}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                    mode === "template"
                      ? "border-transparent bg-amal-red text-amal-white"
                      : "border-black/15 bg-amal-white text-zinc-700 hover:bg-amal-sheet"
                  }`}
                >
                  Assign Template
                </button>
                <button
                  type="button"
                  onClick={() => setMode("custom")}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                    mode === "custom"
                      ? "border-transparent bg-amal-red text-amal-white"
                      : "border-black/15 bg-amal-white text-zinc-700 hover:bg-amal-sheet"
                  }`}
                >
                  Create / Edit Custom
                </button>
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-lg border border-black/10 bg-amal-sheet p-6 text-center text-sm text-zinc-600">
                Loading ideal profile data...
              </div>
            ) : standalone || mode === "custom" ? (
              <IdealProfileForm
                name={name}
                departmentId={departmentId}
                titleId={titleId}
                skillIds={skillIds}
                departments={departments}
                titles={filteredTitles}
                skills={skills}
                catalog={catalog}
                metrics={metrics}
                testConfigs={testConfigs}
                onName={setName}
                onDepartment={(value) => {
                  setDepartmentId(value);
                  setTitleId("");
                }}
                onTitle={setTitleId}
                onSkillIds={setSkillIds}
                onMetrics={setMetrics}
                onTestConfigs={setTestConfigs}
                onRequestAddSkill={() => setSkillOpen(true)}
              />
            ) : (
              <IdealProfileTemplatePicker
                templates={templates}
                selectedTemplateId={templateId}
                onSelectTemplate={setTemplateId}
              />
            )}

            {!standalone && !loading && mode === "custom" ? (
              <label className="flex items-center gap-2 rounded-lg border border-black/10 bg-amal-sheet px-3 py-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={saveAsTemplate}
                  onChange={(event) => setSaveAsTemplate(event.target.checked)}
                />
                Also save as reusable template
              </label>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-black/10 px-6 py-4">
            <GhostButton type="button" onClick={onClose} disabled={busy}>
              Cancel
            </GhostButton>
            <PrimaryButton
              type="button"
              disabled={busy || loading}
              onClick={() => void save()}
            >
              {busy
                ? "Saving..."
                : standalone
                  ? "Create Template"
                  : "Save Ideal Profile"}
            </PrimaryButton>
          </div>
        </div>
      </CenteredOverlay>
      {skillOpen ? (
        <AddSkillDialog
          onClose={() => setSkillOpen(false)}
          onError={onError}
          onCreated={(skill) => {
            setSkills((current) => [...current, skill]);
            setSkillIds((current) =>
              current.includes(skill.id) ? current : [...current, skill.id],
            );
            setSkillOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function IdealProfileTemplatePicker({
  templates,
  selectedTemplateId,
  onSelectTemplate,
}: {
  templates: IdealProfile[];
  selectedTemplateId: number | "";
  onSelectTemplate: (id: number | "") => void;
}) {
  return (
    <div className="rounded-xl border border-black/10 bg-amal-sheet/50 p-4">
      <h3 className="text-sm font-semibold">Assign Template</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Select a reusable template and clone it for this role.
      </p>
      <select
        className={fieldClass}
        value={selectedTemplateId === "" ? "" : String(selectedTemplateId)}
        onChange={(event) =>
          onSelectTemplate(event.target.value ? Number(event.target.value) : "")
        }
      >
        <option value="">Select Template</option>
        {templates.map((row) => (
          <option key={row.id} value={row.id}>
            {row.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function IdealProfileForm({
  name,
  departmentId,
  titleId,
  skillIds,
  departments,
  titles,
  skills,
  catalog,
  metrics,
  testConfigs,
  onName,
  onDepartment,
  onTitle,
  onSkillIds,
  onMetrics,
  onTestConfigs,
  onRequestAddSkill,
}: {
  name: string;
  departmentId: number | "";
  titleId: number | "";
  skillIds: number[];
  departments: Department[];
  titles: OrgTitle[];
  skills: Skill[];
  catalog: IdealProfileMetricCatalogItem[];
  metrics: IdealProfileMetric[];
  testConfigs: IdealProfileTestConfig[];
  onName: (value: string) => void;
  onDepartment: (value: number | "") => void;
  onTitle: (value: number | "") => void;
  onSkillIds: (value: number[]) => void;
  onMetrics: (value: IdealProfileMetric[]) => void;
  onTestConfigs: (value: IdealProfileTestConfig[]) => void;
  onRequestAddSkill: () => void;
}) {
  const [tab, setTab] = useState<"profile" | "metrics" | "assessments">(
    "profile",
  );

  function toggleSkill(id: number) {
    onSkillIds(
      skillIds.includes(id)
        ? skillIds.filter((row) => row !== id)
        : [...skillIds, id],
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-black/10 pb-3">
        {(
          [
            ["profile", "Profile"],
            ["metrics", "Ideal Profile Metrics"],
            ["assessments", "Assessment configs"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
              tab === id
                ? "border-transparent bg-amal-red text-amal-white"
                : "border-black/15 bg-amal-white text-zinc-700 hover:bg-amal-sheet"
            }`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "profile" ? (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="text-xs font-medium text-zinc-600">
              Profile Name
              <input
                className={fieldClass}
                value={name}
                onChange={(event) => onName(event.target.value)}
              />
            </label>
          </div>
          <div className="rounded-xl border border-black/10 bg-amal-sheet/50 p-4">
            <h3 className="text-sm font-semibold">Core Role Alignment</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="text-xs font-medium text-zinc-600">
                Department
                <select
                  className={fieldClass}
                  value={departmentId === "" ? "" : String(departmentId)}
                  onChange={(event) =>
                    onDepartment(
                      event.target.value ? Number(event.target.value) : "",
                    )
                  }
                >
                  <option value="">Not Set</option>
                  {departments.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium text-zinc-600 md:col-span-2">
                Title
                <select
                  className={fieldClass}
                  value={titleId === "" ? "" : String(titleId)}
                  onChange={(event) =>
                    onTitle(event.target.value ? Number(event.target.value) : "")
                  }
                >
                  <option value="">Not Set</option>
                  {titles.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-3 rounded-lg border border-black/10 bg-amal-white p-2">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-zinc-600">
                  Skills (all assessments)
                </p>
                <button
                  type="button"
                  onClick={onRequestAddSkill}
                  className="shrink-0 text-xs font-semibold text-amal-red hover:text-amal-ink"
                >
                  + Add New Skill
                </button>
              </div>
              <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto">
                {skills.map((row) => (
                  <label
                    key={row.id}
                    className="inline-flex items-center gap-2 rounded-md border border-black/10 px-2 py-1 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={skillIds.includes(row.id)}
                      onChange={() => toggleSkill(row.id)}
                    />
                    {row.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
      {tab === "metrics" ? (
        <IdealProfileMetricsTable
          catalog={catalog}
          metrics={metrics}
          onChange={onMetrics}
        />
      ) : null}
      {tab === "assessments" ? (
        <IdealProfileTestConfigsTable
          configs={testConfigs}
          onChange={onTestConfigs}
        />
      ) : null}
    </div>
  );
}

function IdealProfileTestConfigsTable({
  configs,
  onChange,
}: {
  configs: IdealProfileTestConfig[];
  onChange: (next: IdealProfileTestConfig[]) => void;
}) {
  function update(testType: string, patch: Partial<IdealProfileTestConfig>) {
    onChange(
      configs.map((row) => {
        if (row.test_type !== testType) {
          return row;
        }
        const next = { ...row, ...patch };
        if (testType === "general_questionnaire") {
          return {
            ...next,
            domain: null,
            easy_count: 0,
            intermediate_count: 0,
            hard_count: 0,
          };
        }
        const easy = next.easy_count ?? 0;
        const intermediate = next.intermediate_count ?? 0;
        const hard = next.hard_count ?? 0;
        return {
          ...next,
          question_count: Math.max(1, easy + intermediate + hard),
        };
      }),
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-black/10 bg-amal-sheet/50 p-4">
      <div>
        <h3 className="text-sm font-semibold">Assessment configs</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Per-test counts and difficulty mix. Easy + intermediate + hard must
          equal the question count for first and video tests.
        </p>
      </div>
      {configs.map((row) => {
        const isQuestionnaire = row.test_type === "general_questionnaire";
        return (
          <div
            key={row.test_type}
            className="rounded-lg border border-black/10 bg-amal-white p-3"
          >
            <p className="text-sm font-semibold">
              {TEST_CONFIG_LABELS[row.test_type] ?? row.test_type}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
              <label className="text-xs font-medium text-zinc-600">
                Questions
                <input
                  type="number"
                  min={1}
                  className={fieldClass}
                  value={row.question_count}
                  disabled={!isQuestionnaire}
                  onChange={(event) =>
                    update(row.test_type, {
                      question_count: Math.max(
                        1,
                        Number(event.target.value) || 1,
                      ),
                    })
                  }
                />
              </label>
              <label className="text-xs font-medium text-zinc-600">
                Time (min)
                <input
                  type="number"
                  min={1}
                  className={fieldClass}
                  value={row.time_limit_minutes}
                  onChange={(event) =>
                    update(row.test_type, {
                      time_limit_minutes: Math.max(
                        1,
                        Number(event.target.value) || 1,
                      ),
                    })
                  }
                />
              </label>
              {!isQuestionnaire ? (
                <>
                  <label className="text-xs font-medium text-zinc-600">
                    Domain
                    <select
                      className={fieldClass}
                      value={row.domain ?? ""}
                      onChange={(event) =>
                        update(row.test_type, {
                          domain: (event.target.value ||
                            null) as IdealProfileTestConfig["domain"],
                        })
                      }
                    >
                      <option value="">Not set</option>
                      <option value="technical">Technical</option>
                      <option value="behavioral">Behavioral</option>
                    </select>
                  </label>
                  <span />
                  <label className="text-xs font-medium text-zinc-600">
                    Easy
                    <input
                      type="number"
                      min={0}
                      className={fieldClass}
                      value={row.easy_count ?? 0}
                      onChange={(event) =>
                        update(row.test_type, {
                          easy_count: Math.max(
                            0,
                            Number(event.target.value) || 0,
                          ),
                        })
                      }
                    />
                  </label>
                  <label className="text-xs font-medium text-zinc-600">
                    Intermediate
                    <input
                      type="number"
                      min={0}
                      className={fieldClass}
                      value={row.intermediate_count ?? 0}
                      onChange={(event) =>
                        update(row.test_type, {
                          intermediate_count: Math.max(
                            0,
                            Number(event.target.value) || 0,
                          ),
                        })
                      }
                    />
                  </label>
                  <label className="text-xs font-medium text-zinc-600">
                    Hard
                    <input
                      type="number"
                      min={0}
                      className={fieldClass}
                      value={row.hard_count ?? 0}
                      onChange={(event) =>
                        update(row.test_type, {
                          hard_count: Math.max(
                            0,
                            Number(event.target.value) || 0,
                          ),
                        })
                      }
                    />
                  </label>
                </>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function IdealProfileMetricsTable({
  catalog,
  metrics,
  onChange,
}: {
  catalog: IdealProfileMetricCatalogItem[];
  metrics: IdealProfileMetric[];
  onChange: (next: IdealProfileMetric[]) => void;
}) {
  const sorted = [...catalog].sort(
    (a, b) =>
      a.display_order - b.display_order || a.label.localeCompare(b.label),
  );

  function setWeight(metricId: number, raw: string) {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      return;
    }
    const client_weight = Math.min(10, Math.max(1, parsed));
    const map = new Map(metrics.map((row) => [row.metric_id, row.client_weight]));
    map.set(metricId, client_weight);
    onChange(
      sorted.map((row) => ({
        metric_id: row.id,
        client_weight: map.get(row.id) ?? 5,
      })),
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-black/10 bg-amal-sheet/50 p-4">
      <h3 className="text-sm font-semibold">Ideal Profile Metrics</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Client weight for each metric (1–10).
      </p>
      <table className="mt-3 w-full min-w-[480px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-black/10 text-zinc-600">
            <th className="py-2 pr-3 font-medium">Metric</th>
            <th className="py-2 pr-3 font-medium">Description</th>
            <th className="w-28 py-2 font-medium">Client weight</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const weight =
              metrics.find((item) => item.metric_id === row.id)?.client_weight ??
              5;
            return (
              <tr key={row.id} className="border-b border-black/5 align-top">
                <td className="py-2 pr-3 font-medium">{row.label}</td>
                <td className="py-2 pr-3 text-zinc-600">
                  {row.description || "—"}
                </td>
                <td className="py-2">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    className="w-20 rounded-lg border border-black/15 bg-amal-white px-2 py-1.5 text-center text-sm outline-none focus:border-amal-red focus:ring-2 focus:ring-amal-red/20"
                    value={weight}
                    onChange={(event) => setWeight(row.id, event.target.value)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {sorted.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">No metrics in the catalog.</p>
      ) : null}
    </div>
  );
}
