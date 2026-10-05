import { sessionToken } from "./session";
import type {
  ApplyFields,
  AuthToken,
  CreatedJobApplication,
  Department,
  JobOpening,
  Notice,
  Page,
} from "./types";

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001"
).replace(/\/$/, "");

export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

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

function firstString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  if (Array.isArray(value)) {
    return firstString(value[0]);
  }
  return null;
}

function messageFor(status: number, body: unknown): string {
  const asText = firstString(body);
  if (asText) {
    return asText;
  }
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const preferred =
      firstString(record.detail) ?? firstString(record.non_field_errors);
    if (preferred) {
      return preferred;
    }
    for (const value of Object.values(record)) {
      const message = firstString(value);
      if (message) {
        return message;
      }
    }
  }
  return `Request failed with ${status}`;
}

export async function request<T>(
  path: string,
  init?: RequestInit & { anonymous?: boolean },
): Promise<T> {
  const { anonymous, ...rest } = init ?? {};
  const headers = new Headers(rest.headers);
  const token = sessionToken();
  if (token && !anonymous && !headers.has("Authorization")) {
    headers.set("Authorization", `Token ${token}`);
  }
  const response = await fetch(`${API_URL}${path}`, { ...rest, headers });
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
  return request<JobOpening[] | Page<JobOpening>>(
    `/careers/job-openings/${suffix}`,
    { anonymous: true },
  ).then((data) => (Array.isArray(data) ? data : (data.results ?? [])));
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
  if (fields.cover_letter?.trim()) {
    data.set("cover_letter", fields.cover_letter.trim());
  }
  if (fields.notes?.trim()) {
    data.set("notes", fields.notes.trim());
  }
  return request<CreatedJobApplication>("/careers/job-applications/", {
    method: "POST",
    body: data,
  });
}

export function createAuthToken(fields: {
  username: string;
  password: string;
}): Promise<AuthToken> {
  return request<AuthToken>("/auth/api-token-auth/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: fields.username,
      password: fields.password,
    }),
  });
}

export function getNotifications(): Promise<Notice[]> {
  return request<Notice[]>("/notifications/");
}

export function sendJson<T>(
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  return request<T>(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function queryString(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    query.set(key, String(value));
  }
  const suffix = query.toString();
  return suffix ? `?${suffix}` : "";
}
