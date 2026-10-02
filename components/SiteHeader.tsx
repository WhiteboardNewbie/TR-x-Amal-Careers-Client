import Link from "next/link";

import { AmalMark } from "./AmalMark";

export function SiteHeader() {
  return (
    <header className="relative z-10 bg-amal-white">
      <div className="page-bar flex h-[var(--header-h)] items-center justify-between">
        <Link href="/" className="shrink-0" aria-label="Amal Academy Careers">
          <AmalMark />
        </Link>
        <Link
          href="/sign-in"
          className="inline-flex items-center rounded-full border border-amal-red px-5 py-2 text-[1.125rem] font-semibold tracking-[0.05em] text-amal-red transition-colors hover:bg-amal-red hover:text-amal-white"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}
