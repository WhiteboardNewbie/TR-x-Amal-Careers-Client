"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { ClientApplication } from "@/components/client/ClientApplication";

function ClientApplicationBody() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  return Number.isFinite(id) ? (
    <ClientApplication id={id} />
  ) : (
    <p className="text-sm text-zinc-500">Unknown application.</p>
  );
}

export default function ClientApplicationPage() {
  return (
    <Suspense
      fallback={
        <p className="flex min-h-[60vh] items-center justify-center text-sm text-zinc-500">
          Loading unified application view...
        </p>
      }
    >
      <ClientApplicationBody />
    </Suspense>
  );
}
