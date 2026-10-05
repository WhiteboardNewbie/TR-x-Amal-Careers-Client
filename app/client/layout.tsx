"use client";

import { SignedInShell } from "@/components/SignedInShell";

export default function ClientLayout({ children }: LayoutProps<"/client">) {
  return <SignedInShell landing="client">{children}</SignedInShell>;
}
