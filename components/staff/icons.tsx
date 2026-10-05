function Icon({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-4 w-4"}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </Icon>
  );
}

export function UserIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19a7 7 0 0 1 14 0" />
    </Icon>
  );
}

export function UsersIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19a6 6 0 0 1 12 0" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M16 19a5 5 0 0 1 5 0" />
    </Icon>
  );
}

export function ClipboardIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <rect x="6" y="4" width="12" height="16" rx="2" />
      <path d="M9 4.5h6v3H9z" />
      <path d="M9 12h6M9 16h4" />
    </Icon>
  );
}

export function ListIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" />
    </Icon>
  );
}

export function ChecksIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="m4 7 2 2 4-4" />
      <path d="m4 17 2 2 4-4" />
      <path d="M14 8h7M14 18h7" />
    </Icon>
  );
}

export function CalendarIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 11h18" />
    </Icon>
  );
}

export function TargetIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" />
    </Icon>
  );
}

export function ChartIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
    </Icon>
  );
}

export function MailIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </Icon>
  );
}

export function MapPinIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </Icon>
  );
}

export function PhoneIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M6.5 3.5h3l1.5 3.5-2 1.5a12 12 0 0 0 6.5 6.5l1.5-2 3.5 1.5v3c0 1-1 2-2.5 2C9.5 21 3 14.5 3 6c0-1.5 1-2.5 2.5-2.5z" />
    </Icon>
  );
}
