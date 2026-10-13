"use client";

import { CheckIcon, ClockIcon, MailIcon } from "@/components/staff/icons";
import {
  CAREERS_CONTACT,
  CAREERS_PATH,
  cardShell,
  shellGradient,
} from "./shared";

export function QuestionnaireThankYou() {
  return (
    <div className={shellGradient}>
      <div className={`${cardShell} text-center md:p-12`}>
        <div className="mx-auto mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
          <CheckIcon className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="mb-4 text-3xl font-bold text-amal-ink md:text-4xl">
          Assessment Completed Successfully!
        </h1>
        <p className="mb-8 text-xl text-zinc-700">
          Thank you for completing all parts of the assessment process.
        </p>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-amal-red/5 p-6">
            <div className="mb-3 flex items-center justify-center">
              <MailIcon className="h-8 w-8 text-amal-red" />
            </div>
            <h3 className="mb-2 font-semibold text-amal-ink">We&apos;ll Be In Touch</h3>
            <p className="text-sm text-zinc-600">
              The Amal Academy team will review your responses and reach out shortly
            </p>
          </div>
          <div className="rounded-lg bg-amal-blue/5 p-6">
            <div className="mb-3 flex items-center justify-center">
              <ClockIcon className="h-8 w-8 text-amal-blue" />
            </div>
            <h3 className="mb-2 font-semibold text-amal-ink">What&apos;s Next?</h3>
            <p className="text-sm text-zinc-600">
              Our team is reviewing your responses and will contact you soon
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-lg bg-amal-sheet p-6">
          <p className="leading-relaxed text-zinc-700">
            You have successfully completed all three parts of the assessment:
          </p>
          <ul className="mt-3 list-inside list-disc space-y-2 leading-relaxed text-zinc-700">
            <li>Initial Assessment Test</li>
            <li>Video Interview Test</li>
            <li>General Questionnaire</li>
          </ul>
          <p className="mt-4 leading-relaxed text-zinc-700">
            Our recruitment team has been notified and will review your
            responses. Please keep an eye on your email for updates regarding
            the next steps.
          </p>
        </div>

        <div className="border-t pt-6">
          <p className="text-sm text-zinc-500">
            Questions? Contact us at{" "}
            <a
              href={`mailto:${CAREERS_CONTACT}`}
              className="font-medium text-amal-red hover:text-amal-red/80"
            >
              {CAREERS_CONTACT}
            </a>
          </p>
        </div>

        <a
          href={CAREERS_PATH}
          className="mt-6 inline-block rounded-lg bg-amal-red px-8 py-3 font-semibold text-amal-white shadow-md transition hover:bg-amal-red/90"
        >
          Back to Careers
        </a>
      </div>
    </div>
  );
}
