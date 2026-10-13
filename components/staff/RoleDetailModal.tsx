"use client";

import { useEffect, useState } from "react";
import { getJobOpening } from "@/lib/api";
import type {
  JobApplicationStatus,
  JobOpeningAnalytics,
  StaffJobOpening,
} from "@/lib/types";
import { BriefcaseIcon } from "./icons";
import {
  RoleDetailAnalyticsInsights,
  RoleDetailApplicationsCta,
} from "./RoleDetailAnalytics";
import { CenteredOverlay, ModalCloseButton } from "./ui";

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

function Description({ text }: { text: string }) {
  if (/<[a-z][\s\S]*>/i.test(text)) {
    return (
      <div
        className="text-sm leading-relaxed text-zinc-700 [&_a]:text-amal-red [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  }
  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
      {text || "—"}
    </p>
  );
}

export function RoleDetailModal({
  role,
  onClose,
  onIdeal,
  onEdit,
  onToggle,
  onViewApplications,
}: {
  role: StaffJobOpening;
  onClose: () => void;
  onIdeal: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onViewApplications: (status?: JobApplicationStatus) => void;
}) {
  const [analytics, setAnalytics] = useState<JobOpeningAnalytics | null>(
    role.analytics ?? null,
  );
  const [loading, setLoading] = useState(!role.analytics);

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
    getJobOpening(role.slug)
      .then((detail) => {
        if (!ignore) {
          setAnalytics(detail.analytics ?? null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setAnalytics(null);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [role.slug]);

  const requestedBy = (role.client_users ?? [])
    .map((user) =>
      [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
      user.email,
    )
    .filter(Boolean)
    .join(", ");

  return (
    <CenteredOverlay
      onClose={onClose}
      backdropClassName="bg-amal-black/60 backdrop-blur-sm"
    >
      <div
        className="pointer-events-auto flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-amal-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="role-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between rounded-t-2xl bg-gradient-to-r from-amal-staff-banner to-amal-red px-8 py-6 text-amal-white">
          <div className="flex items-center gap-3">
            <BriefcaseIcon className="h-6 w-6" />
            <div>
              <h2 id="role-detail-title" className="text-2xl font-bold">
                {role.title}
              </h2>
              <p className="mt-1 text-sm text-amal-white/80">
                {role.department_name} • {role.location}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onIdeal}
              className="rounded-lg border border-amal-white/80 bg-amal-white/10 px-3 py-1.5 text-sm font-semibold hover:bg-amal-white/20"
            >
              Ideal Profile
            </button>
            {role.is_draft || !role.is_active ? (
              <button
                type="button"
                onClick={onEdit}
                className="rounded-lg border border-amal-white/80 bg-amal-white/10 px-3 py-1.5 text-sm font-semibold hover:bg-amal-white/20"
              >
                Edit
              </button>
            ) : null}
            {!role.is_draft ? (
              <button
                type="button"
                onClick={onToggle}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold text-amal-white ${
                  role.is_active ? "bg-amal-ink hover:bg-black" : "bg-amal-white/20 hover:bg-amal-white/30"
                }`}
              >
                {role.is_active ? "Close role" : "Open role"}
              </button>
            ) : null}
            <ModalCloseButton tone="onDark" onClick={onClose} />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-6 px-8 py-6">
            <RoleDetailAnalyticsInsights
              analytics={analytics}
              loading={loading}
              applicationCount={role.application_count}
              onViewApplications={onViewApplications}
            />

            <div className="grid grid-cols-1 gap-4 border-t border-black/10 pt-6 sm:grid-cols-3">
              <div className="rounded-lg bg-amal-red/10 p-4">
                <p className="text-xs font-medium text-amal-red">Status</p>
                <p className="mt-2 text-lg font-bold">
                  {role.is_draft
                    ? "Draft"
                    : role.is_active
                      ? "✓ Active"
                      : "○ Closed"}
                </p>
              </div>
              <div className="rounded-lg bg-amal-sheet p-4">
                <p className="text-xs font-medium text-zinc-500">Work Type</p>
                <p className="mt-2 text-lg font-bold">
                  {WORK_TYPE_LABEL[role.work_type] ?? role.work_type}
                </p>
              </div>
              <div className="rounded-lg bg-amal-ink/5 p-4">
                <p className="text-xs font-medium text-zinc-500">Employment</p>
                <p className="mt-2 text-lg font-bold">
                  {EMPLOYMENT_LABEL[role.employment_type] ??
                    role.employment_type}
                </p>
              </div>
            </div>

            {requestedBy ? (
              <p className="text-sm text-zinc-500">
                Requested by: {requestedBy}
              </p>
            ) : null}

            <div className="border-t border-black/10 pt-6">
              <h3 className="mb-3 text-lg font-semibold">Job Description</h3>
              <Description text={role.description || ""} />
            </div>

            {role.qualifications?.trim() ? (
              <div className="border-t border-black/10 pt-6">
                <h3 className="mb-3 text-lg font-semibold">Qualifications</h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                  {role.qualifications}
                </p>
              </div>
            ) : null}

            {role.skills.length > 0 ? (
              <div className="border-t border-black/10 pt-6">
                <h3 className="mb-3 text-lg font-semibold">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {role.skills.map((skill) => (
                    <span
                      key={skill.id}
                      className="inline-flex rounded-full bg-amal-red/10 px-3 py-1 text-sm font-medium text-amal-red"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <RoleDetailApplicationsCta
              analytics={analytics}
              applicationCount={role.application_count}
              onViewApplications={() => onViewApplications()}
            />
          </div>
        </div>
      </div>
    </CenteredOverlay>
  );
}
