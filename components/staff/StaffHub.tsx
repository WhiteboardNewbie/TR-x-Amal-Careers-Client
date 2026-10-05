"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError } from "@/lib/api";
import {
  scheduleClearCareersApplicationsReturnCache,
  takeCareersApplicationsReturn,
} from "@/lib/careers-return";
import { preventFocusScroll } from "@/lib/prevent-focus-scroll";
import {
  getAssignedStages,
  getEmployees,
  getHrStages,
  getOrgDepartments,
  getApplicants,
  getStaffApplications,
  getStaffJobOpenings,
  patchJobOpening,
  scheduleStage,
  setHrStageStatus,
} from "@/lib/staff-api";
import { labelFor } from "@/lib/status";
import type {
  ApplicationStage,
  Department,
  Employee,
  JobApplicationStatus,
  StaffJobOpening,
} from "@/lib/types";
import { ApplicantsTab } from "./ApplicantsTab";
import { ApplicationsTab } from "./ApplicationsTab";
import { CreateApplicationModal } from "./CreateApplicationModal";
import { CreateRoleModal } from "./CreateRoleModal";
import { IdealProfileModal } from "./IdealProfileModal";
import { RoleDetailModal } from "./RoleDetailModal";
import { StaffBanner } from "./StaffBanner";
import {
  BriefcaseIcon,
  ChecksIcon,
  ClipboardIcon,
  ListIcon,
  UserIcon,
  UsersIcon,
} from "./icons";
import {
  Field,
  GhostButton,
  Modal,
  PrimaryButton,
  TablePager,
  inputClass,
} from "./ui";

type Tab = "roles" | "applicants" | "applications" | "stages" | "manage";
type RoleStatus = "all" | "active" | "closed" | "draft";

const TABS: {
  id: Tab;
  label: string;
  description: string;
  icon: (props: { className?: string }) => ReactNode;
}[] = [
  {
    id: "roles",
    label: "Roles",
    description: "Manage roles and candidates.",
    icon: BriefcaseIcon,
  },
  {
    id: "applicants",
    label: "Applicants",
    description: "Candidate profiles and sourcing details.",
    icon: UsersIcon,
  },
  {
    id: "applications",
    label: "Job Applications",
    description: "Track all candidate applications.",
    icon: ClipboardIcon,
  },
  {
    id: "stages",
    label: "Stage Assignments",
    description: "All manager stage assignments and pipeline status.",
    icon: ListIcon,
  },
  {
    id: "manage",
    label: "Manage Applications",
    description: "Stages assigned to you.",
    icon: ChecksIcon,
  },
];

const WORK_TYPE_LABEL: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "Onsite",
};

const EMPLOYMENT_LABEL: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  internship: "Internship",
};

function compactText(value: string, limit: number): string {
  const text = value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (text.length <= limit) {
    return text;
  }
  return `${text.slice(0, limit).trim()}…`;
}

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

