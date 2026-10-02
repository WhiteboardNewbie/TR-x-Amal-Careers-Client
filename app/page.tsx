import { RoleList } from "@/components/RoleList";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-white text-zinc-950">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden px-6 pb-10 pt-8 text-center">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(0,0,0,0.05),transparent_55%)]"
            aria-hidden
          />
          <h1 className="relative text-5xl font-semibold tracking-tight sm:text-6xl">
            Careers
          </h1>
          <p className="relative mx-auto mt-4 max-w-xl text-zinc-600">
            Join our team and help shape the future of technology.
          </p>
        </section>
        <section className="mx-auto w-full max-w-6xl px-6 pb-16">
          <RoleList />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
