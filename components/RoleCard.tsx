import Link from "next/link";

import {
  formatExperience,
  formatPositions,
  formatTypeLabel,
} from "@/lib/format";
import type { JobOpening } from "@/lib/types";

import "./career-card.css";

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="7"
        width="18"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8v4l2.5 2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function RoleCard({ role }: { role: JobOpening }) {
  const departmentName = role.department_name || "General";
  const employmentType = formatTypeLabel(role.employment_type) || "Full-time";
  const workType = formatTypeLabel(role.work_type);
  const location = role.location || "Location TBD";
  const experience = formatExperience(role.experience_level);
  const typeChip =
    workType && workType.toLowerCase() !== employmentType.toLowerCase()
      ? workType
      : null;

  return (
    <Link
      href={`/roles/${role.slug}`}
      className="career-card"
      aria-label={`View details for ${role.title || "job opening"}`}
    >
      <div className="career-card__top">
        <span className="career-card__badge" title={departmentName}>
          {departmentName}
        </span>
        <span className="career-card__positions">
          {formatPositions(role.positions)}
        </span>
      </div>
      <h3 className="career-card__title">{role.title || "Untitled role"}</h3>
      <div className="career-card__meta">
        <div className="career-card__meta-item">
          <span className="career-card__icon">
            <PinIcon />
          </span>
          <span title={location}>{location}</span>
        </div>
        <div className="career-card__meta-item">
          <span className="career-card__icon">
            <BriefcaseIcon />
          </span>
          <span title={employmentType}>{employmentType}</span>
        </div>
        <div className="career-card__meta-item">
          <span className="career-card__icon">
            <ClockIcon />
          </span>
          <span title={experience}>{experience}</span>
        </div>
      </div>
      <div className="career-card__footer">
        <span className="career-card__cta">
          View role
          <span className="career-card__cta-arrow" aria-hidden>
            →
          </span>
        </span>
        {typeChip ? <span className="career-card__chip">{typeChip}</span> : null}
      </div>
    </Link>
  );
}
