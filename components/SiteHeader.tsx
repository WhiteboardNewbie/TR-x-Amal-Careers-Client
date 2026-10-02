import Link from "next/link";

import { AmalMark } from "./AmalMark";

export function SiteHeader() {
  return (
    <header>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" aria-label="Amal Academy Careers">
          <AmalMark />
        </Link>
        <Link
          href="/sign-in"
          className="text-sm font-medium text-amal-red hover:underline"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}
