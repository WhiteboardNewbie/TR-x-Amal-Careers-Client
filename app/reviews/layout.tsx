"use client";

import { SignedInShell } from "@/components/SignedInShell";

export default function ReviewsLayout({ children }: LayoutProps<"/reviews">) {
  return <SignedInShell landing="reviews">{children}</SignedInShell>;
}
