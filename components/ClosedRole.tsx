import Link from "next/link";

export const CLOSED =
  "This job opening is unavailable or no longer accepting applications.";

export function ClosedRole() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-6 py-[var(--section-y)] text-center">
      <p className="max-w-xl text-[clamp(1.2rem,calc(1.152rem+0.33vw),1.4375rem)] text-zinc-500">
        {CLOSED}
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center rounded-full bg-amal-red px-8 py-3 text-[1.125rem] font-semibold tracking-[0.05em] text-amal-white hover:opacity-90"
      >
        Back to Careers
      </Link>
    </section>
  );
}
