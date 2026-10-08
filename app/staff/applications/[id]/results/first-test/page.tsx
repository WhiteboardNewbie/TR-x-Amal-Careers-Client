"use client";

import { useParams } from "next/navigation";
import { FirstTestResultView } from "@/components/staff/FirstTestResultView";

export default function FirstTestResultPage() {
  const params = useParams<{ id: string }>();
  return <FirstTestResultView id={Number(params.id)} />;
}