export function StaffHub() {
  const [restored] = useState(() => takeCareersApplicationsReturn());
  const [tab, setTab] = useState<Tab>(
    restored?.tab === "applications" ? "applications" : "roles",
  );
  const [applicationsRestore, setApplicationsRestore] = useState(
    restored?.tab === "applications"
      ? {
          filters: restored.filters,
          page: restored.page,
          pageSize: restored.pageSize,
        }
      : null,
  );
  const [notice, setNotice] = useState("");
  const onError = useCallback((value: string) => setNotice(value), []);
  const [roleCount, setRoleCount] = useState(0);
  const [appCount, setAppCount] = useState(0);
  const [applicantCount, setApplicantCount] = useState(0);
  const [modal, setModal] = useState<"role" | "application" | "schedule" | null>(
    null,
  );
  const [editingRole, setEditingRole] = useState<StaffJobOpening | null>(null);
  const [idealRole, setIdealRole] = useState<StaffJobOpening | null>(null);
  const [idealStandalone, setIdealStandalone] = useState(false);
  const [scheduleTarget, setScheduleTarget] = useState<ApplicationStage | null>(
    null,
  );

  const [countsTick, setCountsTick] = useState(0);
  const [applicationRole, setApplicationRole] = useState(() =>
    restored?.filters.jobFilter && restored.filters.jobFilter !== "all"
      ? restored.filters.jobFilter
      : "",
  );
  const [applicationStatus, setApplicationStatus] = useState(() =>
    restored?.filters.statusFilter && restored.filters.statusFilter !== "all"
      ? restored.filters.statusFilter
      : "",
  );

  useEffect(() => {
    return () => scheduleClearCareersApplicationsReturnCache();
  }, []);

  function goToTab(next: Tab) {
    setApplicationsRestore(null);
    setTab(next);
  }

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
    <div className="staff-container py-8">
      <StaffBanner
        title="Careers"
        footer={
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="rounded-xl bg-amal-white px-4 py-2 text-sm font-semibold text-amal-ink hover:bg-amal-sheet"
              onClick={() => {
                setEditingRole(null);
                setModal("role");
              }}
            >
              Create Role
            </button>
            <button
              type="button"
              className="rounded-xl border border-amal-white/40 bg-amal-white/10 px-4 py-2 text-sm font-semibold hover:bg-amal-white/20"
              onClick={() => setModal("application")}
            >
              Create Job Application
            </button>
            <button
              type="button"
              className="rounded-xl border border-amal-white/40 bg-amal-white/10 px-4 py-2 text-sm font-semibold hover:bg-amal-white/20"
              onClick={() => {
                setIdealRole(null);
                setIdealStandalone(true);
              }}
            >
              Create Ideal Profile
            </button>
          </div>
        }
      >
        Roles, applications, stage assignments, and interviews.
      </StaffBanner>

      {notice ? (
        <p className="mt-4 rounded-lg border border-amal-red/30 bg-amal-white px-3 py-2 text-sm text-amal-red">
          {notice}
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        {(
          [
            {
              label: "Roles",
              value: roleCount,
              tone: "bg-amal-sheet text-amal-ink hover:bg-zinc-200/70",
              icon: BriefcaseIcon,
              onClick: () => goToTab("roles"),
            },
            {
              label: "Unique Applicants",
              value: applicantCount,
              tone: "bg-amal-red/10 text-amal-red hover:bg-amal-red/20",
              icon: UserIcon,
              onClick: () => goToTab("applicants"),
            },
            {
              label: "Total Applications",
              value: appCount,
              tone: "bg-amal-ink/5 text-amal-ink hover:bg-amal-ink/10",
              icon: UsersIcon,
              onClick: () => {
                setApplicationsRestore(null);
                setApplicationRole("");
                setTab("applications");
              },
            },
          ] as const
        ).map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={card.onClick}
            onMouseDown={preventFocusScroll}
            className={`rounded-xl border border-black/10 p-4 text-left transition ${card.tone}`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-90">
                {card.label}
              </p>
              <card.icon className="h-4 w-4" />
            </div>
            <p className="mt-1 text-2xl font-bold">{card.value}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-black/10 bg-amal-white p-2 shadow-sm sm:p-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {TABS.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onMouseDown={preventFocusScroll}
                onClick={() => goToTab(item.id)}
                className={`flex min-h-[4.25rem] min-w-0 flex-col justify-start rounded-lg px-3 py-3 text-left transition-colors sm:min-h-[4.5rem] ${
                  active
                    ? "bg-amal-red text-amal-white shadow-sm"
                    : "bg-amal-sheet text-zinc-600 hover:bg-black/5"
                }`}
              >
                <div className="flex items-start gap-2 text-xs font-semibold sm:items-center sm:text-sm">
                  <item.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 sm:mt-0" />
                  <span className="min-w-0 leading-snug">{item.label}</span>
                </div>
                <p
                  className={`mt-2 text-[11px] leading-relaxed sm:text-xs ${
                    active ? "text-amal-white/80" : "invisible"
                  }`}
                >
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-anchor-none mt-6 rounded-2xl border border-black/10 bg-amal-white p-4 shadow-sm md:p-6">
          {tab === "roles" ? (
            <RolesTab
              key={countsTick}
              onError={onError}
              onEdit={(row) => {
                setEditingRole(row);
                setModal("role");
              }}
              onIdeal={(row) => {
                setIdealStandalone(false);
                setIdealRole(row);
              }}
              onViewApplications={(slug, status) => {
                setApplicationsRestore(null);
                setApplicationRole(slug);
                setApplicationStatus(status ?? "");
                setTab("applications");
              }}
            />
          ) : null}
          {tab === "applicants" ? (
            <ApplicantsTab
              onError={onError}
              onViewApplications={(slug) => {
                setApplicationsRestore(null);
                setApplicationRole(slug);
                setApplicationStatus("");
                setTab("applications");
              }}
            />
          ) : null}
          {tab === "applications" ? (
            <ApplicationsTab
              key={
                applicationsRestore
                  ? `restore:${applicationsRestore.page}:${applicationsRestore.pageSize}`
                  : `${applicationRole}:${applicationStatus}`
              }
              jobOpening={applicationRole}
              status={applicationStatus}
              initialFilters={applicationsRestore?.filters}
              initialPage={applicationsRestore?.page}
              initialPageSize={applicationsRestore?.pageSize}
              onJobOpeningChange={setApplicationRole}
              onStatusChange={setApplicationStatus}
              refreshTick={countsTick}
              onError={onError}
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

      {modal === "role" ? (
        <CreateRoleModal
          key={editingRole?.slug ?? "create"}
          opening={editingRole}
          onClose={() => {
            setModal(null);
            setEditingRole(null);
          }}
          onSaved={() => {
            setModal(null);
            setEditingRole(null);
            setCountsTick((value) => value + 1);
          }}
          onError={onError}
        />
      ) : null}
      {idealStandalone || idealRole ? (
        <IdealProfileModal
          key={idealRole?.slug ?? (idealStandalone ? "template" : "closed")}
          role={idealRole}
          onClose={() => {
            setIdealStandalone(false);
            setIdealRole(null);
          }}
          onSaved={() => {
            setIdealStandalone(false);
            setIdealRole(null);
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
            setApplicationsRestore(null);
            setTab("applications");
            setCountsTick((value) => value + 1);
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

function RolesTab({
  onError,
  onEdit,
  onIdeal,
  onViewApplications,
}: {
  onError: (value: string) => void;
  onEdit: (row: StaffJobOpening) => void;
  onIdeal: (row: StaffJobOpening) => void;
  onViewApplications: (slug: string, status?: JobApplicationStatus) => void;
}) {
  const [page, setPage] = useState(1);
  const [tick, setTick] = useState(0);
  const [rows, setRows] = useState<StaffJobOpening[]>([]);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<RoleStatus>("all");
  const [department, setDepartment] = useState("all");
  const [sort, setSort] = useState<"new-to-old" | "old-to-new">("new-to-old");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedRole, setSelectedRole] = useState<StaffJobOpening | null>(
    null,
  );

  useEffect(() => {
    void getOrgDepartments()
      .then(setDepartments)
      .catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    let ignore = false;
    getStaffJobOpenings({
      page,
      page_size: 10,
      search: search.trim() || undefined,
      department: department === "all" ? undefined : department,
      status,
    })
      .then((data) => {
        if (!ignore) {
          setRows(data.results ?? []);
          setCount(data.count ?? 0);
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
  }, [page, tick, search, status, department, onError]);

  const sorted = useMemo(() => {
    if (sort === "old-to-new") {
      return [...rows].reverse();
    }
    return rows;
  }, [rows, sort]);

  async function toggle(row: StaffJobOpening) {
    try {
      const updated = await patchJobOpening(row.slug, {
        is_active: !row.is_active,
      });
      setTick((value) => value + 1);
      setSelectedRole((current) =>
        current?.slug === row.slug ? { ...current, ...updated } : current,
      );
    } catch (error) {
      onError(errorText(error));
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Roles</h2>
        <p className="text-sm text-zinc-500">
          Manage active and closed hiring roles.
        </p>
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          className={`${inputClass} flex-1`}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search roles, location, department, or skill"
        />
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { key: "all", label: "All" },
              { key: "active", label: "Active" },
              { key: "closed", label: "Closed" },
              { key: "draft", label: "Draft" },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setStatus(item.key);
                setPage(1);
              }}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                status === item.key
                  ? "border-amal-ink bg-amal-ink text-amal-white"
                  : "border-black/15 bg-amal-white text-zinc-600"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Department
          <select
            className="rounded-lg border border-black/15 px-3 py-1.5 text-sm font-normal text-amal-ink"
            value={department}
            onChange={(event) => {
              setDepartment(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Departments</option>
            {departments.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Sort
          <select
            className="rounded-lg border border-black/15 px-3 py-1.5 text-sm font-normal text-amal-ink"
            value={sort}
            onChange={(event) =>
              setSort(event.target.value as "new-to-old" | "old-to-new")
            }
          >
            <option value="new-to-old">Newest First</option>
            <option value="old-to-new">Oldest First</option>
          </select>
        </label>
      </div>
      <div className="max-h-[640px] overflow-y-auto">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {sorted.length === 0 ? (
            <p className="rounded-xl border border-dashed border-black/15 bg-amal-sheet px-4 py-6 text-center text-sm text-zinc-500 lg:col-span-2">
              No roles found. Try adjusting filters or create a new role.
            </p>
          ) : (
            sorted.map((row) => (
              <div
                key={row.id}
                className="relative w-full rounded-2xl border border-black/10 bg-amal-white shadow-sm transition hover:border-black/25 hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => setSelectedRole(row)}
                  className="absolute inset-0 z-0 rounded-2xl"
                  aria-label={`View role ${row.title}`}
                />
                <div className="pointer-events-none relative z-10 p-4 text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold">{row.title}</h3>
                      <p className="mt-1 text-sm text-zinc-500">
                        {row.department_name} • {row.location}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        row.is_draft
                          ? "bg-zinc-100 text-zinc-700"
                          : row.is_active
                            ? "bg-amal-red/10 text-amal-red"
                            : "bg-amal-sheet text-zinc-600"
                      }`}
                    >
                      {row.is_draft
                        ? "Draft"
                        : row.is_active
                          ? "Active"
                          : "Closed"}
                    </span>
                  </div>
                  {row.description ? (
                    <p className="mt-2 text-sm text-zinc-600">
                      {compactText(row.description, 160)}
                    </p>
                  ) : null}
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-black/10 bg-amal-sheet p-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                        Work Type
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {WORK_TYPE_LABEL[row.work_type] ?? row.work_type}
                      </p>
                    </div>
                    <div className="rounded-lg border border-black/10 bg-amal-sheet p-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                        Employment
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {EMPLOYMENT_LABEL[row.employment_type] ??
                          row.employment_type}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onViewApplications(row.slug)}
                      className="pointer-events-auto relative z-10 rounded-lg border border-amal-red/20 bg-amal-red/10 p-2 text-left hover:bg-amal-red/15"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-amal-red">
                        Applications
                      </p>
                      <p className="mt-1 text-sm font-semibold text-amal-red">
                        {row.application_count ?? 0}
                      </p>
                    </button>
                  </div>
                  {row.skills.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {row.skills.slice(0, 4).map((skill) => (
                        <span
                          key={skill.id}
                          className="rounded-full bg-amal-sheet px-2 py-1 text-xs font-medium text-zinc-600"
                        >
                          {skill.name}
                        </span>
                      ))}
                      {row.skills.length > 4 ? (
                        <span className="rounded-full bg-amal-sheet px-2 py-1 text-xs font-medium text-zinc-600">
                          +{row.skills.length - 4}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <div className="pointer-events-auto relative z-10 flex flex-wrap items-center gap-2 px-4 pb-4">
                  <button
                    type="button"
                    onClick={() => onIdeal(row)}
                    className="rounded-lg border border-amal-red/30 bg-amal-red/10 px-3 py-1.5 text-xs font-semibold text-amal-red hover:bg-amal-red/15"
                  >
                    Ideal Profile
                  </button>
                  {row.is_draft || !row.is_active ? (
                    <button
                      type="button"
                      onClick={() => onEdit(row)}
                      className="rounded-lg border border-black/15 bg-amal-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-amal-sheet"
                    >
                      Edit
                    </button>
                  ) : null}
                  {!row.is_draft ? (
                    <button
                      type="button"
                      onClick={() => void toggle(row)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-amal-white ${
                        row.is_active ? "bg-amal-red" : "bg-amal-ink"
                      }`}
                    >
                      {row.is_active ? "Close role" : "Open role"}
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <TablePager page={page} pageSize={10} count={count} onPage={setPage} />
      {selectedRole ? (
        <RoleDetailModal
          key={selectedRole.slug}
          role={selectedRole}
          onClose={() => setSelectedRole(null)}
          onIdeal={() => onIdeal(selectedRole)}
          onEdit={() => {
            setSelectedRole(null);
            onEdit(selectedRole);
          }}
          onToggle={() => void toggle(selectedRole)}
          onViewApplications={(status) => {
            setSelectedRole(null);
            onViewApplications(selectedRole.slug, status);
          }}
        />
      ) : null}
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
