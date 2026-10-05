"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AmalMark } from "@/components/AmalMark";
import { NoticeBell } from "@/components/NoticeBell";
import { clearSession } from "@/lib/session";
import type { AuthSession } from "@/lib/types";

type LinkItem = { href: string; label: string };

function linksFor(landing: AuthSession["landing"]): LinkItem[] {
  if (landing === "staff") {
    return [
      { href: "/staff", label: "Careers" },
      { href: "/staff/organization", label: "Organizational Configuration" },
      { href: "/staff/questions", label: "Assessment database" },
    ];
  }
  if (landing === "reviews") {
    return [{ href: "/reviews", label: "Reviews" }];
  }
  if (landing === "client") {
    return [{ href: "/client", label: "Hiring" }];
  }
  return [];
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/staff") {
    return pathname === "/staff";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav({ session }: { session: AuthSession }) {
  const pathname = usePathname();
  const router = useRouter();
  const links = linksFor(session.landing);

  function signOut() {
    clearSession();
    router.replace("/");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-black/10 bg-amal-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1600px] min-w-0 items-center justify-between gap-3 px-[var(--page-gutter)]">
        <Link
          href={links[0]?.href ?? "/"}
          className="flex min-w-0 shrink-0 items-center md:min-w-[220px]"
        >
          <AmalMark className="h-auto w-28 max-w-full bg-transparent" />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap text-sm font-bold ${
                isActive(pathname, link.href)
                  ? "text-amal-red"
                  : "text-zinc-500 hover:text-amal-ink"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center justify-end gap-2 md:min-w-[220px]">
          <NoticeBell />
          <details className="relative">
            <summary
              className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-full bg-amal-red text-xs font-bold text-amal-white"
              aria-label="Account menu"
            >
              {session.username.slice(0, 1).toUpperCase()}
            </summary>
            <div className="absolute right-0 z-30 mt-2 w-48 overflow-hidden rounded-lg border border-black/10 bg-amal-white shadow-lg">
              <p className="truncate border-b border-black/5 bg-amal-sheet px-3 py-2 text-sm font-semibold text-amal-ink">
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
      <nav className="flex gap-4 overflow-auto border-t border-black/5 px-[var(--page-gutter)] py-2 md:hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap text-sm font-bold ${
              isActive(pathname, link.href)
                ? "text-amal-red"
                : "text-zinc-500 hover:text-amal-ink"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
