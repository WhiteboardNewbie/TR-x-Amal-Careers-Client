"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AmalMark } from "@/components/AmalMark";
import { NoticeBell } from "@/components/NoticeBell";
import { preventFocusScroll } from "@/lib/prevent-focus-scroll";
import { clearSession } from "@/lib/session";
import type { AuthSession } from "@/lib/types";

type LinkItem = { href: string; label: string };

function homeFor(landing: AuthSession["landing"]): LinkItem {
  if (landing === "reviews") {
    return { href: "/reviews", label: "Careers" };
  }
  if (landing === "client") {
    return { href: "/client", label: "Careers" };
  }
  return { href: "/staff", label: "Careers" };
}

function linksFor(session: AuthSession): LinkItem[] {
  if (session.landing !== "staff") {
    return [];
  }
  return [
    { href: "/staff/organization", label: "Organizational Configuration" },
    { href: "/staff/questions", label: "Assessment database" },
  ];
}

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav({ session }: { session: AuthSession }) {
  const pathname = usePathname();
  const router = useRouter();
  const home = homeFor(session.landing);
  const links = linksFor(session);

  function signOut() {
    clearSession();
    router.replace("/");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-black/10 bg-amal-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1600px] min-w-0 items-center justify-between gap-2 px-3 md:gap-3 md:px-4">
        <Link
          href={home.href}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 overflow-hidden hover:opacity-90 md:min-w-[220px] md:flex-none md:gap-4 md:overflow-visible"
        >
          <AmalMark className="h-8 w-auto max-w-full shrink-0 bg-transparent" />
          <span className="hidden h-6 w-px shrink-0 bg-black/15 md:block" />
          <span className="hidden shrink-0 text-lg font-bold tracking-tight text-zinc-500 md:inline">
            {home.label}
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onMouseDown={preventFocusScroll}
              className={`rounded-md px-3 py-2 text-sm font-bold outline-none transition-colors focus-visible:outline-none ${
                isActive(pathname, link.href)
                  ? "bg-amal-sheet text-amal-red"
                  : "text-zinc-500 hover:bg-amal-sheet hover:text-amal-ink"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center justify-end gap-2 md:min-w-[220px] md:gap-3">
          <NoticeBell />
          <details className="relative">
            <summary
              className="flex h-9 w-9 cursor-pointer list-none items-center justify-center overflow-hidden rounded-full border border-black/15 bg-amal-sheet text-sm font-semibold text-zinc-600 hover:bg-zinc-200 md:h-8 md:w-8"
              aria-label="Account menu"
            >
              {session.username.slice(0, 1).toUpperCase()}
            </summary>
            <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-lg border border-black/10 bg-amal-white shadow-xl">
              <p className="truncate border-b border-black/5 bg-amal-sheet/50 px-3 py-2 text-sm font-bold text-amal-ink">
                {session.username}
              </p>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm font-medium text-amal-ink hover:bg-amal-sheet"
                onClick={signOut}
              >
                Sign out
              </button>
            </div>
          </details>
        </div>
      </div>
      <nav className="flex gap-2 overflow-auto border-t border-black/5 px-3 py-2 md:hidden">
        <Link
          href={home.href}
          onMouseDown={preventFocusScroll}
          className={`rounded-md px-3 py-2 text-sm font-bold outline-none focus-visible:outline-none ${
            pathname === home.href
              ? "bg-amal-sheet text-amal-red"
              : "text-zinc-500 hover:bg-amal-sheet hover:text-amal-ink"
          }`}
        >
          {home.label}
        </Link>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onMouseDown={preventFocusScroll}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-bold outline-none focus-visible:outline-none ${
              isActive(pathname, link.href)
                ? "bg-amal-sheet text-amal-red"
                : "text-zinc-500 hover:bg-amal-sheet hover:text-amal-ink"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
