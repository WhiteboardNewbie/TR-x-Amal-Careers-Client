import { RoleDetail } from "@/components/RoleDetail";
import { SiteShell } from "@/components/SiteShell";

export default async function RolePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <SiteShell>
      <RoleDetail key={slug} slug={slug} />
    </SiteShell>
  );
}
