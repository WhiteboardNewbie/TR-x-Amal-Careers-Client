import Image from "next/image";
import type { ReactNode } from "react";

import { AmalMark } from "./AmalMark";

const COMPANY = [
  { href: "https://www.amalacademy.org/about", label: "About" },
  { href: "https://www.amalacademy.org/impact", label: "Impact" },
  { href: "https://www.amalacademy.org/contact", label: "Contact" },
  { href: "https://www.amalacademy.org/faqs", label: "FAQs" },
];

const SOCIAL = [
  {
    href: "https://www.linkedin.com/school/amalacademy/",
    label: "LinkedIn",
    icon: LinkedInIcon,
  },
  {
    href: "https://www.instagram.com/amalacademy/",
    label: "Instagram",
    icon: InstagramIcon,
  },
  {
    href: "https://www.facebook.com/amalacademy.org/",
    label: "Facebook",
    icon: FacebookIcon,
  },
];

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden fill="currentColor">
      <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.877 1.232-.877.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden fill="currentColor">
      <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.844.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.844-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 1 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden fill="currentColor">
      <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951" />
    </svg>
  );
}

const LEGAL = [
  { href: "https://www.amalacademy.org/", label: "Privacy Policy" },
  { href: "https://www.amalacademy.org/", label: "Terms & Conditions" },
];

function FooterLinks({
  title,
  items,
}: {
  title: string;
  items: {
    href: string;
    label: string;
    icon?: () => ReactNode;
  }[];
}) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold tracking-[-0.02em] text-zinc-950">
        {title}
      </h2>
      <ul className="space-y-1 text-zinc-500">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.label}>
              <a
                href={item.href}
                className="inline-flex items-center gap-2 hover:text-zinc-950"
                rel={Icon ? "noopener noreferrer" : undefined}
                target={Icon ? "_blank" : undefined}
              >
                {Icon ? <Icon /> : null}
                {item.label}
              </a>
            </li>
          );
        })}
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
