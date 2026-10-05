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
    <header className="sticky top-0 z-20 border-b border-black/10 bg-amal-white">
      <div className="page-bar flex min-h-16 items-center justify-between gap-6 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-8">
          <Link href={links[0]?.href ?? "/"} className="shrink-0">
            <AmalMark className="h-auto w-36 max-w-full bg-transparent" />
          </Link>
          <nav className="hidden min-w-0 items-center gap-6 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap text-sm font-semibold ${
                  isActive(pathname, link.href)
                    ? "text-amal-red"
                    : "text-amal-ink hover:text-amal-red"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <NoticeBell />
          <details className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-amal-ink hover:bg-amal-sheet">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amal-red text-xs font-bold text-amal-white">
                {session.username.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden max-w-32 truncate sm:inline">
                {session.username}
              </span>
            </summary>
            <div className="absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-xl border border-black/10 bg-amal-white py-1 shadow-lg">
              <p className="px-3 py-2 text-xs text-zinc-500 sm:hidden">
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
      <nav className="page-bar flex gap-4 overflow-auto border-t border-black/5 py-2 md:hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap text-sm font-semibold ${
              isActive(pathname, link.href)
                ? "text-amal-red"
                : "text-amal-ink hover:text-amal-red"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
