"use client";

import { useParams } from "next/navigation";
import { ClientApplication } from "@/components/client/ClientApplication";

export default function ClientApplicationPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  return Number.isFinite(id) ? (
    <ClientApplication id={id} />
  ) : (
    <p className="text-sm text-zinc-500">Unknown application.</p>
  );
}
