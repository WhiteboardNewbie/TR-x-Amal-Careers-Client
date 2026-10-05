"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  createAuthUser,
  createClient,
  createClientUser,
  createEmployee,
  createOrgDepartment,
  createOrgLevel,
  createOrgTitle,
  getClientUsers,
  getClients,
  getEmployees,
  getOrgDepartments,
  getOrgLevels,
  getOrgTitles,
} from "@/lib/staff-api";
import type {
  Department,
  Employee,
  OrgClient,
  OrgClientUser,
  OrgLevel,
  OrgTitle,
} from "@/lib/types";
import { Field, PrimaryButton, inputClass } from "./ui";

type Tab = "departments" | "levels" | "titles" | "clients" | "reviewers";

const TABS: { id: Tab; label: string }[] = [
  { id: "departments", label: "Departments" },
  { id: "levels", label: "Levels" },
  { id: "titles", label: "Titles" },
  { id: "clients", label: "Clients" },
  { id: "reviewers", label: "Reviewers" },
];

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

export function OrganizationScreen() {
  const [tab, setTab] = useState<Tab>("departments");
  const [notice, setNotice] = useState("");
  const onError = useCallback((value: string) => setNotice(value), []);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Organizational Configuration
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600">
        Departments, levels, titles, clients, and reviewers for hiring.
      </p>
      {notice ? (
        <p className="mt-4 rounded-lg border border-amal-red/30 bg-amal-white px-3 py-2 text-sm text-amal-red">
          {notice}
        </p>
      ) : null}
      <div className="mt-6 rounded-2xl border border-black/10 bg-amal-white p-4 md:p-6">
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
        {tab === "departments" ? <DepartmentsTab onError={onError} /> : null}
        {tab === "levels" ? <LevelsTab onError={onError} /> : null}
        {tab === "titles" ? <TitlesTab onError={onError} /> : null}
        {tab === "clients" ? <ClientsTab onError={onError} /> : null}
        {tab === "reviewers" ? <ReviewersTab onError={onError} /> : null}
      </div>
    </div>
  );
}

function DepartmentsTab({ onError }: { onError: (value: string) => void }) {
  const [rows, setRows] = useState<Department[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let ignore = false;
    getOrgDepartments()
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

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await createOrgDepartment(name);
      setName("");
      setTick((value) => value + 1);
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form className="mb-4 flex flex-wrap gap-2" onSubmit={onSubmit}>
        <input
          className={`${inputClass} max-w-sm`}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Department name"
          required
        />
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? "Saving…" : "Add department"}
        </PrimaryButton>
      </form>
      <SimpleTable
        headers={["Name"]}
        rows={rows.map((row) => [row.name])}
        empty="No departments yet."
      />
    </div>
  );
}

function LevelsTab({ onError }: { onError: (value: string) => void }) {
  const [rows, setRows] = useState<OrgLevel[]>([]);
  const [code, setCode] = useState("");
  const [order, setOrder] = useState("1");
  const [timeline, setTimeline] = useState("");
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let ignore = false;
    getOrgLevels()
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

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await createOrgLevel({
        code,
        order: Number(order),
        promotion_timeline: timeline,
      });
      setCode("");
      setTimeline("");
      setTick((value) => value + 1);
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form className="mb-4 grid gap-2 md:grid-cols-4" onSubmit={onSubmit}>
        <input
          className={inputClass}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Code (L2)"
          required
        />
        <input
          className={inputClass}
          type="number"
          min={0}
          value={order}
          onChange={(event) => setOrder(event.target.value)}
          placeholder="Order"
          required
        />
        <input
          className={inputClass}
          value={timeline}
          onChange={(event) => setTimeline(event.target.value)}
          placeholder="Promotion timeline"
        />
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? "Saving…" : "Add level"}
        </PrimaryButton>
      </form>
      <SimpleTable
        headers={["Code", "Order", "Timeline"]}
        rows={rows.map((row) => [
          row.code,
          String(row.order),
          row.promotion_timeline || "—",
        ])}
        empty="No levels yet."
      />
    </div>
  );
}

