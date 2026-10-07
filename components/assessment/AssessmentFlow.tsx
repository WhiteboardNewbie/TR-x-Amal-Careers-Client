"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { getPublicInvite, type InvitePayload } from "@/lib/public-api";
import {
  AssessmentExpiredCard,
  isAssessmentLinkExpiredOrInvalid,
} from "./AssessmentExpiredCard";
import { FirstTestScreen } from "./FirstTestScreen";
import { FirstTestThankYou } from "./FirstTestThankYou";
import { FirstTestWelcome } from "./FirstTestWelcome";
import { AlertCircleIcon } from "./icons";
import { QuestionnaireScreen } from "./QuestionnaireScreen";
import { QuestionnaireThankYou } from "./QuestionnaireThankYou";
import { QuestionnaireWelcome } from "./QuestionnaireWelcome";
import { TestBackdrop } from "./TestBackdrop";
import { VideoTestScreen } from "./VideoTestScreen";
import { VideoThankYou } from "./VideoThankYou";
import { VideoWelcome } from "./VideoWelcome";
import { cardShell, errorText, shellGradient } from "./shared";

type TestStage =
  | "loading"
  | "initial_welcome"
  | "initial_test"
  | "initial_test_thankyou"
  | "video_welcome"
  | "video_test"
  | "video_test_result"
  | "questionnaire_welcome"
  | "questionnaire_test"
  | "final_thankyou"
  | "missing"
  | "expired"
  | "error";

function stageFromInvite(invite: InvitePayload): TestStage {
  if (invite.first_test.status !== "completed") {
    if (invite.first_test.status === "pending") return "initial_welcome";
    if (invite.first_test.status === "in_progress") return "initial_test";
    return "error";
  }
  if (invite.video_test.status !== "completed") {
    if (invite.video_test.status === "pending") return "video_welcome";
    if (invite.video_test.status === "in_progress") return "video_test";
    return "error";
  }
  if (invite.questionnaire.status !== "completed") {
    if (invite.questionnaire.status === "pending") return "questionnaire_welcome";
    if (invite.questionnaire.status === "in_progress") return "questionnaire_test";
    return "error";
  }
  return "final_thankyou";
}

export function AssessmentFlow({ token }: { token: string }) {
  const [stage, setStage] = useState<TestStage>("loading");
  const [invite, setInvite] = useState<InvitePayload | null>(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    getPublicInvite(token)
      .then((data) => {
        if (ignore) return;
        setInvite(data);
        setStage(stageFromInvite(data));
      })
      .catch((err) => {
        if (ignore) return;
        if (err instanceof ApiError && err.status === 404) {
          setStage("missing");
        } else if (err instanceof ApiError && err.status === 410) {
          setStage("expired");
        } else {
          setError(errorText(err));
          setStage("error");
        }
      });
    return () => {
      ignore = true;
    };
  }, [token, reloadKey]);

  const refresh = useCallback(() => {
    setStage("loading");
    setError("");
    setReloadKey((k) => k + 1);
  }, []);

  if (stage === "loading") {
    return <TestBackdrop message="Loading test..." />;
  }
  if (stage === "missing") {
    return (
      <AssessmentExpiredCard
        title="Not found"
        message="This assessment link is not valid."
      />
    );
  }
  if (stage === "expired") {
    return (
      <AssessmentExpiredCard message="This assessment invite has expired." />
    );
  }
  if (stage === "error") {
    if (isAssessmentLinkExpiredOrInvalid(error)) {
      return <AssessmentExpiredCard message={error} />;
    }
    return (
      <div className={shellGradient}>
        <div className={`${cardShell} max-w-md text-center`}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amal-red/15">
            <AlertCircleIcon className="h-8 w-8 text-amal-red" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-amal-ink">Error</h2>
          <p className="mb-6 text-zinc-600">{error || "Request failed."}</p>
          <button
            type="button"
            onClick={refresh}
            className="w-full rounded-lg bg-amal-red px-6 py-3 font-semibold text-amal-white hover:bg-amal-red/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!invite) {
    return <TestBackdrop message="Loading..." />;
  }

  const applicantName = invite.applicant.name;
  const jobTitle = invite.role.title;

  switch (stage) {
    case "initial_welcome":
      return (
        <FirstTestWelcome
          token={token}
          applicantName={applicantName}
          jobTitle={jobTitle}
          totalQuestions={invite.first_test.total_questions}
          timeLimitMinutes={invite.first_test.time_limit_minutes}
          onTestStarted={refresh}
        />
      );
    case "initial_test":
      return (
        <FirstTestScreen
          token={token}
          timeLimitMinutes={invite.first_test.time_limit_minutes}
          onComplete={() => setStage("initial_test_thankyou")}
        />
      );
    case "initial_test_thankyou":
      return (
        <FirstTestThankYou
          videoQuestionCount={invite.video_test.total_questions}
          onContinueToVideoTest={() => {
            if (invite.video_test.status === "in_progress") {
              setStage("video_test");
            } else {
              setStage("video_welcome");
            }
          }}
        />
      );
    case "video_welcome":
      return (
        <VideoWelcome
          token={token}
          applicantName={applicantName}
          jobTitle={jobTitle}
          totalQuestions={invite.video_test.total_questions}
          onTestStarted={refresh}
        />
      );
    case "video_test":
      return (
        <VideoTestScreen
          token={token}
          onComplete={() => setStage("video_test_result")}
        />
      );
    case "video_test_result":
      return (
        <VideoThankYou
          onContinueToQuestionnaire={() => {
            if (invite.questionnaire.status === "in_progress") {
              setStage("questionnaire_test");
            } else {
              setStage("questionnaire_welcome");
            }
          }}
        />
      );
    case "questionnaire_welcome":
      return (
        <QuestionnaireWelcome
          token={token}
          applicantName={applicantName}
          jobTitle={jobTitle}
          totalQuestions={invite.questionnaire.total_questions}
          onTestStarted={refresh}
        />
      );
    case "questionnaire_test":
      return (
        <QuestionnaireScreen
          token={token}
          onComplete={() => setStage("final_thankyou")}
        />
      );
    case "final_thankyou":
      return <QuestionnaireThankYou />;
    default:
      return <TestBackdrop message="Loading..." />;
  }
}
