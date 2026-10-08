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

export function SearchIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" />
    </Icon>
  );
}

export function FilterIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M4 5h16l-6 7v5l-4 2v-7L4 5z" />
    </Icon>
  );
}

export function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  );
}

export function ChevronUpIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="m18 15-6-6-6 6" />
    </Icon>
  );
}

export function AwardIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="9" r="6" />
      <path d="M8.5 14.5 7 21l5-2 5 2-1.5-6.5" />
    </Icon>
  );
}

export function PlusIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function BuildingIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      <path d="M16 10h4v11H4" />
      <path d="M8 8h2M12 8h2M8 12h2M12 12h2M8 16h2M12 16h2" />
    </Icon>
  );
}

export function CheckIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="m5 12 4 4 10-10" />
    </Icon>
  );
}

export function XIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  );
}

export function EyeIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  );
}

export function ShareIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </Icon>
  );
}

export function MoreVerticalIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </Icon>
  );
}

export function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M14 4h6v6" />
      <path d="M10 14 20 4" />
      <path d="M20 14v6H4V4h6" />
    </Icon>
  );
}

export function DownloadIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 19h14" />
    </Icon>
  );
}

export function ImageIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m4 16 5-4 4 3 3-2 4 3" />
    </Icon>
  );
}

export function FileTextIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </Icon>
  );
}

export function FileSearchIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <circle cx="11" cy="14.5" r="2.5" />
      <path d="m13 16.5 1.8 1.8" />
    </Icon>
  );
}

export function VideoIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="m16 10 5-3v10l-5-3" />
    </Icon>
  );
}

export function PlayIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <polygon points="7 5 19 12 7 19" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function MessageSquareIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M4 5h16v12H8l-4 4z" />
    </Icon>
  );
}

export function LockIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Icon>
  );
}

export function SendIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="m4 12 16-8-6 16-2-6z" />
    </Icon>
  );
}

export function ClockIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v5l3 2" />
    </Icon>
  );
}

export function SparklesIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
      <path d="M19 14l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
    </Icon>
  );
}

export function UserPlusIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 19a6 6 0 0 1 12 0" />
      <path d="M19 8v6M16 11h6" />
    </Icon>
  );
}
