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
  updateIdealProfileForRole,
} from "@/lib/staff-api";
import type {
  Department,
  IdealProfile,
  IdealProfileMetric,
  IdealProfileMetricCatalogItem,
  IdealProfilePayload,
  OrgTitle,
  StaffJobOpening,
} from "@/lib/types";
import { Field, GhostButton, PrimaryButton, inputClass } from "./ui";

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

export function IdealProfileModal({
  role,
  onClose,
  onSaved,
  onError,
}: {
  role: StaffJobOpening | null;
  onClose: () => void;
  onSaved: () => void;
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
  const [templateId, setTemplateId] = useState<number | "">("");
  const [existing, setExisting] = useState<IdealProfile | null>(null);
  const [name, setName] = useState(
    role ? `${role.title} Ideal Profile` : "",
  );
  const [departmentId, setDepartmentId] = useState<number | "">(
    role?.department ?? "",
  );
  const [titleId, setTitleId] = useState<number | "">("");
  const [metrics, setMetrics] = useState<IdealProfileMetric[]>([]);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let ignore = false;
    const catalogPromise = getIdealProfileMetricCatalog()
      .then((page) => page.results)
      .catch(() => [] as IdealProfileMetricCatalogItem[]);
    Promise.all([
      getIdealProfileTemplates()
        .then((page) => page.results)
        .catch(() => [] as IdealProfile[]),
      catalogPromise,
      getOrgDepartments().catch(() => [] as Department[]),
      getOrgTitles().catch(() => [] as OrgTitle[]),
      role
        ? getIdealProfileForRole(role.slug).catch(() => null)
        : Promise.resolve(null),
    ])
      .then(([nextTemplates, nextCatalog, nextDepartments, nextTitles, profile]) => {
        if (ignore) {
          return;
        }
        setTemplates(nextTemplates);
        setCatalog(nextCatalog);
        setDepartments(nextDepartments);
        setTitles(nextTitles);
        setExisting(profile);
        const nextMetrics = defaultMetrics(
          nextCatalog,
          profile?.metric_weights ?? [],
        );
        setMetrics(nextMetrics);
        if (profile) {
          setName(profile.name);
          setDepartmentId(profile.department?.id ?? "");
          setTitleId(profile.title?.id ?? "");
          setTemplateId("");
          setMode("template");
        } else if (role) {
          setName(`${role.title} Ideal Profile`);
          setDepartmentId(role.department);
        }
      })
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
      metric_weights: metrics,
    };
  }

  async function save() {
    if (!name.trim()) {
      onError("Ideal profile name is required.");
      return;
    }
    setBusy(true);
    try {
      if (standalone) {
        await createIdealProfileTemplate(payload());
        onSaved();
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
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-amal-black/45 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-black/10 bg-amal-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ideal-profile-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-black/10 px-6 py-4">
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
        <div className="space-y-4 p-6">
          {!standalone ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("template")}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                  mode === "template"
                    ? "bg-amal-red text-amal-white"
                    : "border border-black/15 bg-amal-white text-zinc-700"
                }`}
              >
                Assign Template
              </button>
              <button
                type="button"
                onClick={() => setMode("custom")}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                  mode === "custom"
                    ? "bg-amal-red text-amal-white"
                    : "border border-black/15 bg-amal-white text-zinc-700"
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
              departments={departments}
              titles={filteredTitles}
              catalog={catalog}
              metrics={metrics}
              onName={setName}
              onDepartment={(value) => {
                setDepartmentId(value);
                setTitleId("");
              }}
              onTitle={setTitleId}
              onMetrics={setMetrics}
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
        <div className="flex items-center justify-end gap-2 border-t border-black/10 px-6 py-4">
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
    </div>
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
    <div className="rounded-xl border border-black/10 bg-amal-sheet p-4">
      <h3 className="text-sm font-semibold">Assign Template</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Select a reusable template and clone it for this role.
      </p>
      <select
        className={`${inputClass} mt-3`}
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
  departments,
  titles,
  catalog,
  metrics,
  onName,
  onDepartment,
  onTitle,
  onMetrics,
}: {
  name: string;
  departmentId: number | "";
  titleId: number | "";
  departments: Department[];
  titles: OrgTitle[];
  catalog: IdealProfileMetricCatalogItem[];
  metrics: IdealProfileMetric[];
  onName: (value: string) => void;
  onDepartment: (value: number | "") => void;
  onTitle: (value: number | "") => void;
  onMetrics: (value: IdealProfileMetric[]) => void;
}) {
  const [tab, setTab] = useState<"profile" | "metrics">("profile");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-black/10 pb-3">
        <button
          type="button"
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
            tab === "profile"
              ? "bg-amal-red text-amal-white"
              : "border border-black/15 bg-amal-white text-zinc-700"
          }`}
          onClick={() => setTab("profile")}
        >
          Profile
        </button>
        <button
          type="button"
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
            tab === "metrics"
              ? "bg-amal-red text-amal-white"
              : "border border-black/15 bg-amal-white text-zinc-700"
          }`}
          onClick={() => setTab("metrics")}
        >
          Ideal Profile Metrics
        </button>
      </div>
      {tab === "profile" ? (
        <>
          <Field label="Profile Name">
            <input
              className={inputClass}
              value={name}
              onChange={(event) => onName(event.target.value)}
            />
          </Field>
          <div className="rounded-xl border border-black/10 bg-amal-sheet p-4">
            <h3 className="text-sm font-semibold">Core Role Alignment</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Department">
                <select
                  className={inputClass}
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
              </Field>
              <Field label="Title">
                <select
                  className={inputClass}
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
              </Field>
            </div>
          </div>
        </>
      ) : (
        <IdealProfileMetricsTable
          catalog={catalog}
          metrics={metrics}
          onChange={onMetrics}
        />
      )}
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
    <div className="overflow-x-auto rounded-xl border border-black/10 bg-amal-sheet p-4">
      <h3 className="text-sm font-semibold">Ideal Profile Metrics</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Client weight for each metric (1–10).
      </p>
      <table className="mt-3 w-full min-w-[480px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-black/10 text-zinc-600">
            <th className="py-2 pr-3 font-medium">Metric</th>
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
                <td className="py-2">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    className="h-10 w-20 rounded-lg border border-black/15 bg-amal-white px-2 text-center text-sm outline-none focus:border-amal-red focus:ring-2 focus:ring-amal-red/20"
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
