import { SignedInShell } from "@/components/SignedInShell";
import { ReviewsScreen } from "@/components/reviews/ReviewsScreen";

export default function ReviewsPage() {
  return (
    <SignedInShell landing="reviews">
      <ReviewsScreen />
    </SignedInShell>
  );
}
