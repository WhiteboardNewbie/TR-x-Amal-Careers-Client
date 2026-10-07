"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { getAssessment } from "@/lib/staff-api";
import type { ApplicationAssessment } from "@/lib/types";
import { formatAssessmentStatusLabel } from "@/components/staff/assessment-status";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

export function ResultPage({
  id,
  kind,
  onClose,
}: {
  id: number;
  kind: "first-test" | "video" | "questionnaire";
  onClose?: () => void;
}) {
  const [assessment, setAssessment] = useState<ApplicationAssessment | null>(
    null,
  );
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let ignore = false;
    getAssessment(id)
      .then((data) => {
        if (!ignore) {
          setAssessment(data);
        }
      })
      .catch((error) => {
        if (!ignore) {
          setNotice(errorText(error));
        }
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  const title =
    kind === "first-test"
      ? "First-test result"
      : kind === "video"
        ? "Video result"
        : "Questionnaire result";
  const section =
    kind === "first-test"
      ? assessment?.first_test
      : kind === "video"
        ? assessment?.video_test
        : assessment?.questionnaire;

  return (
    <div>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-semibold text-amal-red"
        >
          Close
        </button>
      ) : (
        <Link
          href={`/staff/applications/${id}`}
          className="text-sm font-semibold text-amal-red"
        >
          ← Application
        </Link>
      )}
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">{title}</h1>
      {notice ? (
        <p className="mt-4 text-sm text-amal-red">{notice}</p>
      ) : null}
      {!section ? (
        <p className="mt-4 text-sm text-zinc-500">
          No result yet. Send an invite from the application.
        </p>
      ) : (
        <div className="mt-4 rounded-2xl border border-black/10 bg-amal-white p-5">
          <p className="text-sm text-zinc-600">
            {formatAssessmentStatusLabel(section.status)} · Score{" "}
            {section.score_percentage ?? "—"}
          </p>
          <ol className="mt-4 space-y-3">
            {kind === "video"
              ? (assessment?.video_test?.questions ?? []).map((row) => (
                  <li key={row.order} className="text-sm">
                    <p className="font-semibold">
                      {row.order}. {row.prompt}
                    </p>
                    <p className="mt-1 text-zinc-600">
                      {row.transcript || "No transcript yet."}
                    </p>
                  </li>
                ))
              : kind === "questionnaire"
                ? (assessment?.questionnaire?.questions ?? []).map((row) => (
                    <li key={row.order} className="text-sm">
                      <p className="font-semibold">
                        {row.order}. {row.question_text}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-zinc-600">
                        {row.answer_text?.trim() || "—"}
                      </p>
                    </li>
                  ))
                : (assessment?.first_test?.questions ?? []).map((row) => (
                    <li key={row.order} className="text-sm">
                      <p className="font-semibold">
                        {row.order}. {row.question_text}
                      </p>
                      <p className="mt-1 text-zinc-600">
                        Answer: {row.selected_option || "—"}
                      </p>
                    </li>
                  ))}
          </ol>
        </div>
      )}
    </div>
  );
}
