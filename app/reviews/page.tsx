import { SignedInShell } from "@/components/SignedInShell";

export default function ReviewsPage() {
  return (
    <SignedInShell landing="reviews">
      <h1 className="text-2xl font-semibold tracking-tight">Reviews</h1>
      <p className="mt-3 max-w-xl text-zinc-600">
        Assigned applications come next.
      </p>
    </SignedInShell>
  );
}
