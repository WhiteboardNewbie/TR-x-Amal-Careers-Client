import { Suspense } from "react";
import { CvSearchScreen } from "@/components/staff/CvSearchScreen";

export default function CvSearchPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
      <CvSearchScreen />
    </Suspense>
  );
}
