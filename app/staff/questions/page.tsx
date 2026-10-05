import { SignedInShell } from "@/components/SignedInShell";
import { QuestionsScreen } from "@/components/staff/QuestionsScreen";

export default function QuestionsPage() {
  return (
    <SignedInShell landing="staff">
      <QuestionsScreen />
    </SignedInShell>
  );
}
