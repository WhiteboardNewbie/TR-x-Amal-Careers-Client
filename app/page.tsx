import Image from "next/image";

import { RoleList } from "@/components/RoleList";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-amal-white text-amal-ink">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-t from-neutral-100 to-white px-6 py-[7.5rem] text-center">
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
          <div className="relative mx-auto max-w-3xl">
            <h1 className="text-[clamp(2rem,4.2vw,3.5rem)] font-medium leading-[1.18] tracking-[-0.037em]">
              Careers
            </h1>
            <p className="mx-auto mt-2.5 max-w-xl text-[clamp(1.05rem,1.5vw,1.45rem)] font-normal leading-normal text-zinc-500">
              Join our team and help shape the future of technology.
            </p>
          </div>
        </section>
        <section className="px-6 pb-20 pt-2">
          <div className="mx-auto w-full max-w-6xl">
            <RoleList />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
