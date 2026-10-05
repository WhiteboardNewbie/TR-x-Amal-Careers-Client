"use client";

import { usePathname } from "next/navigation";
import { SignedInShell } from "@/components/SignedInShell";

export default function StaffLayout({ children }: LayoutProps<"/staff">) {
  const pathname = usePathname();
  return (
    <SignedInShell landing="staff" wide={pathname === "/staff"}>
      {children}
    </SignedInShell>
  );
}
