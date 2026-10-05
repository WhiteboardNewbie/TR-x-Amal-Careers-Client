import { SignedInShell } from "@/components/SignedInShell";
import { ShareLinksScreen } from "@/components/staff/ShareLinksScreen";

export default function ShareLinksPage() {
  return (
    <SignedInShell landing="staff">
      <ShareLinksScreen />
    </SignedInShell>
  );
}
