import { ApplyForm } from "@/components/ApplyForm";
import { SiteShell } from "@/components/SiteShell";

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <SiteShell>
      <ApplyForm key={slug} slug={slug} />
    </SiteShell>
  );
}
