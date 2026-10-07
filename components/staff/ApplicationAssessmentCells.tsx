"use client";

import Link from "next/link";
import type { StaffApplication } from "@/lib/types";
import {
  ASSESSMENT_BADGE_BASE,
  ApplicationAiScoresInline,
  AssessmentCell,
  AssessmentLockedBadge,
  AssessmentNotStartedBadge,
  AssessmentStatusBadge,
  firstTestScoreBadgeClass,
  getAssessmentEffectiveStatus,
} from "./assessment-status";
import {
  FileSearchIcon,
  MessageSquareIcon,
  VideoIcon,
} from "./icons";

export function ApplicationAssessmentCells({
  row,
}: {
  row: StaffApplication;
}) {
  const firstStatus = getAssessmentEffectiveStatus(row.test_session);
  const videoStatus = getAssessmentEffectiveStatus(row.video_test_session);
  const questionnaireStatus = getAssessmentEffectiveStatus(
    row.general_questionnaire_session,
  );
  const firstScore = Number(row.test_session?.score_percentage ?? Number.NaN);
  const videoGated = Boolean(row.test_session) && firstStatus !== "completed";
  const questionnaireGated =
    Boolean(row.test_session) &&
    (!row.video_test_session || videoStatus !== "completed");

  return (
    <>
      <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
        <AssessmentCell>
          {!row.test_session ? (
            <AssessmentNotStartedBadge />
          ) : firstStatus === "completed" ? (
            <Link
              href={`/staff/applications/${row.id}/results/first-test`}
              className={`${ASSESSMENT_BADGE_BASE} ${
                Number.isNaN(firstScore)
                  ? "border-black/10 bg-amal-sheet text-zinc-700"
                  : firstTestScoreBadgeClass(firstScore)
              }`}
            >
              <FileSearchIcon className="h-3.5 w-3.5" />
              {Number.isNaN(firstScore) ? "View" : `${firstScore.toFixed(0)}%`}
            </Link>
          ) : (
            <AssessmentStatusBadge
              status={firstStatus}
              expiresAt={row.test_session.expires_at}
            />
          )}
        </AssessmentCell>
      </td>
      <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
        <AssessmentCell>
          {!row.video_test_session ? (
            videoGated &&
            (firstStatus === "pending" ||
              firstStatus === "in_progress" ||
              firstStatus === "expired") ? (
              <AssessmentLockedBadge />
            ) : (
              <AssessmentNotStartedBadge />
            )
          ) : videoStatus === "completed" ? (
            <Link
              href={`/staff/applications/${row.id}/results/video`}
              className={`${ASSESSMENT_BADGE_BASE} border-emerald-200 bg-emerald-100 text-emerald-800`}
            >
              <VideoIcon className="h-3 w-3" />
              Completed
            </Link>
          ) : videoGated &&
            (videoStatus === "pending" || videoStatus === "in_progress") ? (
            <AssessmentLockedBadge />
          ) : (
            <AssessmentStatusBadge
              status={videoStatus}
              expiresAt={row.video_test_session.expires_at}
              icon={<VideoIcon className="h-3 w-3" />}
            />
          )}
        </AssessmentCell>
      </td>
      <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
        <AssessmentCell>
          {!row.general_questionnaire_session ? (
            questionnaireGated ? (
              <AssessmentLockedBadge />
            ) : (
              <AssessmentNotStartedBadge />
            )
          ) : questionnaireStatus === "completed" ? (
            <Link
              href={`/staff/applications/${row.id}/results/questionnaire`}
              className={`${ASSESSMENT_BADGE_BASE} border-emerald-200 bg-emerald-100 text-emerald-800`}
            >
              <MessageSquareIcon className="h-3 w-3" />
              Completed
            </Link>
          ) : questionnaireGated &&
            (questionnaireStatus === "pending" ||
              questionnaireStatus === "in_progress") ? (
            <AssessmentLockedBadge />
          ) : (
            <AssessmentStatusBadge
              status={questionnaireStatus}
              expiresAt={row.general_questionnaire_session.expires_at}
              icon={<MessageSquareIcon className="h-3 w-3" />}
            />
          )}
        </AssessmentCell>
      </td>
      <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
        <AssessmentCell>
          <ApplicationAiScoresInline application={row} />
        </AssessmentCell>
      </td>
      <td className="px-3 py-3">
        <AssessmentCell>
          {row.manager_score_avg != null &&
          String(row.manager_score_avg).trim() !== "" ? (
            <span
              className={`${ASSESSMENT_BADGE_BASE} border-transparent bg-amal-sheet text-zinc-800`}
            >
              {Number(row.manager_score_avg).toFixed(2)} / 10
            </span>
          ) : (
            <span className="text-zinc-400">—</span>
          )}
        </AssessmentCell>
      </td>
    </>
  );
}
