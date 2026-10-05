import { SignedInShell } from "@/components/SignedInShell";
import { CvSearchScreen } from "@/components/staff/CvSearchScreen";

export default function CvSearchPage() {
  return (
    <SignedInShell landing="staff">
      <CvSearchScreen />
    </SignedInShell>
  );
}
