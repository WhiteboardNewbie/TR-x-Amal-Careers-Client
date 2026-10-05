"use client";

import { useParams } from "next/navigation";
import { ResultPage } from "@/components/staff/ResultPage";

export default function VideoResultPage() {
  const params = useParams<{ id: string }>();
  return <ResultPage id={Number(params.id)} kind="video" />;
}
