"use client";

import { useParams } from "next/navigation";
import { AssessmentFlow } from "@/components/assessment/AssessmentFlow";

export default function AssessmentPage() {
  const params = useParams<{ token: string }>();
  return (
    <main className="min-h-full text-amal-ink">
      <AssessmentFlow token={params.token} />
    </main>
  );
}
