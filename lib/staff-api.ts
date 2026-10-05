import { queryString, request, sendJson } from "./api";
import type {
  ApplicantRow,
  ApplicationAssessment,
  ApplicationStage,
  AssessmentSetting,
  BankQuestion,
  Comment,
  Department,
  DepartmentManager,
  Employee,
  OrgClient,
  OrgClientUser,
  OrgLevel,
  OrgTitle,
  Page,
  ShareLink,
  Skill,
  StaffApplication,
  StaffJobOpening,
  VideoPrompt,
} from "./types";

export function getStaffJobOpenings(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  department?: number | string;
  is_draft?: boolean;
  is_active?: boolean;
}): Promise<Page<StaffJobOpening>> {
  return request<Page<StaffJobOpening>>(
    `/careers/job-openings/${queryString(params ?? {})}`,
  );
}

export function createJobOpening(body: {
  title: string;
  description: string;
  location: string;
  department: number;
  work_type?: string;
  employment_type?: string;
  positions?: number;
  experience_level?: string;
  qualifications?: string;
  is_draft?: boolean;
  is_active?: boolean;
}): Promise<StaffJobOpening> {
  return sendJson<StaffJobOpening>("/careers/job-openings/", "POST", body);
}

export function patchJobOpening(
  slug: string,
  body: Partial<{ is_active: boolean; is_draft: boolean }>,
): Promise<StaffJobOpening> {
  return sendJson<StaffJobOpening>(
    `/careers/job-openings/${encodeURIComponent(slug)}/`,
    "PATCH",
    body,
  );
}

export function getStaffApplications(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  job_opening?: string;
}): Promise<Page<StaffApplication>> {
  return request<Page<StaffApplication>>(
    `/careers/job-applications/${queryString(params ?? {})}`,
  );
}

export function getStaffApplication(id: number): Promise<StaffApplication> {
  return request<StaffApplication>(`/careers/job-applications/${id}/`);
}

export function updateApplicationStatus(
  id: number,
  status: string,
  extra?: Record<string, unknown>,
): Promise<StaffApplication> {
  return sendJson<StaffApplication>(
    `/careers/job-applications/${id}/update-status/`,
    "PUT",
    { status, ...extra },
  );
}

export function getHrStages(params?: {
  page?: number;
  page_size?: number;
}): Promise<Page<ApplicationStage>> {
  return request<Page<ApplicationStage>>(
    `/careers/stages/hr-overview/${queryString(params ?? {})}`,
  );
}

export function getAssignedStages(params?: {
  page?: number;
  page_size?: number;
}): Promise<Page<ApplicationStage>> {
  return request<Page<ApplicationStage>>(
    `/careers/stages/assigned-to-me/${queryString(params ?? {})}`,
  );
}

export function getApplicationStages(
  applicationId: number,
): Promise<Page<ApplicationStage>> {
  return request<Page<ApplicationStage>>(
    `/careers/job-applications/${applicationId}/stages/`,
  );
}

export function createStage(
  applicationId: number,
  body: { assigned_to: number; name?: string; hr_notes?: string },
): Promise<ApplicationStage> {
  return sendJson<ApplicationStage>(
    `/careers/job-applications/${applicationId}/stages/`,
    "POST",
    body,
  );
}

export function scheduleStage(
  stageId: number,
  body: {
    scheduled_at?: string | null;
    interview_type?: string;
    meeting_link?: string;
  },
): Promise<ApplicationStage> {
  return sendJson<ApplicationStage>(
    `/careers/stages/${stageId}/hr-schedule/`,
    "PATCH",
    body,
  );
}

export function setHrStageStatus(
  stageId: number,
  status: string,
): Promise<ApplicationStage> {
  return sendJson<ApplicationStage>(`/careers/stages/${stageId}/hr-status/`, "POST", {
    status,
  });
}

export function requestInterview(stageId: number): Promise<ApplicationStage> {
  return sendJson<ApplicationStage>(
    `/careers/stages/${stageId}/request-interview/`,
    "POST",
  );
}

export function setManagerStageStatus(
  stageId: number,
  status: string,
): Promise<ApplicationStage> {
  return sendJson<ApplicationStage>(
    `/careers/stages/${stageId}/manager-status/`,
    "POST",
    { status },
  );
}

export function completeStage(
  stageId: number,
  interview_feedback?: string,
): Promise<ApplicationStage> {
  return sendJson<ApplicationStage>(`/careers/stages/${stageId}/complete/`, "POST", {
    interview_feedback,
  });
}

