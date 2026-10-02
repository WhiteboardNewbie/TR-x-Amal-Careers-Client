"use client";

import { useEffect, useMemo, useState } from "react";

import { getJobOpenings } from "@/lib/api";
import type { JobOpening } from "@/lib/types";

import { Pagination } from "./Pagination";
import { RoleCard } from "./RoleCard";

const PAGE_SIZE = 9;

function isPublished(role: JobOpening): boolean {
  return role.is_active === true && role.is_draft !== true;
}

export function RoleList() {
  const [roles, setRoles] = useState<JobOpening[]>([]);
  const [currentDepartment, setCurrentDepartment] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getJobOpenings()
      .then((openings) => {
        if (!cancelled) {
          setRoles(openings.filter(isPublished));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRoles([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const postedDepartments = useMemo(() => {
    const names = new Set<string>();
    for (const role of roles) {
      const name = role.department_name.trim();
      if (name) {
        names.add(name);
      }
    }
    return [...names].sort((left, right) => left.localeCompare(right));
  }, [roles]);

  const filtered = useMemo(() => {
    if (currentDepartment === "All") {
      return roles;
    }
    return roles.filter(
      (role) =>
        role.department_name.toLowerCase() === currentDepartment.toLowerCase(),
    );
  }, [currentDepartment, roles]);

  const pageRoles = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  if (!loaded) {
    return (
      <p className="py-16 text-center text-[clamp(1.2rem,calc(1.152rem+0.33vw),1.4375rem)] text-zinc-500">
        Loading roles…
      </p>
    );
  }

  if (!roles.length) {
    return (
      <p className="py-16 text-center text-[clamp(1.2rem,calc(1.152rem+0.33vw),1.4375rem)] text-zinc-500">
        No job openings available at the moment.
      </p>
    );
  }

  return (
    <>
      <div className="mb-10 flex flex-wrap justify-center gap-3 md:mb-[3.75rem]">
        {["All", ...postedDepartments].map((name) => {
          const active = currentDepartment === name;
          return (
            <button
              key={name}
              type="button"
              onClick={() => {
                setCurrentDepartment(name);
                setCurrentPage(1);
              }}
              className={`rounded-full border px-[17px] py-[14px] text-[17px] ${
                active
                  ? "border-amal-red text-amal-red"
                  : "border-zinc-200 text-zinc-700 hover:border-zinc-400"
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>

      {pageRoles.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pageRoles.map((role) => (
            <RoleCard key={role.id ?? role.slug} role={role} />
          ))}
        </div>
      ) : (
        <p className="py-16 text-center text-[clamp(1.2rem,calc(1.152rem+0.33vw),1.4375rem)] text-zinc-500">
          No jobs found in the {currentDepartment} department.
        </p>
      )}

      <Pagination
        itemsPerPage={PAGE_SIZE}
        totalItems={filtered.length}
        activePage={currentPage}
        onPageChange={setCurrentPage}
      />
    </>
  );
}
