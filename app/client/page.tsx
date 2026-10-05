import { SignedInShell } from "@/components/SignedInShell";
import { ClientHiring } from "@/components/client/ClientHiring";

export default function ClientPage() {
  return (
    <SignedInShell landing="client">
      <ClientHiring />
    </SignedInShell>
  );
}
