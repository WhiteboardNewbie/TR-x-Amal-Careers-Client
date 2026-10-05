import { SignedInShell } from "@/components/SignedInShell";

export default function ClientPage() {
  return (
    <SignedInShell landing="client">
      <h1 className="text-2xl font-semibold tracking-tight">Hiring</h1>
      <p className="mt-3 max-w-xl text-zinc-600">
        Client hiring tables come next.
      </p>
    </SignedInShell>
  );
}
