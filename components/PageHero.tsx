import Image from "next/image";

export function PageHero({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
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
          {title}
        </h1>
        <p className="mx-auto mt-2.5 max-w-[40rem] text-[clamp(1.2rem,calc(1.152rem+0.33vw),1.4375rem)] font-normal leading-[1.5] tracking-[-0.005em] text-zinc-500">
          {subtitle}
        </p>
      </div>
    </section>
  );
}
