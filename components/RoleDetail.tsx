"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getJobOpening } from "@/lib/api";
import {
  formatExperience,
  formatTypeLabel,
} from "@/lib/format";
import type { JobOpening } from "@/lib/types";

import { ClosedRole } from "./ClosedRole";
import { PageHero } from "./PageHero";

function isPublished(role: JobOpening): boolean {
  return role.is_active === true && role.is_draft !== true;
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-x-[1.875rem] gap-y-2 border-t border-black/10 py-5 sm:grid-cols-12">
      <dt className="font-semibold text-zinc-950 sm:col-span-4">{label}</dt>
      <dd className="text-zinc-500 sm:col-span-8">{children}</dd>
    </div>
  );
}

function Description({ text }: { text: string }) {
  if (/<[a-z][\s\S]*>/i.test(text)) {
    return (
      <div
        className="[&_a]:text-amal-red [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  }
  return <div className="whitespace-pre-wrap">{text}</div>;
}

export function RoleDetail({ slug }: { slug: string }) {
  const [role, setRole] = useState<JobOpening | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getJobOpening(slug)
      .then((opening) => {
        if (cancelled) {
          return;
        }
        if (!isPublished(opening)) {
          setClosed(true);
          setRole(null);
          return;
        }
        setRole(opening);
      })
      .catch(() => {
        if (!cancelled) {
          setClosed(true);
          setRole(null);
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
  }, [slug]);

  if (!loaded) {
    return (
      <p className="py-[var(--section-y)] text-center text-[clamp(1.2rem,calc(1.152rem+0.33vw),1.4375rem)] text-zinc-500">
        Loading job details…
      </p>
    );
  }

  if (closed || !role) {
    return <ClosedRole />;
  }

  const department = role.department_name || "General";
  const skills =
    role.skills?.length > 0
      ? role.skills.map((skill) => skill.name).join(", ")
      : "No skills";

  return (
    <>
      <PageHero
        title={role.title || "Untitled role"}
        subtitle={`Join our innovative ${department} team today!`}
      />
      <section className="py-[var(--section-y)]">
        <div className="page-container">
          <div className="page-article">
          <div className="mb-[3.75rem] flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-[clamp(1.5rem,calc(1.136rem+1.82vw),2.5rem)] font-medium leading-[1.2] tracking-[-0.03em]">
              Job Details
            </h2>
            <Link
              href={`/roles/${role.slug}/apply`}
              className="inline-flex items-center rounded-full bg-amal-red px-8 py-3 text-[1.125rem] font-semibold tracking-[0.05em] text-amal-white hover:opacity-90"
            >
              Apply Now
            </Link>
          </div>
          <dl>
            <DetailRow label="Department">{department}</DetailRow>
            <DetailRow label="Location">
              {role.location || "Location TBD"}
            </DetailRow>
            <DetailRow label="Work Type">
              {formatTypeLabel(role.work_type) || "—"}
            </DetailRow>
            <DetailRow label="Employment Type">
              {formatTypeLabel(role.employment_type) || "Full-time"}
            </DetailRow>
            <DetailRow label="Job Description">
              <Description text={role.description || ""} />
            </DetailRow>
            <DetailRow label="Positions Available">
              {role.positions ?? "—"}
            </DetailRow>
            <DetailRow label="Experience Level">
              {formatExperience(role.experience_level)}
            </DetailRow>
            <DetailRow label="Qualifications">
              {role.qualifications || "—"}
            </DetailRow>
            <DetailRow label="Skills">{skills}</DetailRow>
            <DetailRow label="Status">Active</DetailRow>
          </dl>
          </div>
        </div>
      </section>
    </>
  );
}
