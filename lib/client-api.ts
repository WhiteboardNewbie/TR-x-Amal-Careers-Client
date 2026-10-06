import { API_URL, request, sendJson } from "./api";
import { sessionToken } from "./session";
import type {
  ClientApplicationRow,
  ClientRole,
  Comment,
  WrittenTestSection,
  VideoTestSection,
} from "./types";

export type ClientApplicationDetail = {
  id: number;
  status: string;
  applied_at?: string;
  applicant_name: string;
  applicant?: {
    name: string;
    email: string;
    city?: string;
    contact?: string;
  };
  role: {
    slug: string;
    title: string;
    location?: string;
    department_name?: string;
    work_type?: string;
    employment_type?: string;
  };
  review: { id: number; status: string };
  client_review_status?: "pending" | "approved" | "rejected";
  has_resume: boolean;
  cover_letter?: string;
  ai_relevance_score?: number | null;
  ai_relevance_rationale?: string | null;
  ai_relevance_analyzed_at?: string | null;
  stages: { id: number; name: string; status: string }[];
  comments: Comment[];
  first_test: WrittenTestSection | null;
  video_test: VideoTestSection | null;
  questionnaire: WrittenTestSection | null;
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

export function getClientApplicationComments(id: number): Promise<Comment[]> {
  return request(
    `/clients/client-user-careers/applications/${id}/comments/`,
  );
}

export function createClientApplicationComment(
  id: number,
  text: string,
): Promise<Comment> {
  return sendJson(
    `/clients/client-user-careers/applications/${id}/comments/`,
    "POST",
    { text },
  );
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

export async function fetchClientResumeBlob(id: number): Promise<Blob> {
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
  return response.blob();
}

export async function openClientResume(id: number): Promise<void> {
  const blob = await fetchClientResumeBlob(id);
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
}
