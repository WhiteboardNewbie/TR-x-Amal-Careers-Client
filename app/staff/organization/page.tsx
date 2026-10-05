import { SignedInShell } from "@/components/SignedInShell";

export default function OrganizationPage() {
  return (
    <SignedInShell landing="staff">
      <h1 className="text-2xl font-semibold tracking-tight">
        Organizational Configuration
      </h1>
      <p className="mt-3 max-w-xl text-zinc-600">
        Departments, clients, and roles come next.
      </p>
    </SignedInShell>
  );
}
