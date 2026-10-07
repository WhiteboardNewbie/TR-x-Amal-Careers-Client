"use client";

import { useState } from "react";
import { ClockIcon, FileTextIcon, UserIcon } from "@/components/staff/icons";
import { AlertCircleIcon } from "./icons";
import {
  AssessmentExpiredCard,
  isAssessmentLinkExpiredOrInvalid,
} from "./AssessmentExpiredCard";
import { TestBackdrop } from "./TestBackdrop";
import { StepNumber, cardShell, errorText, shellGradient } from "./shared";
import { startFirstTest } from "@/lib/public-api";

export function FirstTestWelcome({
  token,
  applicantName,
  jobTitle,
  totalQuestions,
  timeLimitMinutes,
  onTestStarted,
}: {
  token: string;
  applicantName: string;
  jobTitle: string;
  totalQuestions: number;
  timeLimitMinutes: number;
  onTestStarted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleStart() {
    setBusy(true);
    setError("");
    try {
      await startFirstTest(token);
      onTestStarted();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  if (error && isAssessmentLinkExpiredOrInvalid(error)) {
    return (
      <AssessmentExpiredCard title="Unable to open this assessment" message={error} />
    );
  }

  if (busy) {
    return <TestBackdrop message="Starting test..." />;
  }

  return (
    <div className={shellGradient}>
      <div className={cardShell}>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-amal-red/10">
            <FileTextIcon className="h-10 w-10 text-amal-red" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-amal-ink">Assessment Test</h1>
          <p className="text-zinc-600">Welcome to your evaluation</p>
        </div>

        <div className="mb-6 rounded-lg bg-amal-red/5 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-center">
              <UserIcon className="mr-3 h-5 w-5 text-amal-red" />
              <div>
                <p className="text-sm text-zinc-600">Applicant</p>
                <p className="font-semibold text-amal-ink">{applicantName}</p>
              </div>
            </div>
            <div className="flex items-center">
              <FileTextIcon className="mr-3 h-5 w-5 text-amal-red" />
              <div>
                <p className="text-sm text-zinc-600">Position</p>
                <p className="font-semibold text-amal-ink">{jobTitle}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-lg bg-amal-sheet p-6">
          <h3 className="mb-4 font-semibold text-amal-ink">Test Instructions:</h3>
          <ul className="space-y-3 text-zinc-700">
            <li className="flex items-start">
              <StepNumber n={1} />
              <span>
                This test contains{" "}
                <strong>{totalQuestions} multiple choice questions</strong>
              </span>
            </li>
            <li className="flex items-start">
              <StepNumber n={2} />
              <span>
                You have <strong>{timeLimitMinutes} minutes</strong> to complete the
                test
              </span>
            </li>
            <li className="flex items-start">
              <StepNumber n={3} />
              <span>Once started, the timer cannot be paused</span>
            </li>
            <li className="flex items-start">
              <StepNumber n={4} />
              <span>You can review and change answers before submitting</span>
            </li>
            <li className="flex items-start">
              <StepNumber n={5} />
              <span>The test will auto-submit when time expires</span>
            </li>
          </ul>
        </div>

        <div className="mb-6 flex rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4">
          <AlertCircleIcon className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
          <p className="text-sm text-amber-900">
            <strong>Important:</strong> Make sure you have a stable internet
            connection. The test cannot be resumed if the window is closed.
          </p>
        </div>

        {error ? <p className="mb-4 text-center text-sm text-amal-red">{error}</p> : null}

        <button
          type="button"
          onClick={() => void handleStart()}
          disabled={busy}
          className="flex w-full items-center justify-center rounded-lg bg-amal-red px-6 py-4 font-semibold text-amal-white transition hover:bg-amal-red/90 disabled:opacity-50"
        >
          <ClockIcon className="mr-2 h-5 w-5" />
          Start Test
        </button>

        <p className="mt-4 text-center text-sm text-zinc-500">
          By starting the test, you agree to complete it in one sitting.
        </p>
      </div>
    </div>
  );
}
