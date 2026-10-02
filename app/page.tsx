import Image from "next/image";

import { RoleList } from "@/components/RoleList";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-amal-white text-amal-ink">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-amal-sheet py-[var(--section-y)] text-center">
          <div
            className="pointer-events-none absolute top-0 right-0 w-[90.1875%]"
            aria-hidden
          >
            <Image
              src="/hero-backdrop.svg"
              alt=""
              width={1443}
              height={844}
              sizes="90vw"
              className="h-auto w-full"
              priority
            />
          </div>
          <div className="page-container relative">
            <h1 className="text-[clamp(2.25rem,calc(1.827rem+1.96vw),3.5rem)] font-medium leading-[1.1785] tracking-[-0.037em]">
              Careers
            </h1>
            <p className="mx-auto mt-2.5 max-w-[40rem] text-[clamp(1.2rem,calc(1.152rem+0.33vw),1.4375rem)] font-normal leading-[1.5] tracking-[-0.005em] text-zinc-500">
              Join our team and help shape the future of technology.
            </p>
          </div>
        </section>
        <section className="py-[var(--section-y)]">
          <div className="page-container">
            <RoleList />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
