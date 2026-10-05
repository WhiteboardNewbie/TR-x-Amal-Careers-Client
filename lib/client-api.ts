import { API_URL, request, sendJson } from "./api";
import { sessionToken } from "./session";
import type { ClientApplicationRow, ClientRole } from "./types";

export type ClientApplicationDetail = {
  id: number;
  status: string;
  applicant_name: string;
  role: { slug: string; title: string };
  review: { id: number; status: string };
  has_resume: boolean;
  stages: { id: number; name: string; status: string }[];
  comments: { id: number; text: string }[];
  first_test: { status: string; score_percentage: string | number | null } | null;
  video_test: { status: string; score_percentage: string | number | null } | null;
  questionnaire: {
    status: string;
    score_percentage: string | number | null;
  } | null;
};

export function getClientRoles(): Promise<ClientRole[]> {
  return request("/clients/client-user-careers/job-openings/");
}

export function getClientRoleApplications(
  slug: string,
): Promise<ClientApplicationRow[]> {
  return request(
    `/clients/client-user-careers/job-openings/${encodeURIComponent(slug)}/applications/`,
  );
}

export function getClientApplication(
  id: number,
): Promise<ClientApplicationDetail> {
  return request(`/clients/client-user-careers/applications/${id}/`);
}

export function decideClientApplication(
  id: number,
  decision: "approved" | "rejected",
): Promise<{ id: number; status: string }> {
  return sendJson(
    `/clients/client-user-careers/applications/${id}/client-decision/`,
    "POST",
    { decision },
  );
}

export async function openClientResume(id: number): Promise<void> {
  const headers = new Headers();
  const token = sessionToken();
  if (token) {
    headers.set("Authorization", `Token ${token}`);
  }
  const response = await fetch(
    `${API_URL}/clients/client-user-careers/applications/${id}/resume/`,
    { headers },
  );
  if (!response.ok) {
    throw new Error("Resume is not available.");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
}
