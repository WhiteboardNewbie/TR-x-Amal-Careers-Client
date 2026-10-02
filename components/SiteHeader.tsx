import Link from "next/link";

import { AmalMark } from "./AmalMark";

export function SiteHeader() {
  return (
    <header className="bg-[#334CFF]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" aria-label="Amal Academy Careers">
          <AmalMark variant="white" />
        </Link>
        <Link
          href="/sign-in"
          className="text-sm font-medium text-white hover:underline"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}
