"use client";

import { useParams } from "next/navigation";
import { SignedInShell } from "@/components/SignedInShell";
import { ResultPage } from "@/components/staff/ResultPage";

export default function QuestionnaireResultPage() {
  const params = useParams<{ id: string }>();
  return (
    <SignedInShell landing="staff">
      <ResultPage id={Number(params.id)} kind="questionnaire" />
    </SignedInShell>
  );
}
