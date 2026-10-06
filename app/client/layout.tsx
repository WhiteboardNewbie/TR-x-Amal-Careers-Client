"use client";

import { SignedInShell } from "@/components/SignedInShell";
import { PERM } from "@/lib/ability";

export default function ClientLayout({ children }: LayoutProps<"/client">) {
  return (
    <SignedInShell landing="client" permission={PERM.viewMyClientCareers} wide>
      {children}
    </SignedInShell>
  );
}
