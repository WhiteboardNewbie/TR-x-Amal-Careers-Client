import Link from "next/link";

import { AmalMark } from "./AmalMark";

export function SiteHeader() {
  return (
    <header className="relative z-10 bg-amal-white/95 shadow-[0_0_50px_rgba(0,0,0,0.07)]">
      <div className="page-container flex h-[var(--header-h)] items-center justify-between">
        <Link href="/" aria-label="Amal Academy Careers">
          <AmalMark />
        </Link>
        <Link
          href="/sign-in"
          className="text-[17px] font-medium text-amal-red hover:underline"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}
