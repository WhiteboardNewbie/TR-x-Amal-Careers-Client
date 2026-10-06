"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ApplicationDetail } from "@/components/staff/ApplicationDetail";

function ReviewApplicationBody() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = Number(params.id);
  const stageRaw = searchParams.get("stage");
  const stageParam = stageRaw ? Number(stageRaw) : Number.NaN;
  const reviewStageId =
    Number.isFinite(stageParam) && stageParam > 0 ? stageParam : undefined;
  return Number.isFinite(id) ? (
    <div className="mx-auto max-w-[1760px] px-4 py-6 sm:px-6 lg:px-8">
      <ApplicationDetail
        id={id}
        variant="reviews"
        reviewStageId={reviewStageId}
      />
    </div>
  ) : (
    <p className="text-sm text-zinc-500">Unknown application.</p>
  );
}

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <p className="px-4 py-6 text-sm text-zinc-500">
          Loading application…
        </p>
      }
    >
      <ReviewApplicationBody />
    </Suspense>
  );
}
