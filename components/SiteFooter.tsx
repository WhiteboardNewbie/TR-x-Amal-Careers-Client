import Image from "next/image";

import { AmalMark } from "./AmalMark";

const COMPANY = [
  { href: "https://www.amalacademy.org/about", label: "About" },
  { href: "https://www.amalacademy.org/impact", label: "Impact" },
  { href: "https://www.amalacademy.org/contact", label: "Contact" },
  { href: "https://www.amalacademy.org/faqs", label: "FAQs" },
];

const SOCIAL = [
  { href: "https://www.amalacademy.org/", label: "LinkedIn" },
  { href: "https://www.amalacademy.org/", label: "Instagram" },
  { href: "https://www.amalacademy.org/", label: "Facebook" },
];

const LEGAL = [
  { href: "https://www.amalacademy.org/", label: "Privacy Policy" },
  { href: "https://www.amalacademy.org/", label: "Terms & Conditions" },
];

function FooterLinks({
  title,
  items,
}: {
  title: string;
  items: { href: string; label: string }[];
}) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold tracking-[-0.02em] text-zinc-950">
        {title}
      </h2>
      <ul className="space-y-1 text-zinc-500">
        {items.map((item) => (
          <li key={item.label}>
            <a href={item.href} className="hover:text-zinc-950">
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative mt-auto overflow-hidden bg-amal-white text-base">
      <div
        className="pointer-events-none absolute top-0 left-0 w-full"
        aria-hidden
      >
        <Image
          src="/footer-wave.svg"
          alt=""
          width={1600}
          height={268}
          className="h-auto w-full"
          unoptimized
        />
      </div>
      <div className="page-container relative grid py-[var(--section-y)] md:grid-cols-12">
        <div className="space-y-3 text-zinc-500 md:col-span-4 lg:col-span-3">
          <AmalMark />
          <p>
            Empowering Pakistan’s youth through developing soft skills and
            mindsets.
          </p>
          <p>+92 301 845 4761</p>
          <p>hello@amalacademy.org</p>
          <p>259-B Khizer Road, Upper Mall, Lahore.</p>
        </div>
        <div className="mt-12 grid gap-10 sm:grid-cols-3 md:col-span-7 md:col-start-6 md:mt-0 lg:col-span-7 lg:col-start-6">
          <FooterLinks title="Company" items={COMPANY} />
          <FooterLinks title="Social Media" items={SOCIAL} />
          <FooterLinks title="Legal" items={LEGAL} />
        </div>
      </div>
      <div className="page-container relative grid items-center py-4 text-zinc-500 md:grid-cols-12">
        <p className="md:col-span-4 lg:col-span-3">
          <b className="font-semibold text-zinc-700">
            Copyright ©2026 — Amal Academy
          </b>
        </p>
        <div className="mt-4 flex justify-end md:col-span-7 md:col-start-6 md:mt-0 lg:col-span-7 lg:col-start-6">
          <a
            href="#top"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-amal-red text-amal-white"
            aria-label="Back to top"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M12 19V5M12 5l-7 7M12 5l7 7"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
