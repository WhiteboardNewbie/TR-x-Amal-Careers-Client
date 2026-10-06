"use client";

import { ApplicationDetail } from "@/components/staff/ApplicationDetail";

/** @deprecated Reviewers open the same unified application view as staff. */
export function ReviewDetail({ id }: { id: number }) {
  return <ApplicationDetail id={id} variant="reviews" />;
}
