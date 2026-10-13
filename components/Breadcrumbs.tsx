"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CareersBackLink } from "@/components/staff/CareersBackLink";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumbs({
  items,
  linkAs = "next",
  className = "",
}: {
  items: BreadcrumbItem[];
  /** Staff nested pages use CareersBackLink so hub return restore still runs. */
  linkAs?: "next" | "careers";
  className?: string;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={`text-sm font-semibold ${className}`.trim()}
    >
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const showLink = Boolean(item.href) && !isLast;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 ? (
                <span className="text-zinc-400" aria-hidden>
                  ›
                </span>
              ) : null}
              {showLink && item.href ? (
                <CrumbLink href={item.href} linkAs={linkAs}>
                  {item.label}
                </CrumbLink>
              ) : (
                <span
                  className={isLast ? "text-zinc-500" : "text-amal-red"}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function CrumbLink({
  href,
  linkAs,
  children,
}: {
  href: string;
  linkAs: "next" | "careers";
  children: ReactNode;
}) {
  const className = "text-amal-red hover:underline";
  if (linkAs === "careers") {
    return (
      <CareersBackLink href={href} className={className}>
        {children}
      </CareersBackLink>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
