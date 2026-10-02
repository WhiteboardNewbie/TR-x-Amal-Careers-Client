import Image from "next/image";

import { RoleList } from "@/components/RoleList";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  return (
    <div className="relative flex min-h-full flex-col bg-amal-white text-amal-ink">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(48vw,26rem)] overflow-hidden"
        aria-hidden
      >
        <Image
          src="/hero-backdrop.svg"
          alt=""
          width={1443}
          height={844}
          sizes="90vw"
          className="absolute top-0 right-0 h-auto w-[90%] max-w-none"
          priority
        />
      </div>
      <SiteHeader />
      <main className="relative flex-1">
        <section className="px-6 pb-12 pt-16 text-center sm:pb-16 sm:pt-20">
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
            Careers
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-zinc-600">
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
