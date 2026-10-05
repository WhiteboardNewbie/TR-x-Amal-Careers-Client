"use client";

import { useParams } from "next/navigation";
import { ShareLinkLogsScreen } from "@/components/staff/ShareLinkLogsScreen";

export default function ShareLinkLogsPage() {
  const params = useParams<{ id: string }>();
  return <ShareLinkLogsScreen id={params.id} />;
}
