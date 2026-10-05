import { SignedInShell } from "@/components/SignedInShell";

export default function QuestionsPage() {
  return (
    <SignedInShell landing="staff">
      <h1 className="text-2xl font-semibold tracking-tight">
        Assessment database
      </h1>
      <p className="mt-3 max-w-xl text-zinc-600">
        Questions and the question bank come next.
      </p>
    </SignedInShell>
  );
}
