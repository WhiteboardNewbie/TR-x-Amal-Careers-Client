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
};

export function labelFor(status: string): string {
  return STATUS_LABEL[status] ?? status;
}
