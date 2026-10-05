"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, createJobApplication, getJobOpening } from "@/lib/api";
import {
  createIdealProfileTemplate,
  createJobOpening,
  createStage,
  getAssignedStages,
  getDepartmentManagers,
  getEmployees,
  getHrStages,
  getOrgDepartments,
  getOrgTitles,
  getApplicants,
  getStaffApplication,
  getStaffApplications,
  getStaffJobOpenings,
  patchJobOpening,
  scheduleStage,
  setHrStageStatus,
  updateApplicationStatus,
} from "@/lib/staff-api";
import { APPLICATION_STATUSES, labelFor } from "@/lib/status";
import type {
  ApplicationStage,
  Department,
  DepartmentManager,
  Employee,
  OrgTitle,
  StaffApplication,
  StaffJobOpening,
} from "@/lib/types";
import { ApplicantsTab } from "./ApplicantsTab";
import {
  Field,
  GhostButton,
  Modal,
  PrimaryButton,
  TablePager,
  inputClass,
} from "./ui";

type Tab = "roles" | "applicants" | "applications" | "stages" | "manage";

const TABS: { id: Tab; label: string }[] = [
  { id: "roles", label: "Roles" },
  { id: "applicants", label: "Applicants" },
  { id: "applications", label: "Job Applications" },
  { id: "stages", label: "Stage Assignments" },
  { id: "manage", label: "Manage Applications" },
];

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

export function StaffHub() {
  const [tab, setTab] = useState<Tab>("roles");
  const [notice, setNotice] = useState("");
  const onError = useCallback((value: string) => setNotice(value), []);
  const [roleCount, setRoleCount] = useState(0);
  const [appCount, setAppCount] = useState(0);
  const [applicantCount, setApplicantCount] = useState(0);
  const [modal, setModal] = useState<
    "role" | "application" | "ideal" | "stage" | "schedule" | null
  >(null);
  const [stageTarget, setStageTarget] = useState<StaffApplication | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<ApplicationStage | null>(
    null,
  );

  const [countsTick, setCountsTick] = useState(0);

  useEffect(() => {
    let ignore = false;
    getStaffJobOpenings({ page: 1, page_size: 1 }).then((page) => {
      if (!ignore) {
        setRoleCount(page.count);
      }
    });
    getStaffApplications({ page: 1, page_size: 1 }).then((page) => {
      if (!ignore) {
        setAppCount(page.count);
      }
    });
    getApplicants({ page: 1, page_size: 1 }).then((page) => {
      if (!ignore) {
        setApplicantCount(page.count);
      }
    });
    return () => {
      ignore = true;
    };
  }, [countsTick]);

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-amal-staff-banner to-amal-black px-6 py-10 text-amal-white md:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amal-white/70">
          Hiring
        </p>
        <h1 className="mt-2 text-3xl font-bold">Careers</h1>
        <p className="mt-2 max-w-2xl text-sm text-amal-white/80">
          Roles, applications, stage assignments, and interviews.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-xl bg-amal-white px-4 py-2 text-sm font-semibold text-amal-ink"
            onClick={() => setModal("role")}
          >
            Create Role
          </button>
          <button
            type="button"
            className="rounded-xl border border-amal-white/40 bg-amal-white/10 px-4 py-2 text-sm font-semibold"
            onClick={() => setModal("application")}
          >
            Create Job Application
          </button>
          <button
            type="button"
            className="rounded-xl border border-amal-white/40 bg-amal-white/10 px-4 py-2 text-sm font-semibold"
            onClick={() => setModal("ideal")}
          >
            Create Ideal Profile
          </button>
        </div>
      </section>

      <div className="page-container py-8">
        {notice ? (
          <p className="mb-4 rounded-lg border border-amal-red/30 bg-amal-white px-3 py-2 text-sm text-amal-red">
            {notice}
          </p>
        ) : null}

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            className="rounded-2xl border border-black/10 bg-amal-white p-5 text-left"
            onClick={() => setTab("roles")}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Roles
            </p>
            <p className="mt-2 text-3xl font-bold">{roleCount}</p>
          </button>
          <button
            type="button"
            className="rounded-2xl border border-black/10 bg-amal-white p-5 text-left"
            onClick={() => setTab("applicants")}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Unique Applicants
            </p>
            <p className="mt-2 text-3xl font-bold">{applicantCount}</p>
          </button>
          <button
            type="button"
            className="rounded-2xl border border-black/10 bg-amal-white p-5 text-left"
            onClick={() => setTab("applications")}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Total Applications
            </p>
            <p className="mt-2 text-3xl font-bold">{appCount}</p>
          </button>
        </div>

        <div className="rounded-2xl border border-black/10 bg-amal-white p-4 md:p-6">
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
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === "roles" ? (
            <RolesTab onError={onError} />
          ) : null}
          {tab === "applicants" ? <ApplicantsTab onError={onError} /> : null}
          {tab === "applications" ? (
            <ApplicationsTab
              onError={onError}
              onAssign={(row) => {
                setStageTarget(row);
                setModal("stage");
              }}
            />
          ) : null}
          {tab === "stages" ? (
            <StagesTab
              onError={onError}
              onSchedule={(row) => {
                setScheduleTarget(row);
                setModal("schedule");
              }}
            />
          ) : null}
          {tab === "manage" ? <ManageTab onError={onError} /> : null}
        </div>
      </div>

      {modal === "role" ? (
        <CreateRoleModal
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            setCountsTick((value) => value + 1);
          }}
          onError={onError}
        />
      ) : null}
      {modal === "application" ? (
        <CreateApplicationModal
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            setCountsTick((value) => value + 1);
          }}
          onError={onError}
        />
      ) : null}
      {modal === "ideal" ? (
        <CreateIdealModal
          onClose={() => setModal(null)}
          onSaved={() => setModal(null)}
          onError={onError}
        />
      ) : null}
      {modal === "stage" && stageTarget ? (
        <AssignStageModal
          application={stageTarget}
          onClose={() => {
            setModal(null);
            setStageTarget(null);
          }}
          onError={onError}
        />
      ) : null}
      {modal === "schedule" && scheduleTarget ? (
        <ScheduleModal
          stage={scheduleTarget}
          onClose={() => {
            setModal(null);
            setScheduleTarget(null);
          }}
          onError={onError}
        />
      ) : null}
    </div>
  );
}

