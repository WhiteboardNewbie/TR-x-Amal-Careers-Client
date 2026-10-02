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
          className="text-[1.5rem] font-medium text-amal-red hover:underline"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}
