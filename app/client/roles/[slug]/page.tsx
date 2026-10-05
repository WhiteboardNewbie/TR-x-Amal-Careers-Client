"use client";

import { useParams } from "next/navigation";
import { SignedInShell } from "@/components/SignedInShell";
import { ClientRoleApplications } from "@/components/client/ClientRoleApplications";

export default function ClientRolePage() {
  const params = useParams<{ slug: string }>();
  return (
    <SignedInShell landing="client">
      <ClientRoleApplications slug={params.slug} />
    </SignedInShell>
  );
}