function RolesTab({ onError }: { onError: (value: string) => void }) {
  const [page, setPage] = useState(1);
  const [tick, setTick] = useState(0);
  const [rows, setRows] = useState<StaffJobOpening[]>([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let ignore = false;
    getStaffJobOpenings({ page, page_size: 10 })
      .then((data) => {
        if (!ignore) {
          setRows(data.results);
          setCount(data.count);
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
  }, [page, tick, onError]);

  async function toggle(row: StaffJobOpening) {
    try {
      await patchJobOpening(row.slug, { is_active: !row.is_active });
      setTick((value) => value + 1);
    } catch (error) {
      onError(errorText(error));
    }
  }

  return (
    <div>
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500">No roles on this page.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-zinc-500">
                <th className="py-2">Role</th>
                <th>Department</th>
                <th>Location</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-black/5">
                  <td className="py-3 font-semibold">{row.title}</td>
                  <td>{row.department_name}</td>
                  <td>{row.location}</td>
                  <td>
                    {row.is_draft
                      ? "Draft"
                      : row.is_active
                        ? "Active"
                        : "Closed"}
                  </td>
                  <td className="text-right">
                    {!row.is_draft ? (
                      <GhostButton onClick={() => void toggle(row)}>
                        {row.is_active ? "Close" : "Open"}
                      </GhostButton>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <TablePager page={page} pageSize={10} count={count} onPage={setPage} />
    </div>
  );
}

function ApplicationsTab({
  onError,
  onAssign,
}: {
  onError: (value: string) => void;
  onAssign: (row: StaffApplication) => void;
}) {
  const [page, setPage] = useState(1);
  const [tick, setTick] = useState(0);
  const [rows, setRows] = useState<StaffApplication[]>([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let ignore = false;
    getStaffApplications({ page, page_size: 10 })
      .then((data) => {
        if (!ignore) {
          setRows(data.results);
          setCount(data.count);
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
  }, [page, tick, onError]);

  async function changeStatus(row: StaffApplication, status: string) {
    try {
      await updateApplicationStatus(row.id, status);
      setTick((value) => value + 1);
    } catch (error) {
      onError(errorText(error));
    }
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-zinc-500">
              <th className="py-2">Applicant</th>
              <th>Role</th>
              <th>Status</th>
              <th>Applied</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-black/5">
                <td className="py-3">
                  <p className="font-semibold">{row.applicant.name}</p>
                  <p className="text-zinc-500">{row.applicant.email}</p>
                </td>
                <td>{row.job_opening_name}</td>
                <td>
                  <select
                    className={inputClass}
                    value={row.status}
                    onChange={(event) =>
                      void changeStatus(row, event.target.value)
                    }
                  >
                    {APPLICATION_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {labelFor(status)}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{row.applied_at.slice(0, 10)}</td>
                <td className="text-right">
                  <GhostButton onClick={() => onAssign(row)}>
                    Assign stage
                  </GhostButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePager page={page} pageSize={10} count={count} onPage={setPage} />
    </div>
  );
}

function StagesTab({
  onError,
  onSchedule,
}: {
  onError: (value: string) => void;
  onSchedule: (row: ApplicationStage) => void;
}) {
  const [page, setPage] = useState(1);
  const [tick, setTick] = useState(0);
  const [rows, setRows] = useState<ApplicationStage[]>([]);
  const [count, setCount] = useState(0);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const names = useMemo(
    () => Object.fromEntries(employees.map((row) => [row.id, row.full_name])),
    [employees],
  );

  useEffect(() => {
    let ignore = false;
    getEmployees()
      .then((data) => {
        if (!ignore) {
          setEmployees(data);
        }
      })
      .catch(() => {
        if (!ignore) {
          setEmployees([]);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    getHrStages({ page, page_size: 10 })
      .then((data) => {
        if (!ignore) {
          setRows(data.results);
          setCount(data.count);
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
  }, [page, tick, onError]);

  async function changeHr(row: ApplicationStage, status: string) {
    try {
      await setHrStageStatus(row.id, status);
      setTick((value) => value + 1);
    } catch (error) {
      onError(errorText(error));
    }
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-zinc-500">
              <th className="py-2">Stage</th>
              <th>Application</th>
              <th>Reviewer</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-black/5">
                <td className="py-3 font-semibold">{row.name || "Review"}</td>
                <td>#{row.job_application}</td>
                <td>{names[row.assigned_to] ?? row.assigned_to}</td>
                <td>{labelFor(row.status)}</td>
                <td className="space-x-2 text-right">
                  <GhostButton
                    onClick={() => void changeHr(row, "requested_interview")}
                  >
                    Request interview
                  </GhostButton>
                  <GhostButton onClick={() => onSchedule(row)}>
                    Schedule
                  </GhostButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePager page={page} pageSize={10} count={count} onPage={setPage} />
    </div>
  );
}

function ManageTab({ onError }: { onError: (value: string) => void }) {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<ApplicationStage[]>([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let ignore = false;
    getAssignedStages({ page, page_size: 10 })
      .then((data) => {
        if (!ignore) {
          setRows(data.results);
          setCount(data.count);
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
  }, [page, onError]);

  return (
    <div>
      <p className="mb-4 text-sm text-zinc-500">
        Stages assigned to the signed-in reviewer. The Reviews landing is the
        employee view of this list.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-zinc-500">
              <th className="py-2">Stage</th>
              <th>Application</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-black/5">
                <td className="py-3 font-semibold">{row.name || "Review"}</td>
                <td>#{row.job_application}</td>
                <td>{labelFor(row.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePager page={page} pageSize={10} count={count} onPage={setPage} />
    </div>
  );
}

function CreateRoleModal({
  onClose,
  onSaved,
  onError,
}: {
  onClose: () => void;
  onSaved: () => void;
  onError: (value: string) => void;
}) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("Lahore");
  const [department, setDepartment] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getOrgDepartments().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await createJobOpening({
        title,
        description,
        location,
        department: Number(department),
        work_type: "onsite",
        employment_type: "full-time",
        is_draft: false,
        is_active: true,
      });
      onSaved();
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Create Role" onClose={onClose}>
      <form onSubmit={onSubmit}>
        <Field label="Title">
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
        </Field>
        <Field label="Department">
          <select className={inputClass} value={department} onChange={(e) => setDepartment(e.target.value)} required>
            <option value="">Select</option>
            {departments.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Location">
          <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} required />
        </Field>
        <Field label="Description">
          <textarea className={`${inputClass} h-28 py-2`} value={description} onChange={(e) => setDescription(e.target.value)} required />
        </Field>
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? "Saving…" : "Publish role"}
        </PrimaryButton>
      </form>
    </Modal>
  );
}

function CreateApplicationModal({
  onClose,
  onSaved,
  onError,
}: {
  onClose: () => void;
  onSaved: () => void;
  onError: (value: string) => void;
}) {
  const [roles, setRoles] = useState<StaffJobOpening[]>([]);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [contact, setContact] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getStaffJobOpenings({ page: 1, page_size: 50, is_active: true }).then(
      (page) => setRoles(page.results.filter((row) => !row.is_draft)),
    );
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!resume) {
      onError("Resume is required.");
      return;
    }
    setBusy(true);
    try {
      await createJobApplication({
        job_opening: slug,
        applicant_name: name,
        applicant_email: email,
        applicant_city: city,
        applicant_contact: contact,
        resume,
      });
      onSaved();
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Create Job Application" onClose={onClose}>
      <form onSubmit={onSubmit}>
        <Field label="Role">
          <select className={inputClass} value={slug} onChange={(e) => setSlug(e.target.value)} required>
            <option value="">Select</option>
            {roles.map((row) => (
              <option key={row.id} value={row.slug}>
                {row.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Name">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Email">
          <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="City">
          <input className={inputClass} value={city} onChange={(e) => setCity(e.target.value)} required />
        </Field>
        <Field label="Phone">
          <input className={inputClass} value={contact} onChange={(e) => setContact(e.target.value)} required />
        </Field>
        <Field label="Resume">
          <input className={inputClass} type="file" accept=".pdf,.doc,.docx" onChange={(e) => setResume(e.target.files?.[0] ?? null)} required />
        </Field>
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? "Saving…" : "Create application"}
        </PrimaryButton>
      </form>
    </Modal>
  );
}

function CreateIdealModal({
  onClose,
  onSaved,
  onError,
}: {
  onClose: () => void;
  onSaved: () => void;
  onError: (value: string) => void;
}) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [titles, setTitles] = useState<OrgTitle[]>([]);
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const filtered = titles.filter((row) =>
    department ? String(row.department.id) === department : true,
  );

  useEffect(() => {
    void getOrgDepartments().then(setDepartments);
    void getOrgTitles().then(setTitles);
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await createIdealProfileTemplate({
        name,
        department_id: department ? Number(department) : null,
        title_id: title ? Number(title) : null,
      });
      onSaved();
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Create Ideal Profile" onClose={onClose}>
      <form onSubmit={onSubmit}>
        <Field label="Name">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Department">
          <select className={inputClass} value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">Any</option>
            {departments.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Title">
          <select className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)}>
            <option value="">Any</option>
            {filtered.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
        </Field>
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save template"}
        </PrimaryButton>
      </form>
    </Modal>
  );
}

function AssignStageModal({
  application,
  onClose,
  onError,
}: {
  application: StaffApplication;
  onClose: () => void;
  onError: (value: string) => void;
}) {
  const [managers, setManagers] = useState<DepartmentManager[]>([]);
  const [assignedTo, setAssignedTo] = useState("");
  const [name, setName] = useState("Review");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let ignore = false;
    getStaffApplication(application.id)
      .then(async (detail) => {
        const opening = await getJobOpening(detail.job_opening);
        return getDepartmentManagers(opening.department);
      })
      .then((rows) => {
        if (!ignore) {
          setManagers(rows);
        }
      })
      .catch((error) => onError(errorText(error)));
    return () => {
      ignore = true;
    };
  }, [application.id, onError]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await createStage(application.id, {
        assigned_to: Number(assignedTo),
        name,
        hr_notes: notes,
      });
      onClose();
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Assign stage — ${application.applicant.name}`} onClose={onClose}>
      <form onSubmit={onSubmit}>
        <Field label="Reviewer">
          <select className={inputClass} value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} required>
            <option value="">Select</option>
            {managers.map((row) => (
              <option key={row.id} value={row.id}>
                {row.full_name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Stage name">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="HR notes">
          <textarea className={`${inputClass} h-20 py-2`} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <PrimaryButton type="submit" disabled={busy || !assignedTo}>
          {busy ? "Saving…" : "Assign"}
        </PrimaryButton>
      </form>
    </Modal>
  );
}

function ScheduleModal({
  stage,
  onClose,
  onError,
}: {
  stage: ApplicationStage;
  onClose: () => void;
  onError: (value: string) => void;
}) {
  const [when, setWhen] = useState("");
  const [kind, setKind] = useState("online");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await scheduleStage(stage.id, {
        scheduled_at: when ? new Date(when).toISOString() : null,
        interview_type: kind,
      });
      onClose();
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Schedule interview" onClose={onClose}>
      <form onSubmit={onSubmit}>
        <Field label="When">
          <input className={inputClass} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} required />
        </Field>
        <Field label="Type">
          <select className={inputClass} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="online">Online</option>
            <option value="on_site">On site</option>
          </select>
        </Field>
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? "Saving…" : "Schedule"}
        </PrimaryButton>
      </form>
    </Modal>
  );
}
