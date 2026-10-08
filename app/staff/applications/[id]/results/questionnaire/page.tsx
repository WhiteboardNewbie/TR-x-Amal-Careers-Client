"use client";

import { useParams } from "next/navigation";
import { QuestionnaireResultView } from "@/components/staff/QuestionnaireResultView";

export default function QuestionnaireResultPage() {
  const params = useParams<{ id: string }>();
  return <QuestionnaireResultView id={Number(params.id)} />;
}
