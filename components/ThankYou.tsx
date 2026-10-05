import Link from "next/link";

import { PageHero } from "./PageHero";

export function ThankYou() {
  return (
    <>
      <PageHero
        title="Thank you"
        subtitle="Your application has been submitted. Check your email for a confirmation."
      />
      <section className="flex flex-1 flex-col items-center px-6 pb-[var(--section-y)] text-center">
        <Link
          href="/"
          className="inline-flex items-center rounded-full bg-amal-red px-8 py-3 text-[1.125rem] font-semibold tracking-[0.05em] text-amal-white hover:opacity-90"
        >
          Back to Careers
        </Link>
      </section>
    </>
  );
}
