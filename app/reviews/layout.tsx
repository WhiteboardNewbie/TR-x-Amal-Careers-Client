"use client";

import { SignedInShell } from "@/components/SignedInShell";

const REVIEWS_LANDINGS = ["reviews", "staff"] as const;

export default function ReviewsLayout({ children }: LayoutProps<"/reviews">) {
  return (
    <SignedInShell landing={REVIEWS_LANDINGS} wide>
      {children}
    </SignedInShell>
  );
}