function TitlesTab({ onError }: { onError: (value: string) => void }) {
  const [rows, setRows] = useState<OrgTitle[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [levels, setLevels] = useState<OrgLevel[]>([]);
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let ignore = false;
    Promise.all([getOrgTitles(), getOrgDepartments(), getOrgLevels()])
      .then(([titles, depts, lvls]) => {
        if (!ignore) {
          setRows(titles);
          setDepartments(depts);
          setLevels(lvls);
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

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await createOrgTitle({
        name,
        level: Number(level),
        department: Number(department),
      });
      setName("");
      setTick((value) => value + 1);
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form className="mb-4 grid gap-2 md:grid-cols-4" onSubmit={onSubmit}>
        <input
          className={inputClass}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Title name"
          required
        />
        <select
          className={inputClass}
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
          required
        >
          <option value="">Department</option>
          {departments.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
        <select
          className={inputClass}
          value={level}
          onChange={(event) => setLevel(event.target.value)}
          required
        >
          <option value="">Level</option>
          {levels.map((row) => (
            <option key={row.id} value={row.id}>
              {row.code}
            </option>
          ))}
        </select>
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? "Saving…" : "Add title"}
        </PrimaryButton>
      </form>
      <SimpleTable
        headers={["Title", "Department", "Level"]}
        rows={rows.map((row) => [
          row.name,
          row.department.name,
          row.level.code,
        ])}
        empty="No titles yet."
      />
    </div>
  );
}

function ClientsTab({ onError }: { onError: (value: string) => void }) {
  const [clients, setClients] = useState<OrgClient[]>([]);
  const [users, setUsers] = useState<OrgClientUser[]>([]);
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let ignore = false;
    Promise.all([getClients(), getClientUsers()])
      .then(([clientRows, userRows]) => {
        if (!ignore) {
          setClients(clientRows);
          setUsers(userRows);
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

  const names = Object.fromEntries(clients.map((row) => [row.id, row.name]));

  async function addClient(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await createClient(name);
      setName("");
      setTick((value) => value + 1);
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  async function addUser(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await createClientUser({
        client: Number(clientId),
        first_name: firstName,
        last_name: lastName,
        email,
      });
      setFirstName("");
      setLastName("");
      setEmail("");
      setTick((value) => value + 1);
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-3 text-sm font-bold">Clients</h2>
        <form className="mb-4 flex flex-wrap gap-2" onSubmit={addClient}>
          <input
            className={`${inputClass} max-w-sm`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Client name"
            required
          />
          <PrimaryButton type="submit" disabled={busy}>
            {busy ? "Saving…" : "Add client"}
          </PrimaryButton>
        </form>
        <SimpleTable
          headers={["Name"]}
          rows={clients.map((row) => [row.name])}
          empty="No clients yet."
        />
      </div>
      <div>
        <h2 className="mb-3 text-sm font-bold">Client users</h2>
        <form className="mb-4 grid gap-2 md:grid-cols-5" onSubmit={addUser}>
          <select
            className={inputClass}
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
            required
          >
            <option value="">Client</option>
            {clients.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
          <input
            className={inputClass}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="First name"
            required
          />
          <input
            className={inputClass}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            placeholder="Last name"
          />
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            required
          />
          <PrimaryButton type="submit" disabled={busy}>
            {busy ? "Saving…" : "Add client user"}
          </PrimaryButton>
        </form>
        <SimpleTable
          headers={["Name", "Email", "Client"]}
          rows={users.map((row) => [
            `${row.first_name} ${row.last_name}`.trim() || "—",
            row.email,
            names[row.client] ?? String(row.client),
          ])}
          empty="No client users yet."
        />
      </div>
    </div>
  );
}

function ReviewersTab({ onError }: { onError: (value: string) => void }) {
  const [rows, setRows] = useState<Employee[]>([]);
  const [titles, setTitles] = useState<OrgTitle[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [title, setTitle] = useState("");
  const [withLogin, setWithLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let ignore = false;
    Promise.all([getEmployees(), getOrgTitles()])
      .then(([people, titleRows]) => {
        if (!ignore) {
          setRows(people);
          setTitles(titleRows);
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

  const titleNames = Object.fromEntries(
    titles.map((row) => [row.id, `${row.name} · ${row.department.name}`]),
  );

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      let userId: number | null = null;
      if (withLogin) {
        const created = await createAuthUser({
          username,
          password,
          email,
          first_name: firstName,
          last_name: lastName,
        });
        userId = created.id;
      }
      await createEmployee({
        first_name: firstName,
        last_name: lastName,
        title: title ? Number(title) : null,
        user: userId,
      });
      setFirstName("");
      setLastName("");
      setUsername("");
      setPassword("");
      setEmail("");
      setTick((value) => value + 1);
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form className="mb-6 space-y-3" onSubmit={onSubmit}>
        <div className="grid gap-2 md:grid-cols-3">
          <Field label="First name">
            <input
              className={inputClass}
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
            />
          </Field>
          <Field label="Last name">
            <input
              className={inputClass}
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
            />
          </Field>
          <Field label="Title">
            <select
              className={inputClass}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            >
              <option value="">None</option>
              {titles.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name} · {row.department.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={withLogin}
            onChange={(event) => setWithLogin(event.target.checked)}
          />
          Create a login (Manager, lands on Reviews)
        </label>
        {withLogin ? (
          <div className="grid gap-2 md:grid-cols-3">
            <Field label="Username">
              <input
                className={inputClass}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </Field>
            <Field label="Password">
              <input
                className={inputClass}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </Field>
            <Field label="Email">
              <input
                className={inputClass}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
          </div>
        ) : null}
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? "Saving…" : "Add reviewer"}
        </PrimaryButton>
      </form>
      <SimpleTable
        headers={["Name", "Email", "Title"]}
        rows={rows.map((row) => [
          row.full_name,
          row.email || "—",
          row.title ? (titleNames[row.title] ?? String(row.title)) : "—",
        ])}
        empty="No reviewers yet."
      />
    </div>
  );
}

function SimpleTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: string[][];
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-zinc-500">{empty}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-zinc-500">
            {headers.map((header) => (
              <th key={header} className="py-2">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row[0]}-${index}`} className="border-t border-black/5">
              {row.map((cell, cellIndex) => (
                <td
                  key={`${cell}-${cellIndex}`}
                  className={cellIndex === 0 ? "py-3 font-semibold" : ""}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
