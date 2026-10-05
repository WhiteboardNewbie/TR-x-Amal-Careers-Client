"use client";

import { useParams } from "next/navigation";
import { SignedInShell } from "@/components/SignedInShell";
import { ShareLinkLogsScreen } from "@/components/staff/ShareLinkLogsScreen";

export default function ShareLinkLogsPage() {
  const params = useParams<{ id: string }>();
  return (
    <SignedInShell landing="staff">
      <ShareLinkLogsScreen id={params.id} />
    </SignedInShell>
  );
}
