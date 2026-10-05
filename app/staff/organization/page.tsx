import { SignedInShell } from "@/components/SignedInShell";
import { OrganizationScreen } from "@/components/staff/OrganizationScreen";

export default function OrganizationPage() {
  return (
    <SignedInShell landing="staff">
      <OrganizationScreen />
    </SignedInShell>
  );
}
