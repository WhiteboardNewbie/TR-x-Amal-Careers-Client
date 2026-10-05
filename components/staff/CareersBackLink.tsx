"use client";

import type { MouseEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { isModifiedClick } from "@/lib/is-modified-click";

export function CareersBackLink({
  href = "/staff",
  className,
  children,
}: {
  href?: string;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (isModifiedClick(event)) {
      return;
    }
    event.preventDefault();
    router.push(href);
  }

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
