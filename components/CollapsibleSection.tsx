"use client";

import { useId, useState, type ReactNode } from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
} from "@/components/staff/icons";

function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function CollapsibleSection({
  title,
  subtitle,
  headerAction,
  titleAddon,
  icon,
  className = "overflow-hidden rounded-2xl border border-black/10 bg-amal-white",
  headerClassName = "border-b border-black/5 px-5 py-4",
  titleClassName = "text-lg font-bold text-zinc-900",
  subtitleClassName = "mt-1 text-sm text-zinc-500",
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  headerAction?: ReactNode;
  titleAddon?: ReactNode;
  icon?: ReactNode;
  className?: string;
  headerClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section className={className}>
      <div className={cn("flex items-center gap-3", headerClassName)}>
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((current) => !current)}
        >
          {icon}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={titleClassName}>{title}</h2>
              {titleAddon}
            </div>
            {subtitle ? (
              <div className={subtitleClassName}>{subtitle}</div>
            ) : null}
          </div>
          {open ? (
            <ChevronUpIcon className="h-6 w-6 shrink-0 text-zinc-500" />
          ) : (
            <ChevronDownIcon className="h-6 w-6 shrink-0 text-zinc-500" />
          )}
        </button>
        {headerAction ? (
          <div
            className="shrink-0 self-center"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            {headerAction}
          </div>
        ) : null}
      </div>
      {open ? <div id={panelId}>{children}</div> : null}
    </section>
  );
}
