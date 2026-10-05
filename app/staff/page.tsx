import { SignedInShell } from "@/components/SignedInShell";

export default function StaffPage() {
  return (
    <SignedInShell landing="staff">
      <h1 className="text-2xl font-semibold tracking-tight">Careers</h1>
      <p className="mt-3 max-w-xl text-zinc-600">
        Roles, applicants, and applications come next.
      </p>
    </SignedInShell>
  );
}
