import Image from "next/image";

import { RoleList } from "@/components/RoleList";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-amal-white text-amal-ink">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden px-6 pb-10 pt-8 text-center">
          <div
            className="pointer-events-none absolute inset-x-0 top-0"
            aria-hidden
          >
            <Image
              src="/hero-backdrop.svg"
              alt=""
              width={1443}
              height={844}
              className="h-auto w-full"
            />
          </div>
          <h1 className="relative text-5xl font-semibold tracking-tight sm:text-6xl">
            Careers
          </h1>
          <p className="relative mx-auto mt-4 max-w-xl text-zinc-600">
            Join our team and help shape the future of technology.
          </p>
        </section>
        <section className="relative mx-auto w-full max-w-6xl px-6 pb-16">
          <RoleList />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
