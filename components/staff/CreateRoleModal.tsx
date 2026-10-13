"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  assignIdealProfileTemplate,
  createJobOpening,
  getClientUsers,
  getClients,
  getIdealProfileTemplates,
  getOrgDepartments,
  getOrgTitles,
  getSkillsPage,
  patchJobOpening,
} from "@/lib/staff-api";
import type {
  Department,
  OrgClient,
  OrgClientUser,
  OrgTitle,
  Skill,
  StaffJobOpening,
} from "@/lib/types";
import { AddSkillDialog } from "./AddSkillDialog";
import { IdealProfileModal } from "./IdealProfileModal";
import { JobDescriptionEditor } from "./JobDescriptionEditor";
import { Field, GhostButton, PrimaryButton, WideModal, inputClass } from "./ui";

const WORK_TYPES = [
  { id: "onsite", label: "Onsite" },
  { id: "hybrid", label: "Hybrid" },
  { id: "remote", label: "Remote" },
];

const EMPLOYMENT_TYPES = [
  { id: "full-time", label: "Full-time" },
  { id: "part-time", label: "Part-time" },
  { id: "contract", label: "Contract" },
  { id: "internship", label: "Internship" },
];

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

function hasDescription(html: string): boolean {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").trim().length > 0;
}

export function CreateRoleModal({
  opening,
  onClose,
  onSaved,
  onError,
}: {
  opening?: StaffJobOpening | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (value: string) => void;
}) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [titles, setTitles] = useState<OrgTitle[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [clients, setClients] = useState<OrgClientUser[]>([]);
  const [clientNames, setClientNames] = useState<OrgClient[]>([]);
  const [templates, setTemplates] = useState<{ id: number; name: string }[]>([]);
  const [department, setDepartment] = useState(
    opening?.department ? String(opening.department) : "",
  );
  const [levelId, setLevelId] = useState("");
  const [orgTitleId, setOrgTitleId] = useState("");
  const [title, setTitle] = useState(opening?.title ?? "");
  const [description, setDescription] = useState(opening?.description ?? "");
  const [location, setLocation] = useState(opening?.location || "Lahore");
  const [experience, setExperience] = useState(opening?.experience_level ?? "");
  const [positions, setPositions] = useState(String(opening?.positions || 1));
  const [workType, setWorkType] = useState(opening?.work_type || "onsite");
  const [employment, setEmployment] = useState(
    opening?.employment_type || "full-time",
  );
  const [qualifications, setQualifications] = useState(
    opening?.qualifications ?? "",
  );
  const [skillIds, setSkillIds] = useState(
    () => opening?.skills.map((row) => row.id) ?? [],
  );
  const [requesterIds, setRequesterIds] = useState(
    () => (opening?.client_users ?? []).map((row) => row.id),
  );
  const [requesterQuery, setRequesterQuery] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [busy, setBusy] = useState(false);
  const [skillOpen, setSkillOpen] = useState(false);
  const [idealOpen, setIdealOpen] = useState(false);

  useEffect(() => {
    void getOrgDepartments()
      .then(setDepartments)
      .catch(() => setDepartments([]));
    void getOrgTitles()
      .then((rows) => {
        setTitles(rows);
        if (!opening) {
          return;
        }
        const match = rows.find(
          (row) =>
            row.department.id === opening.department &&
            row.name === opening.title,
        );
        if (match) {
          setLevelId(String(match.level.id));
          setOrgTitleId(String(match.id));
        }
      })
      .catch(() => setTitles([]));
    void getSkillsPage()
      .then((page) => setSkills(page.results))
      .catch(() => setSkills([]));
    void getClientUsers()
      .then(setClients)
      .catch(() => setClients([]));
    void getClients()
      .then(setClientNames)
      .catch(() => setClientNames([]));
    void getIdealProfileTemplates()
      .then((page) => setTemplates(page.results))
      .catch(() => setTemplates([]));
  }, [opening]);

  const titlesInDepartment = useMemo(
    () =>
      titles.filter((row) => String(row.department.id) === department),
    [titles, department],
  );
  const levelsForDepartment = useMemo(() => {
    const seen = new Map<number, { id: number; code: string }>();
    for (const row of titlesInDepartment) {
      seen.set(row.level.id, row.level);
    }
    return [...seen.values()].sort((a, b) => a.code.localeCompare(b.code));
  }, [titlesInDepartment]);
  const titlesForLevel = useMemo(
    () =>
      titlesInDepartment.filter((row) =>
        levelId ? String(row.level.id) === levelId : true,
      ),
    [titlesInDepartment, levelId],
  );
  const clientLabel = useMemo(
    () => Object.fromEntries(clientNames.map((row) => [row.id, row.name])),
    [clientNames],
  );
  const filteredClients = useMemo(() => {
    const query = requesterQuery.trim().toLowerCase();
    if (!query) {
      return clients;
    }
    return clients.filter((row) => {
      const name = `${row.first_name} ${row.last_name}`.toLowerCase();
      const client = (clientLabel[row.client] ?? "").toLowerCase();
      return (
        name.includes(query) ||
        row.email.toLowerCase().includes(query) ||
        client.includes(query)
      );
    });
  }, [clients, requesterQuery, clientLabel]);

  const canSave =
    Boolean(title.trim()) && Boolean(department) && hasDescription(description);

  function onDepartmentChange(value: string) {
    setDepartment(value);
    setLevelId("");
    setOrgTitleId("");
    setTitle("");
  }

  function onLevelChange(value: string) {
    setLevelId(value);
    setOrgTitleId("");
    setTitle("");
  }

  function onOrgTitleChange(value: string) {
    setOrgTitleId(value);
    const picked = titlesForLevel.find((row) => String(row.id) === value);
    setTitle(picked?.name ?? "");
  }

  function toggleSkill(id: number) {
    setSkillIds((current) =>
      current.includes(id)
        ? current.filter((row) => row !== id)
        : [...current, id],
    );
  }

  function toggleRequester(id: number) {
    setRequesterIds((current) =>
      current.includes(id)
        ? current.filter((row) => row !== id)
        : [...current, id],
    );
  }

  async function save(asDraft: boolean) {
    setBusy(true);
    try {
      const body = {
        title,
        description,
        location,
        department: Number(department),
        work_type: workType,
        employment_type: employment,
        experience_level: experience,
        qualifications,
        positions: Number(positions) || 1,
        skills_required: skillIds,
        requested_by_client_users: requesterIds,
        is_draft: asDraft,
        is_active: !asDraft,
      };
      const saved = opening
        ? await patchJobOpening(opening.slug, body)
        : await createJobOpening(body);
      if (templateId) {
        await assignIdealProfileTemplate(saved.slug, Number(templateId));
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
      <WideModal
        title={opening ? "Edit Role" : "Create New Role"}
        subtitle={
          opening
            ? "Update job details and publish or save as draft."
            : "Add a job opening aligned with department and skill requirements."
        }
        onClose={onClose}
        footer={
          <>
            <GhostButton type="button" onClick={onClose} disabled={busy}>
              Cancel
            </GhostButton>
            <GhostButton
              type="button"
              disabled={busy || !canSave}
              onClick={() => void save(true)}
            >
              Save as draft
            </GhostButton>
            <PrimaryButton
              type="button"
              disabled={busy || !canSave}
              onClick={() => void save(false)}
            >
              {busy ? "Saving…" : opening ? "Update Role" : "Create Role"}
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Department">
              <select
                className={inputClass}
                value={department}
                onChange={(event) => onDepartmentChange(event.target.value)}
              >
                <option value="">Select Department</option>
                {departments.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Level">
              <select
                className={inputClass}
                value={levelId}
                disabled={!department || levelsForDepartment.length === 0}
                onChange={(event) => onLevelChange(event.target.value)}
              >
                <option value="">
                  {levelsForDepartment.length === 0
                    ? "No levels for this department"
                    : "Select Level"}
                </option>
                {levelsForDepartment.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.code}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Job title">
              {titlesForLevel.length > 0 ? (
                <select
                  className={inputClass}
                  value={orgTitleId}
                  disabled={!department || (levelsForDepartment.length > 0 && !levelId)}
                  onChange={(event) => onOrgTitleChange(event.target.value)}
                >
                  <option value="">
                    {levelsForDepartment.length > 0 && !levelId
                      ? "Select a level first"
                      : "Select job title"}
                  </option>
                  {titlesForLevel.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className={inputClass}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={
                    department
                      ? "No titles — type a title or add one in Organizational Configuration"
                      : "Select a department first"
                  }
                  disabled={!department}
                />
              )}
            </Field>
          </div>

          <Field label="Location">
            <input
              className={inputClass}
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </Field>

          <JobDescriptionEditor value={description} onChange={setDescription} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Experience Level">
              <input
                className={inputClass}
                value={experience}
                onChange={(event) => setExperience(event.target.value)}
                placeholder="e.g. 3+ years"
              />
            </Field>
            <Field label="Positions">
              <input
                className={inputClass}
                type="number"
                min={1}
                value={positions}
                onChange={(event) => setPositions(event.target.value)}
              />
            </Field>
          </div>

          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Requested by (client)
            </legend>
            <div className="mt-1 overflow-hidden rounded-lg border border-black/15">
              <div className="border-b border-black/10 p-2">
                <input
                  className={inputClass}
                  type="search"
                  value={requesterQuery}
                  onChange={(event) => setRequesterQuery(event.target.value)}
                  placeholder="Search by name, email, or client…"
                />
              </div>
              <div className="max-h-40 space-y-1 overflow-y-auto p-2">
                {clients.length === 0 ? (
                  <p className="px-2 py-1 text-sm text-zinc-500">
                    No client users available.
                  </p>
                ) : filteredClients.length === 0 ? (
                  <p className="px-2 py-1 text-sm text-zinc-500">
                    No client users match your search.
                  </p>
                ) : (
                  filteredClients.map((row) => (
                    <label
                      key={row.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm font-normal hover:bg-amal-sheet"
                    >
                      <input
                        type="checkbox"
                        checked={requesterIds.includes(row.id)}
                        onChange={() => toggleRequester(row.id)}
                      />
                      {row.first_name} {row.last_name}
                      {clientLabel[row.client]
                        ? ` (${clientLabel[row.client]})`
                        : ` (${row.email})`}
                    </label>
                  ))
                )}
              </div>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Optional. Link one or more client users who should review
              applicants for this role.
            </p>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Work Type">
              <select
                className={inputClass}
                value={workType}
                onChange={(event) => setWorkType(event.target.value)}
              >
                {WORK_TYPES.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Employment Type">
              <select
                className={inputClass}
                value={employment}
                onChange={(event) => setEmployment(event.target.value)}
              >
                {EMPLOYMENT_TYPES.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <fieldset>
            <div className="flex items-center justify-between">
              <legend className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Required Skills
              </legend>
              <button
                type="button"
                className="text-xs font-semibold text-amal-red hover:underline"
                onClick={() => setSkillOpen(true)}
              >
                + Add New Skill
              </button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
              {skills.map((row) => (
                <label
                  key={row.id}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-medium ${
                    skillIds.includes(row.id)
                      ? "border-amal-red bg-amal-red/10 text-amal-red"
                      : "border-black/15 bg-amal-white text-zinc-600 hover:bg-amal-sheet"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={skillIds.includes(row.id)}
                    onChange={() => toggleSkill(row.id)}
                  />
                  {row.name}
                </label>
              ))}
            </div>
          </fieldset>

          <Field label="Qualifications">
            <textarea
              className={`${inputClass} h-20 py-2`}
              value={qualifications}
              onChange={(event) => setQualifications(event.target.value)}
            />
          </Field>

          <div className="rounded-xl border border-black/10 bg-amal-sheet p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Ideal profile
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Optional. Clone a template to this role when you save (publish or
              draft).
            </p>
            <Field label="Template">
              <select
                className={inputClass}
                value={templateId}
                onChange={(event) => setTemplateId(event.target.value)}
              >
                <option value="">None</option>
                {templates.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name}
                  </option>
                ))}
              </select>
            </Field>
            <GhostButton type="button" onClick={() => setIdealOpen(true)}>
              Create ideal profile
            </GhostButton>
          </div>
        </div>
      </WideModal>

      {skillOpen ? (
        <AddSkillDialog
          onClose={() => setSkillOpen(false)}
          onError={onError}
          onCreated={(skill) => {
            setSkills((current) => [...current, skill]);
            setSkillIds((current) => [...current, skill.id]);
            setSkillOpen(false);
          }}
        />
      ) : null}

      {idealOpen ? (
        <IdealProfileModal
          role={null}
          onClose={() => setIdealOpen(false)}
          onError={onError}
          onSaved={(created) => {
            if (created) {
              setTemplates((current) => [...current, created]);
              setTemplateId(String(created.id));
            }
            setIdealOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
