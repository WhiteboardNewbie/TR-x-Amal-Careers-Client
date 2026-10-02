import { PageHero } from "@/components/PageHero";
import { RoleList } from "@/components/RoleList";
import { SiteShell } from "@/components/SiteShell";

export default function Home() {
  return (
    <SiteShell>
      <PageHero
        title="Careers"
        subtitle="Join our team and help shape the future of technology."
      />
      <section className="py-[var(--section-y)]">
        <div className="page-container">
          <RoleList />
        </div>
      </section>
    </SiteShell>
  );
}
