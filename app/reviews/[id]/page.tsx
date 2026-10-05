"use client";

import { useParams } from "next/navigation";
import { SignedInShell } from "@/components/SignedInShell";
import { ReviewDetail } from "@/components/reviews/ReviewDetail";

export default function ReviewPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  return (
    <SignedInShell landing="reviews">
      {Number.isFinite(id) ? (
        <ReviewDetail id={id} />
      ) : (
        <p className="text-sm text-zinc-500">Unknown review.</p>
      )}
    </SignedInShell>
  );
}
