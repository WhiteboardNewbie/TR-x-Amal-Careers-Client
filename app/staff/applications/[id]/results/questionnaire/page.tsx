"use client";

import { useParams } from "next/navigation";
import { ResultPage } from "@/components/staff/ResultPage";

export default function QuestionnaireResultPage() {
  const params = useParams<{ id: string }>();
  return <ResultPage id={Number(params.id)} kind="questionnaire" />;
}
