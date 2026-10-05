import { SignedInShell } from "@/components/SignedInShell";
import { StaffHub } from "@/components/staff/StaffHub";

export default function StaffPage() {
  return (
    <SignedInShell landing="staff" wide>
      <StaffHub />
    </SignedInShell>
  );
}
