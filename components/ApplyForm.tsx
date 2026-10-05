"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { ApiError, createJobApplication, getJobOpening } from "@/lib/api";
import type { JobOpening } from "@/lib/types";

import { ClosedRole } from "./ClosedRole";
import { PageHero } from "./PageHero";

const LEGAL = "https://www.amalacademy.org/";

const fieldClass =
  "h-[52.5px] w-full rounded-[27px] border border-zinc-200 bg-amal-white px-5 text-base text-amal-ink placeholder:text-zinc-400 focus:border-amal-red focus:outline-none disabled:opacity-60";

const labelClass =
  "mb-[7px] block text-lg font-medium leading-[1.3] text-zinc-950";

function isPublished(role: JobOpening): boolean {
  return role.is_active === true && role.is_draft !== true;
}

export function ApplyForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [role, setRole] = useState<JobOpening | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [closed, setClosed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const resume = data.get("resume");
    if (!(resume instanceof File) || resume.size === 0) {
      setError("This field is required.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await createJobApplication({
        job_opening: slug,
        applicant_name: String(data.get("applicant_name") ?? ""),
        applicant_email: String(data.get("applicant_email") ?? ""),
        applicant_city: String(data.get("applicant_city") ?? ""),
        applicant_contact: String(data.get("applicant_contact") ?? ""),
        resume,
      });
      router.push(`/roles/${slug}/applied`);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Failed to submit application.",
      );
      setSubmitting(false);
    }
  }

  if (!loaded) {
    return (
      <p className="py-[var(--section-y)] text-center text-[clamp(1.2rem,calc(1.152rem+0.33vw),1.4375rem)] text-zinc-500">
        Loading application form…
      </p>
    );
  }

  if (closed || !role) {
    return <ClosedRole />;
  }

  return (
    <>
      <PageHero
        title={role.title || "Apply for Job"}
        subtitle="Submit your application and take the next step in your career."
      />
      <section className="py-[var(--section-y)]">
        <div className="page-container">
          <div className="page-article">
          <form className="space-y-[1.3125rem]" onSubmit={handleSubmit}>
            <div>
              <label className={labelClass} htmlFor="resume">
                Resume
              </label>
              <input
                required
                aria-required
                className="apply-file"
                disabled={submitting}
                id="resume"
                name="resume"
                type="file"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="applicant_name">
                Name
              </label>
              <input
                required
                aria-required
                className={fieldClass}
                disabled={submitting}
                id="applicant_name"
                name="applicant_name"
                placeholder="Name"
                type="text"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="applicant_email">
                Email
              </label>
              <input
                required
                aria-required
                className={fieldClass}
                disabled={submitting}
                id="applicant_email"
                name="applicant_email"
                placeholder="Email"
                type="email"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="applicant_city">
                City
              </label>
              <input
                required
                aria-required
                className={fieldClass}
                disabled={submitting}
                id="applicant_city"
                name="applicant_city"
                placeholder="City"
                type="text"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="applicant_contact">
                Contact
              </label>
              <input
                required
                aria-required
                className={fieldClass}
                disabled={submitting}
                id="applicant_contact"
                name="applicant_contact"
                placeholder="Contact"
                type="text"
              />
            </div>
            {error ? (
              <p className="text-amal-red" role="alert">
                {error}
              </p>
            ) : null}
            <button
              className="mt-12 inline-flex w-full items-center justify-center rounded-full bg-amal-red px-8 py-3 text-[1.125rem] font-semibold tracking-[0.05em] text-amal-white hover:opacity-90 disabled:opacity-60"
              disabled={submitting}
              type="submit"
            >
              {submitting ? "Submitting…" : "Submit Application"}
            </button>
            <p className="pt-[1.875rem] text-sm text-zinc-500">
              All fields are required. By sending this form, you agree to the{" "}
              <a className="text-zinc-950 underline" href={LEGAL}>
                Terms &amp; Conditions
              </a>{" "}
              and{" "}
              <a className="text-zinc-950 underline" href={LEGAL}>
                Privacy Policy
              </a>
              .
            </p>
          </form>
          </div>
        </div>
      </section>
    </>
  );
}
