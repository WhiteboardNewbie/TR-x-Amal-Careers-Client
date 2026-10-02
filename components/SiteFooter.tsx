import Link from "next/link";

import { AmalMark } from "./AmalMark";

const SOCIAL = [
  { href: "https://www.amalacademy.org/", label: "LinkedIn" },
  { href: "https://www.amalacademy.org/", label: "Instagram" },
  { href: "https://www.amalacademy.org/", label: "Facebook" },
];

const LEGAL = [
  { href: "https://www.amalacademy.org/", label: "Privacy Policy" },
  { href: "https://www.amalacademy.org/", label: "Terms & Conditions" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-100 text-base">
      <div className="page-container grid gap-10 py-[var(--section-y)] sm:grid-cols-3">
        <div className="space-y-3 text-zinc-500">
          <AmalMark />
          <p>
            Empowering Pakistan’s youth through developing soft skills and
            mindsets.
          </p>
          <p>+92 301 845 4761</p>
          <p>hello@amalacademy.org</p>
          <p>259-B Khizer Road, Upper Mall, Lahore.</p>
        </div>
        <div>
          <h2 className="mb-4 text-lg font-semibold tracking-[-0.02em] text-zinc-950">
            Social Media
          </h2>
          <ul className="space-y-1 text-zinc-500">
            {SOCIAL.map((item) => (
              <li key={item.label}>
                <a href={item.href} className="hover:text-zinc-950">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-4 text-lg font-semibold tracking-[-0.02em] text-zinc-950">
            Legal
          </h2>
          <ul className="space-y-1 text-zinc-500">
            {LEGAL.map((item) => (
              <li key={item.label}>
                <a href={item.href} className="hover:text-zinc-950">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="page-container flex items-center justify-between border-t border-zinc-100 py-4 text-zinc-500">
        <p>
          <b className="font-semibold text-zinc-700">
            Copyright ©2026 — Amal Academy
          </b>
        </p>
        <Link
          href="/"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-amal-red text-lg text-amal-white"
          aria-label="Back to top"
        >
          ↑
        </Link>
      </div>
    </footer>
  );
}