export function getDepartmentManagers(
  departmentId: number,
): Promise<DepartmentManager[]> {
  return request<DepartmentManager[]>(
    `/careers/departments/${departmentId}/managers/`,
  );
}

export function createIdealProfileTemplate(body: {
  name: string;
  department_id?: number | null;
  title_id?: number | null;
}): Promise<unknown> {
  return sendJson("/careers/ideal-profiles/templates/", "POST", body);
}

export function createIdealProfileForRole(
  slug: string,
  body: { name: string; department_id?: number | null; title_id?: number | null },
): Promise<unknown> {
  return sendJson(
    `/careers/job-openings/${encodeURIComponent(slug)}/create-ideal-profile/`,
    "POST",
    body,
  );
}

export function getOrgDepartments(): Promise<Department[]> {
  return request<Department[]>("/organization-structure/departments/");
}

export function createOrgDepartment(name: string): Promise<Department> {
  return sendJson<Department>("/organization-structure/departments/", "POST", {
    name,
  });
}

export function getOrgLevels(): Promise<OrgLevel[]> {
  return request<OrgLevel[]>("/organization-structure/levels/");
}

export function createOrgLevel(body: {
  code: string;
  order: number;
  promotion_timeline?: string;
}): Promise<OrgLevel> {
  return sendJson<OrgLevel>("/organization-structure/levels/", "POST", body);
}

export function getOrgTitles(): Promise<OrgTitle[]> {
  return request<OrgTitle[]>("/organization-structure/titles/");
}

export function createOrgTitle(body: {
  name: string;
  level: number;
  department: number;
}): Promise<OrgTitle> {
  return sendJson<OrgTitle>("/organization-structure/titles/", "POST", body);
}

export function getEmployees(): Promise<Employee[]> {
  return request<Employee[]>("/employees/employees/");
}

export function createAuthUser(body: {
  username: string;
  password: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  groups?: string[];
}): Promise<{ id: number; username: string; email: string; groups: string[] }> {
  return sendJson("/auth/users/", "POST", body);
}

export function createEmployee(body: {
  first_name: string;
  last_name: string;
  user?: number | null;
  title?: number | null;
}): Promise<Employee> {
  return sendJson<Employee>("/employees/employees/", "POST", body);
}

export function getClients(): Promise<OrgClient[]> {
  return request<OrgClient[]>("/clients/clients/");
}

export function createClient(name: string): Promise<OrgClient> {
  return sendJson<OrgClient>("/clients/clients/", "POST", { name });
}

export function getClientUsers(): Promise<OrgClientUser[]> {
  return request<OrgClientUser[]>("/clients/client-users/");
}

export function createClientUser(body: {
  client: number;
  first_name: string;
  last_name: string;
  email: string;
}): Promise<OrgClientUser> {
  return sendJson<OrgClientUser>("/clients/client-users/", "POST", body);
}

export function getApplicants(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  min_applications?: number;
  job_opening?: string;
}): Promise<Page<ApplicantRow>> {
  return request<Page<ApplicantRow>>(
    `/careers/applicants/${queryString(params ?? {})}`,
  );
}

export function getApplicantJobs(
  id: number,
): Promise<StaffApplication[]> {
  return request<StaffApplication[]>(`/careers/applicants/${id}/jobs-applied/`);
}

export function updateApplicantNote(
  id: number,
  notes: string,
): Promise<{ notes: string }> {
  return sendJson<{ notes: string }>(
    `/careers/applicants/${id}/update-note/`,
    "PUT",
    { notes },
  );
}

export function getBankQuestions(): Promise<BankQuestion[]> {
  return request<BankQuestion[]>("/questions/");
}

export function createBankQuestion(body: {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  is_active?: boolean;
}): Promise<BankQuestion> {
  return sendJson<BankQuestion>("/questions/", "POST", body);
}

export function patchBankQuestion(
  id: number,
  body: Partial<BankQuestion>,
): Promise<BankQuestion> {
  return sendJson<BankQuestion>(`/questions/${id}/`, "PATCH", body);
}

export function getVideoPrompts(): Promise<VideoPrompt[]> {
  return request<VideoPrompt[]>("/video-test/questions/");
}

export function createVideoPrompt(prompt: string): Promise<VideoPrompt> {
  return sendJson<VideoPrompt>("/video-test/questions/", "POST", { prompt });
}

