import type { JobApplicationStatus } from "./types";

export const APPLICATION_STATUSES: JobApplicationStatus[] = [
  "new",
  "in-review",
  "manager-review",
  "client-review",
  "interviewed",
  "shortlisted",
  "offered",
  "rejected",
  "parking-lot",
];

export const FUNNEL_STATUSES: JobApplicationStatus[] = [
  "new",
  "in-review",
  "manager-review",
  "client-review",
  "interviewed",
  "shortlisted",
  "offered",
];

export const TERMINAL_STATUSES: JobApplicationStatus[] = [
  "rejected",
  "parking-lot",
];

export const STATUS_BAR_FILL: Record<string, string> = {
  new: "bg-zinc-400",
  "in-review": "bg-zinc-500",
  "manager-review": "bg-amal-ink",
  "client-review": "bg-amal-ink/80",
  interviewed: "bg-amal-red/70",
  shortlisted: "bg-amal-red",
  offered: "bg-amal-red",
  rejected: "bg-zinc-600",
  "parking-lot": "bg-zinc-300",
};

export const STATUS_BADGE: Record<string, string> = {
  new: "bg-amal-sheet text-zinc-700",
  "in-review": "bg-zinc-100 text-zinc-700",
  "manager-review": "bg-amal-ink/10 text-amal-ink",
  "client-review": "bg-amal-ink/15 text-amal-ink",
  interviewed: "bg-amal-red/10 text-amal-red",
  shortlisted: "bg-amal-red/15 text-amal-red",
  offered: "bg-amal-red/20 text-amal-red",
  rejected: "bg-zinc-200 text-zinc-700",
  "parking-lot": "bg-amal-sheet text-zinc-600",
};

export const STATUS_TONE: Record<JobApplicationStatus, string> = {
  new: "bg-zinc-100 text-zinc-700",
  "in-review": "bg-zinc-200 text-zinc-800",
  "manager-review": "bg-amal-ink/10 text-amal-ink",
  "client-review": "bg-amal-ink/15 text-amal-ink",
  interviewed: "bg-amber-100 text-amber-800",
  shortlisted: "bg-emerald-100 text-emerald-800",
  offered: "bg-emerald-200 text-emerald-900",
  rejected: "bg-amal-red/15 text-amal-red",
  "parking-lot": "bg-zinc-200 text-zinc-700",
};

export const STATUS_LABEL: Record<string, string> = {
  new: "New",
  "in-review": "In Review",
  "manager-review": "Manager Review",
  "client-review": "Client Review",
  interviewed: "Interviewed",
  shortlisted: "Shortlisted",
  offered: "Offered",
  rejected: "Rejected",
  "parking-lot": "Parking Lot",
  pending: "Pending",
  requested_interview: "Interview requested",
  interview: "Interview",
  completed: "Completed",
  approved: "Approved",
  in_progress: "In Progress",
  expired: "Expired",
};

export function labelFor(status: string): string {
  return STATUS_LABEL[status] ?? status;
}
