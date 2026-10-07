"use client";

import { useState } from "react";
import {
  CheckIcon,
  ClockIcon,
  FileTextIcon,
  UserIcon,
  VideoIcon,
} from "@/components/staff/icons";
import { startVideoTest } from "@/lib/public-api";
import {
  AssessmentExpiredCard,
  isAssessmentLinkExpiredOrInvalid,
} from "./AssessmentExpiredCard";
import { AlertCircleIcon, MicIcon } from "./icons";
import { TestBackdrop } from "./TestBackdrop";
import { StepNumber, cardShell, errorText, shellGradient } from "./shared";

export function VideoWelcome({
  token,
  applicantName,
  jobTitle,
  totalQuestions,
  onTestStarted,
}: {
  token: string;
  applicantName: string;
  jobTitle: string;
  totalQuestions: number;
  onTestStarted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [consent, setConsent] = useState(false);

  async function checkPermissions() {
    setNotice("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      stream.getTracks().forEach((t) => t.stop());
      setHasPermission(true);
      setPermissionChecked(true);
      setNotice("Camera and microphone access granted.");
    } catch (err: unknown) {
      setHasPermission(false);
      setPermissionChecked(true);
      const e = err as { name?: string; message?: string };
      if (e.name === "NotAllowedError") {
        setNotice("Please allow camera and microphone access to proceed.");
      } else if (e.name === "NotFoundError") {
        setNotice("No camera or microphone found.");
      } else {
        setNotice(`Error: ${e.message ?? "Unknown"}`);
      }
    }
  }

  async function handleStart() {
    if (!hasPermission || !consent) return;
    setBusy(true);
    setError("");
    try {
      await startVideoTest(token);
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
  if (busy) return <TestBackdrop message="Starting video test..." />;

  return (
    <div className={shellGradient}>
      <div className={cardShell}>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-amal-red/10">
            <VideoIcon className="h-10 w-10 text-amal-red" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-amal-ink">Video Assessment</h1>
          <p className="text-zinc-600">Record your video responses</p>
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
                This test contains <strong>{totalQuestions} video questions</strong>
              </span>
            </li>
            <li className="flex items-start">
              <StepNumber n={2} />
              <span>
                You have <strong>2 minutes</strong> to record each response
              </span>
            </li>
            <li className="flex items-start">
              <StepNumber n={3} />
              <span>
                Recording will <strong>automatically stop</strong> when time runs out
              </span>
            </li>
            <li className="flex items-start">
              <StepNumber n={4} />
              <span>
                Videos are uploaded <strong>immediately</strong> after recording
              </span>
            </li>
            <li className="flex items-start">
              <StepNumber n={5} />
              <span>
                Ensure you have <strong>good lighting</strong> and a quiet environment
              </span>
            </li>
          </ul>
        </div>

        <div
          className={`mb-6 rounded-lg border-l-4 p-4 ${
            permissionChecked
              ? hasPermission
                ? "border-green-400 bg-green-50"
                : "border-amal-red bg-amal-red/10"
              : "border-amber-400 bg-amber-50"
          }`}
        >
          <div className="flex">
            {permissionChecked && hasPermission ? (
              <CheckIcon className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
            ) : (
              <AlertCircleIcon
                className={`mr-3 mt-0.5 h-5 w-5 flex-shrink-0 ${
                  permissionChecked ? "text-amal-red" : "text-amber-600"
                }`}
              />
            )}
            <div className="flex-1">
              <p
                className={`font-medium ${
                  permissionChecked
                    ? hasPermission
                      ? "text-green-800"
                      : "text-amal-red"
                    : "text-amber-900"
                }`}
              >
                {permissionChecked
                  ? hasPermission
                    ? "Camera & Microphone Ready!"
                    : "Permission Denied"
                  : "Permission Check Required"}
              </p>
              <p className="mt-1 text-sm text-zinc-700">
                {permissionChecked
                  ? hasPermission
                    ? "Your devices are ready. Confirm recording consent below, then begin."
                    : "Please allow camera and microphone access in your browser settings."
                  : "Click the button below to grant camera and microphone access."}
              </p>
              {notice ? <p className="mt-2 text-sm text-zinc-600">{notice}</p> : null}
              {!permissionChecked || !hasPermission ? (
                <button
                  type="button"
                  onClick={() => void checkPermissions()}
                  className="mt-3 flex items-center rounded-lg bg-amber-100 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-200"
                >
                  <MicIcon className="mr-2 h-4 w-4" />
                  {permissionChecked ? "Try Again" : "Check Permissions"}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-black/10 bg-amal-white p-4">
          <h3 className="mb-2 font-semibold text-amal-ink">
            Recording &amp; storage consent
          </h3>
          <p className="mb-4 text-sm text-zinc-600">
            {jobTitle ? (
              <>
                For the{" "}
                <span className="font-medium text-amal-ink">{jobTitle}</span> role,
                your video responses will be captured using your camera and
                microphone, transmitted securely, and retained by the organization
                for recruitment and evaluation purposes in line with applicable
                policies. Access is limited to authorized personnel involved in the
                hiring process.
              </>
            ) : (
              <>
                For this assessment, your video responses will be captured using
                your camera and microphone, transmitted securely, and retained by
                the organization for recruitment and evaluation purposes in line
                with applicable policies. Access is limited to authorized personnel
                involved in the hiring process.
              </>
            )}
          </p>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-black/20 text-amal-red focus:ring-amal-red"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span className="text-sm leading-snug text-amal-ink">
              I understand and agree that my video and audio will be recorded,
              stored, and reviewed as part of this application. I consent to
              proceed on this basis.
            </span>
          </label>
        </div>

        {error ? <p className="mb-4 text-center text-sm text-amal-red">{error}</p> : null}

        <button
          type="button"
          onClick={() => void handleStart()}
          disabled={!hasPermission || !consent || busy}
          className={`flex w-full items-center justify-center rounded-lg px-6 py-4 font-semibold transition ${
            hasPermission && consent
              ? "bg-amal-red text-amal-white hover:bg-amal-red/90"
              : "cursor-not-allowed bg-zinc-300 text-zinc-500"
          }`}
        >
          <ClockIcon className="mr-2 h-5 w-5" />
          Start Video Test
        </button>

        <p className="mt-4 text-center text-sm text-zinc-500">
          You must allow camera and microphone access and confirm consent above
          before starting. By starting the test, you also agree to complete it in
          one sitting.
        </p>
      </div>
    </div>
  );
}