export function patchVideoPrompt(
  id: number,
  body: Partial<VideoPrompt>,
): Promise<VideoPrompt> {
  return sendJson<VideoPrompt>(`/video-test/questions/${id}/`, "PATCH", body);
}

export function getAssessmentSettings(): Promise<AssessmentSetting[]> {
  return request<AssessmentSetting[]>("/assessment-settings/");
}

export function patchAssessmentSetting(
  testType: string,
  body: Partial<AssessmentSetting>,
): Promise<AssessmentSetting> {
  return sendJson<AssessmentSetting>(
    `/assessment-settings/${encodeURIComponent(testType)}/`,
    "PATCH",
    body,
  );
}

export function getComments(applicationId: number): Promise<Page<Comment>> {
  return request<Page<Comment>>(
    `/careers/job-applications/${applicationId}/comments/`,
  );
}

export function addComment(
  applicationId: number,
  text: string,
): Promise<Comment> {
  return sendJson<Comment>(
    `/careers/job-applications/${applicationId}/comments/`,
    "POST",
    { text },
  );
}

export function sendAssessmentInvite(applicationId: number): Promise<{
  invite_token: string;
  expires_at: string;
  invite_url: string;
}> {
  return sendJson(`/careers/job-applications/${applicationId}/unified-test/`, "POST");
}

export function extendAssessment(
  applicationId: number,
  days: 3 | 5 | 7,
): Promise<{ invite_token: string; expires_at: string; invite_url: string }> {
  return sendJson(
    `/careers/job-applications/${applicationId}/extend-assessment-expiry/`,
    "POST",
    { days },
  );
}

export function scoreResume(applicationId: number): Promise<{
  ai_relevance_score: number;
  ai_relevance_rationale: string;
  ai_relevance_analyzed_at: string;
}> {
  return sendJson(
    `/careers/job-applications/${applicationId}/analyze-resume-relevance/`,
    "POST",
  );
}

export function handoffToClients(
  applicationId: number,
  client_users: number[],
): Promise<unknown> {
  return sendJson(
    `/careers/job-applications/${applicationId}/client-reviews/`,
    "POST",
    client_users,
  );
}

export function getClientReviews(
  applicationId: number,
): Promise<Page<{ id: number; client_user: number; status: string }>> {
  return request(
    `/careers/job-applications/${applicationId}/client-reviews/`,
  );
}

export function getTimeline(
  applicationId: number,
): Promise<{ type: string; date: string | null; label: string }[]> {
  return request(`/careers/job-applications/${applicationId}/timeline/`);
}

export function getAssessment(
  applicationId: number,
): Promise<ApplicationAssessment> {
  return request(`/careers/job-applications/${applicationId}/assessment/`);
}

export function searchResumes(
  q: string,
  page = 1,
): Promise<Page<StaffApplication>> {
  return request<Page<StaffApplication>>(
    `/careers/job-applications/cv-search/${queryString({ q, page, page_size: 10 })}`,
  );
}

export function getShareLinks(page = 1): Promise<Page<ShareLink>> {
  return request<Page<ShareLink>>(
    `/careers/application-share-links/${queryString({ page, page_size: 10 })}`,
  );
}

export function createShareLink(body: {
  job_application: number;
  comment?: string;
  expires_at?: string;
}): Promise<ShareLink> {
  return sendJson<ShareLink>("/careers/application-share-links/", "POST", body);
}

export function patchShareLink(
  id: string,
  body: { comment?: string; expires_at?: string | null },
): Promise<ShareLink> {
  return sendJson<ShareLink>(
    `/careers/application-share-links/${id}/`,
    "PATCH",
    body,
  );
}

export function getShareLinkLogs(
  id: string,
  page = 1,
): Promise<
  Page<{
    id: number;
    ip_address: string;
    host: string;
    user_agent: string;
    referer: string;
    accessed_at: string;
  }>
> {
  return request(
    `/careers/application-share-links/${id}/logs/${queryString({ page, page_size: 10 })}`,
  );
}

export function deactivateShareLink(id: string): Promise<ShareLink> {
  return sendJson<ShareLink>(
    `/careers/application-share-links/${id}/deactivate/`,
    "POST",
  );
}

export function getSkillsPage(): Promise<Page<Skill>> {
  return request<Page<Skill>>("/careers/skills/");
}
