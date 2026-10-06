import type { AuthSession } from "./types";

export const PERM = {
  changeJobOpening: "careers.change_jobopening",
  addJobOpening: "careers.add_jobopening",
  addJobApplication: "careers.add_jobapplication",
  viewApplicant: "careers.view_applicant",
  viewJobApplication: "careers.view_jobapplication",
  viewApplicationStage: "careers.view_applicationstage",
  viewMyClientCareers: "clients.view_my_client_careers",
} as const;

export function can(
  session: AuthSession | null | undefined,
  perm: string,
): boolean {
  return Boolean(session?.permissions?.includes(perm));
}

export function canAny(
  session: AuthSession | null | undefined,
  perms: readonly string[],
): boolean {
  return perms.some((perm) => can(session, perm));
}
