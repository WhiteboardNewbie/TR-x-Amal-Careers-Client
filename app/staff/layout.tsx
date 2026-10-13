"use client";

import { usePathname } from "next/navigation";
import { SignedInShell } from "@/components/SignedInShell";

/** Managers need result pages from Manage Applications (ERP parity). */
const APPLICATION_RESULTS_PATH =
  /^\/staff\/applications\/\d+\/results\/(first-test|video|questionnaire)\/?$/;

export default function StaffLayout({ children }: LayoutProps<"/staff">) {
  const pathname = usePathname();
  const allowReviewsOnResults = APPLICATION_RESULTS_PATH.test(pathname);
  return (
    <SignedInShell
      landing={allowReviewsOnResults ? (["staff", "reviews"] as const) : "staff"}
      wide={pathname === "/staff"}
    >
      {children}
    </SignedInShell>
  );
}
