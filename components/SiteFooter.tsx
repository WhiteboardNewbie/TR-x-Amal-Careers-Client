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
    <footer className="mt-auto border-t border-zinc-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-3">
        <div className="space-y-3 text-sm text-zinc-600">
          <AmalMark variant="color" />
          <p>
            Empowering Pakistan’s youth through developing soft skills and
            mindsets.
          </p>
          <p>+92 301 845 4761</p>
          <p>hello@amalacademy.org</p>
          <p>259-B Khizer Road, Upper Mall, Lahore.</p>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-zinc-950">
            Social Media
          </h2>
          <ul className="space-y-2 text-sm text-zinc-600">
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
          <h2 className="mb-3 text-sm font-semibold text-zinc-950">Legal</h2>
          <ul className="space-y-2 text-sm text-zinc-600">
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
      <div className="mx-auto flex max-w-6xl items-center justify-between border-t border-zinc-100 px-6 py-4 text-sm text-zinc-500">
        <p>Copyright ©2026 — Amal Academy</p>
        <Link
          href="/"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF3333] text-white"
          aria-label="Back to top"
        >
          ↑
        </Link>
      </div>
    </footer>
  );
}
