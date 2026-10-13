"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { ShareLinkLogsScreen } from "@/components/staff/ShareLinkLogsScreen";

function LogsInner() {
  const params = useParams<{ id: string }>();
  return <ShareLinkLogsScreen id={params.id} />;
}

export default function ShareLinkLogsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
      <LogsInner />
    </Suspense>
  );
}
