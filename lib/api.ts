import type {
  ApplyFields,
  CreatedJobApplication,
  Department,
  JobOpening,
} from "./types";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001"
).replace(/\/$/, "");

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(messageFor(status, body));
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function messageFor(status: number, body: unknown): string {
  if (typeof body === "string" && body.trim()) {
    return body;
  }
  if (body && typeof body === "object") {
    const detail = (body as { detail?: unknown }).detail;
    if (typeof detail === "string") {
      return detail;
    }
    if (Array.isArray(detail) && typeof detail[0] === "string") {
      return detail[0];
    }
  }
  return `Request failed with ${status}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);
  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  if (!response.ok) {
    throw new ApiError(response.status, body);
  }
  return body as T;
}

export function getDepartments(): Promise<Department[]> {
  return request<Department[]>("/careers/departments/");
}

export function getJobOpenings(params?: {
  department?: number | string;
  search?: string;
}): Promise<JobOpening[]> {
  const query = new URLSearchParams();
  if (params?.department != null && params.department !== "") {
    query.set("department", String(params.department));
  }
  const search = params?.search?.trim();
  if (search) {
    query.set("search", search);
  }
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request<JobOpening[]>(`/careers/job-openings/${suffix}`);
}

export function getJobOpening(slug: string): Promise<JobOpening> {
  return request<JobOpening>(
    `/careers/job-openings/${encodeURIComponent(slug)}/`,
  );
}

export function createJobApplication(
  fields: ApplyFields,
): Promise<CreatedJobApplication> {
  const data = new FormData();
  data.set("job_opening", fields.job_opening);
  data.set("applicant_name", fields.applicant_name);
  data.set("applicant_email", fields.applicant_email);
  data.set("applicant_city", fields.applicant_city);
  data.set("applicant_contact", fields.applicant_contact);
  data.set("resume", fields.resume);
  return request<CreatedJobApplication>("/careers/job-applications/", {
    method: "POST",
    body: data,
  });
}
