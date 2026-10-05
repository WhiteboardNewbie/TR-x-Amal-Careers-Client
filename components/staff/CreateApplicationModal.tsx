"use client";

import { useEffect, useState } from "react";
import { ApiError, createJobApplication } from "@/lib/api";
import {
  formatPhoneDisplay,
  getPhoneSubmitError,
  isBlankPhone,
  preparePhoneForSubmit,
} from "@/lib/phone-format";
import { getApplicants, getStaffJobOpenings } from "@/lib/staff-api";
import type { ApplicantRow, StaffJobOpening } from "@/lib/types";
import { PhoneField } from "./PhoneField";
import { GhostButton, PrimaryButton } from "./ui";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

const labelClass =
  "text-xs font-semibold uppercase tracking-wide text-zinc-500";
const fieldClass =
  "mt-1 w-full rounded-lg border border-black/15 bg-amal-white px-3 py-2 text-sm outline-none focus:border-amal-red focus:ring-2 focus:ring-amal-red/20 disabled:bg-amal-sheet disabled:text-zinc-500";

export function CreateApplicationModal({
  onClose,
  onSaved,
  onError,
}: {
  onClose: () => void;
  onSaved: () => void;
  onError: (value: string) => void;
}) {
  const [roles, setRoles] = useState<StaffJobOpening[]>([]);
  const [applicants, setApplicants] = useState<ApplicantRow[]>([]);
  const [slug, setSlug] = useState("");
  const [applicantId, setApplicantId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [contact, setContact] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [notes, setNotes] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const existing = Boolean(applicantId);

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
    void getStaffJobOpenings({ page: 1, page_size: 150, is_active: true })
      .then((page) => setRoles(page.results.filter((row) => !row.is_draft)))
      .catch(() => setRoles([]));
    void getApplicants({ page: 1, page_size: 150 })
      .then((page) => setApplicants(page.results ?? []))
      .catch(() => setApplicants([]));
  }, []);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!slug) {
      next.jobOpeningSlug = "Select a role.";
    }
    if (!existing) {
      const hasNew = Boolean(
        name.trim() &&
          email.trim() &&
          city.trim() &&
          !isBlankPhone(contact),
      );
      if (!hasNew) {
        next.applicant =
          "Either select an existing applicant or fill in name, email, city, and contact.";
      }
      if (!name.trim()) {
        next.applicantName = "Name is required.";
      }
      if (!email.trim()) {
        next.applicantEmail = "Email is required.";
      } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
        next.applicantEmail = "Enter a valid email.";
      }
      if (!city.trim()) {
        next.applicantCity = "City is required.";
      }
      const contactError = getPhoneSubmitError(contact, { required: true });
      if (contactError) {
        next.applicantContact = contactError;
      }
    }
    if (!resume) {
      next.resume = "Resume file is required.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) {
      return;
    }
    if (!resume) {
      return;
    }
    let applicantName = name.trim();
    let applicantEmail = email.trim();
    let applicantCity = city.trim();
    let applicantContact =
      preparePhoneForSubmit(contact) ?? contact.trim();
    if (applicantId) {
      const picked = applicants.find((row) => String(row.id) === applicantId);
      if (!picked) {
        onError("Selected applicant not found.");
        return;
      }
      applicantName = picked.name;
      applicantEmail = picked.email;
      applicantCity = picked.city.trim() || "—";
      applicantContact = picked.contact.trim() || "—";
    }
    setBusy(true);
    try {
      await createJobApplication({
        job_opening: slug,
        applicant_name: applicantName,
        applicant_email: applicantEmail,
        applicant_city: applicantCity,
        applicant_contact: applicantContact,
        resume,
        cover_letter: coverLetter,
        notes,
      });
      onSaved();
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-amal-ink/45 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-black/10 bg-amal-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-application-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-black/5 p-5">
          <div>
            <h2 id="create-application-title" className="text-xl font-bold">
              Create Job Application
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Add candidate details and submit to the hiring pipeline.
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
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={onSubmit}
          noValidate
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            <div>
              <label htmlFor="application-form-role" className={labelClass}>
                Role
              </label>
              <select
                id="application-form-role"
                className={fieldClass}
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
              >
                <option value="">Select Role</option>
                {roles.map((row) => (
                  <option key={row.id} value={row.slug}>
                    {row.title}
                  </option>
                ))}
              </select>
              {errors.jobOpeningSlug ? (
                <p className="mt-1 text-xs text-amal-red">
                  {errors.jobOpeningSlug}
                </p>
              ) : null}
            </div>

            <p className="text-xs text-zinc-500">
              Select an existing applicant or enter new candidate details below.
            </p>

            <div>
              <label htmlFor="application-form-applicant" className={labelClass}>
                Existing applicant (optional)
              </label>
              <select
                id="application-form-applicant"
                className={fieldClass}
                value={applicantId}
                onChange={(event) => {
                  const nextId = event.target.value;
                  setApplicantId(nextId);
                  const picked = applicants.find(
                    (row) => String(row.id) === nextId,
                  );
                  setName(picked?.name ?? "");
                  setEmail(picked?.email ?? "");
                  setCity(picked?.city ?? "");
                  setContact(picked?.contact ?? "");
                }}
              >
                <option value="">Select Applicant...</option>
                {applicants.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name} ({row.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="application-form-name" className={labelClass}>
                  Candidate name
                </label>
                <input
                  id="application-form-name"
                  className={fieldClass}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={existing}
                  placeholder="Full name"
                />
                {errors.applicantName ? (
                  <p className="mt-1 text-xs text-amal-red">
                    {errors.applicantName}
                  </p>
                ) : null}
              </div>
              <div>
                <label htmlFor="application-form-email" className={labelClass}>
                  Email
                </label>
                <input
                  id="application-form-email"
                  className={fieldClass}
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={existing}
                  placeholder="email@example.com"
                />
                {errors.applicantEmail ? (
                  <p className="mt-1 text-xs text-amal-red">
                    {errors.applicantEmail}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="application-form-city" className={labelClass}>
                  City
                </label>
                <input
                  id="application-form-city"
                  className={fieldClass}
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  disabled={existing}
                  placeholder="City"
                />
                {errors.applicantCity ? (
                  <p className="mt-1 text-xs text-amal-red">
                    {errors.applicantCity}
                  </p>
                ) : null}
              </div>
              <div>
                <label htmlFor="application-form-contact" className={labelClass}>
                  Contact
                </label>
                {existing ? (
                  <input
                    id="application-form-contact"
                    className={fieldClass}
                    value={formatPhoneDisplay(contact)}
                    disabled
                    readOnly
                  />
                ) : (
                  <div className="mt-1">
                    <PhoneField
                      id="application-form-contact"
                      value={contact}
                      onChange={setContact}
                    />
                  </div>
                )}
                {errors.applicantContact ? (
                  <p className="mt-1 text-xs text-amal-red">
                    {errors.applicantContact}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <label htmlFor="application-form-resume" className={labelClass}>
                Resume (required)
              </label>
              <input
                id="application-form-resume"
                className={fieldClass}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(event) =>
                  setResume(event.target.files?.[0] ?? null)
                }
              />
              {resume ? (
                <p className="mt-1 text-xs text-zinc-500">
                  Selected: {resume.name}
                </p>
              ) : null}
              {errors.resume ? (
                <p className="mt-1 text-xs text-amal-red">{errors.resume}</p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="application-form-cover-letter"
                className={labelClass}
              >
                Cover letter (optional)
              </label>
              <textarea
                id="application-form-cover-letter"
                rows={2}
                className={`${fieldClass} resize-none`}
                value={coverLetter}
                onChange={(event) => setCoverLetter(event.target.value)}
              />
            </div>

            <div>
              <label htmlFor="application-form-notes" className={labelClass}>
                Notes (optional)
              </label>
              <textarea
                id="application-form-notes"
                rows={2}
                className={`${fieldClass} resize-none`}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>

            {errors.applicant ? (
              <p className="text-xs text-amal-red">{errors.applicant}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 justify-end gap-2 border-t border-black/5 p-5">
            <GhostButton type="button" onClick={onClose} disabled={busy}>
              Cancel
            </GhostButton>
            <PrimaryButton type="submit" disabled={busy}>
              {busy ? "Submitting..." : "Submit Application"}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
