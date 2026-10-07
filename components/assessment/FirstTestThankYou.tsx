"use client";

import { ArrowRightIcon } from "./icons";
import { CheckIcon, ClockIcon, MailIcon } from "@/components/staff/icons";
import { CAREERS_CONTACT, cardShell, shellGradient } from "./shared";

export function FirstTestThankYou({
  videoQuestionCount,
  onContinueToVideoTest,
}: {
  videoQuestionCount: number;
  onContinueToVideoTest: () => void;
}) {
  return (
    <div className={shellGradient}>
      <div className={`${cardShell} text-center md:p-12`}>
        <div className="mx-auto mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
          <CheckIcon className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="mb-4 text-3xl font-bold text-amal-ink md:text-4xl">
          Test Submitted Successfully!
        </h1>
        <p className="mb-8 text-xl text-zinc-700">
          Thank you for completing the assessment.
        </p>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-amal-red/5 p-6">
            <div className="mb-3 flex items-center justify-center">
              <MailIcon className="h-8 w-8 text-amal-red" />
            </div>
            <h3 className="mb-2 font-semibold text-amal-ink">
              Next: Video Interview
            </h3>
            <p className="text-sm text-zinc-600">
              Record video responses to {videoQuestionCount} questions
            </p>
          </div>
          <div className="rounded-lg bg-amal-blue/5 p-6">
            <div className="mb-3 flex items-center justify-center">
              <ClockIcon className="h-8 w-8 text-amal-blue" />
            </div>
            <h3 className="mb-2 font-semibold text-amal-ink">What&apos;s Next?</h3>
            <p className="text-sm text-zinc-600">
              You&apos;ll need a camera and microphone ready
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-lg bg-amal-sheet p-6">
          <p className="leading-relaxed text-zinc-700">
            Your test has been successfully submitted and our recruitment team
            has been notified.
            <span className="mt-4 block font-medium">
              Next Step: Video Interview Test
            </span>
            <span className="mt-2 block text-sm text-zinc-600">
              In the next section, you&apos;ll record video responses to
              questions. Make sure you have a working camera and microphone,
              and find a quiet, well-lit environment.
            </span>
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

        <button
          type="button"
          onClick={onContinueToVideoTest}
          className="mx-auto mt-6 flex items-center gap-2 rounded-lg bg-amal-red px-8 py-3 font-semibold text-amal-white shadow-md transition hover:bg-amal-red/90 hover:shadow-lg"
        >
          Continue To Video Test
          <ArrowRightIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
