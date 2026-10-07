"use client";

import { ArrowRightIcon } from "./icons";
import { CheckIcon, ClockIcon, MailIcon, VideoIcon } from "@/components/staff/icons";
import { CAREERS_CONTACT, cardShell, shellGradient } from "./shared";

export function VideoThankYou({
  onContinueToQuestionnaire,
}: {
  onContinueToQuestionnaire: () => void;
}) {
  return (
    <div className={shellGradient}>
      <div className={`${cardShell} text-center md:p-12`}>
        <div className="mx-auto mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
          <CheckIcon className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="mb-4 text-3xl font-bold text-amal-ink md:text-4xl">
          Video Assessment Complete!
        </h1>
        <p className="mb-8 text-xl text-zinc-700">
          Thank you for completing the video assessment.
        </p>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-amal-red/5 p-6">
            <div className="mb-3 flex items-center justify-center">
              <VideoIcon className="h-8 w-8 text-amal-red" />
            </div>
            <h3 className="mb-2 font-semibold text-amal-ink">Videos Recorded</h3>
            <p className="text-sm text-zinc-600">All responses submitted</p>
          </div>
          <div className="rounded-lg bg-amal-blue/5 p-6">
            <div className="mb-3 flex items-center justify-center">
              <MailIcon className="h-8 w-8 text-amal-blue" />
            </div>
            <h3 className="mb-2 font-semibold text-amal-ink">Next: Questionnaire</h3>
            <p className="text-sm text-zinc-600">Final assessment section</p>
          </div>
          <div className="rounded-lg bg-green-50 p-6">
            <div className="mb-3 flex items-center justify-center">
              <ClockIcon className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="mb-2 font-semibold text-amal-ink">What&apos;s Next?</h3>
            <p className="text-sm text-zinc-600">Text-based questions ahead</p>
          </div>
        </div>

        <div className="mb-8 rounded-lg bg-amal-sheet p-6">
          <p className="leading-relaxed text-zinc-700">
            Your video responses have been successfully submitted. Our recruitment
            team has been notified.
          </p>
          <div className="mt-4 border-t border-black/10 pt-4">
            <p className="mb-2 font-medium leading-relaxed text-zinc-700">
              Final Step: General Questionnaire
            </p>
            <p className="text-sm leading-relaxed text-zinc-600">
              You&apos;re almost done! The final section is a general questionnaire
              where you&apos;ll provide text-based answers. Take your time to provide
              thoughtful responses.
            </p>
          </div>
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
          onClick={onContinueToQuestionnaire}
          className="mx-auto mt-6 flex items-center gap-2 rounded-lg bg-amal-red px-8 py-3 font-semibold text-amal-white shadow-md transition hover:bg-amal-red/90"
        >
          Continue To Questionnaire
          <ArrowRightIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
