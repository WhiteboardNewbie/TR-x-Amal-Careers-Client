"use client";

import { useParams } from "next/navigation";
import { VideoTestResultView } from "@/components/staff/VideoTestResultView";

export default function VideoResultPage() {
  const params = useParams<{ id: string }>();
  return <VideoTestResultView id={Number(params.id)} />;
}
