import { Suspense } from "react";
import { ShareLinksScreen } from "@/components/staff/ShareLinksScreen";

export default function ShareLinksPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
      <ShareLinksScreen />
    </Suspense>
  );
}
