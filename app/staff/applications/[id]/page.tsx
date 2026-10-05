"use client";

import { useParams } from "next/navigation";
import { SignedInShell } from "@/components/SignedInShell";
import { ApplicationDetail } from "@/components/staff/ApplicationDetail";

export default function ApplicationPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  return (
    <SignedInShell landing="staff">
      {Number.isFinite(id) ? (
        <ApplicationDetail id={id} />
      ) : (
        <p className="text-sm text-zinc-500">Unknown application.</p>
      )}
    </SignedInShell>
  );
}
