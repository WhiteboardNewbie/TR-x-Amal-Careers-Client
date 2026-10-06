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
  new: "bg-slate-400",
  "in-review": "bg-amber-500",
  "manager-review": "bg-violet-500",
  "client-review": "bg-violet-700",
  interviewed: "bg-amal-blue",
  shortlisted: "bg-teal-500",
  offered: "bg-emerald-500",
  rejected: "bg-amal-red",
  "parking-lot": "bg-slate-400",
};

export const STATUS_BADGE: Record<string, string> = {
  new: "bg-slate-100 text-slate-700",
  "in-review": "bg-amber-100 text-amber-800",
  "manager-review": "bg-violet-100 text-violet-700",
  "client-review": "bg-violet-200 text-violet-800",
  interviewed: "bg-amal-blue/15 text-amal-blue",
  shortlisted: "bg-teal-100 text-teal-800",
  offered: "bg-emerald-100 text-emerald-700",
  rejected: "bg-amal-red/15 text-amal-red",
  "parking-lot": "bg-slate-100 text-slate-600",
};

export const STATUS_TONE: Record<JobApplicationStatus, string> = {
  new: "bg-slate-100 text-slate-700",
  "in-review": "bg-amal-blue/15 text-amal-blue",
  "manager-review": "bg-violet-100 text-violet-700",
  "client-review": "bg-violet-200 text-violet-800",
  interviewed: "bg-amber-100 text-amber-700",
  shortlisted: "bg-teal-100 text-teal-800",
  offered: "bg-emerald-100 text-emerald-700",
  rejected: "bg-amal-red/15 text-amal-red",
  "parking-lot": "bg-slate-200 text-slate-700",
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

export function stageStatusBadge(status: string): {
  label: string;
  className: string;
} {
  if (status === "completed") {
    return { label: "Completed", className: "bg-emerald-100 text-emerald-800" };
  }
  if (status === "interview") {
    return { label: "Interview", className: "bg-teal-100 text-teal-800" };
  }
  if (status === "requested_interview") {
    return {
      label: "Requested Interview",
      className: "bg-amber-100 text-amber-800",
    };
  }
  if (status === "rejected") {
    return { label: "Rejected", className: "bg-amal-red/15 text-amal-red" };
  }
  return { label: "Pending", className: "bg-amal-blue/15 text-amal-blue" };
}
