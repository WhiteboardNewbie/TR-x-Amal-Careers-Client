"use client";

import { useParams } from "next/navigation";
import { SharedApplication } from "@/components/shared/SharedApplication";

export default function SharedPage() {
  const params = useParams<{ id: string }>();
  return (
    <main className="min-h-full bg-amal-sheet text-amal-ink">
      <SharedApplication id={params.id} />
    </main>
  );
}
