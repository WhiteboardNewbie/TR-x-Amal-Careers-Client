"use client";

import { useParams } from "next/navigation";
import { ClientRoleApplications } from "@/components/client/ClientRoleApplications";

export default function ClientRolePage() {
  const params = useParams<{ slug: string }>();
  return <ClientRoleApplications slug={params.slug} />;
}
