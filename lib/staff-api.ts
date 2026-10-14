import { queryString, request, sendJson } from "./api";
import type {
  ApplicantRow,
  ApplicationAssessment,
  ApplicationStage,
  ApplicationStageHrOverview,
  AssessmentInviteSettings,
  AssessmentSetting,
  BankQuestion,
  ClientApplicationReviewHr,
  Comment,
  Department,
  DepartmentManager,
  Employee,
  IdealProfile,
  IdealProfileMetricCatalogItem,
  IdealProfilePayload,
  OrgClient,
  OrgClientUser,
  OrgLevel,
  OrgTitle,
  Page,
  QuestionnairePrompt,
  ShareLink,
  Skill,
  StaffApplication,
  StaffApplicationCvSearchResult,
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
  status?: "all" | "active" | "closed" | "draft";
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
  skills_required?: number[];
  requested_by_client_users?: number[];
  is_draft?: boolean;
  is_active?: boolean;
}): Promise<StaffJobOpening> {
  return sendJson<StaffJobOpening>("/careers/job-openings/", "POST", body);
}

export function patchJobOpening(
  slug: string,
  body: Partial<{
    is_active: boolean;
    is_draft: boolean;
    title: string;
    description: string;
    location: string;
    department: number;
    work_type: string;
    employment_type: string;
    positions: number;
    experience_level: string;
    qualifications: string;
    skills_required: number[];
    requested_by_client_users: number[];
  }>,
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
  applied_from?: string;
  applied_to?: string;
  first_test_score_min?: string;
  first_test_score_max?: string;
  ai_relevance_score_min?: string;
  ai_relevance_score_max?: string;
  completed_first_test?: boolean;
  completed_video_test?: boolean;
  completed_general_questionnaire?: boolean;
}): Promise<Page<StaffApplication>> {
  return request<Page<StaffApplication>>(
    `/careers/job-applications/${queryString(params ?? {})}`,
  );
}

export function getStaffApplication(id: number): Promise<StaffApplication> {
  return request<StaffApplication>(`/careers/job-applications/${id}/`);
}

export function getPreScreeningCompleteCount(): Promise<{ count: number }> {
  return request<{ count: number }>(
    "/careers/job-applications/pre-screening-complete-count/",
  );
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
  search?: string;
  status?: string;
  job_opening?: string;
  application_status?: string;
  assigned_to?: number;
  created_from?: string;
  created_to?: string;
  scheduled_from?: string;
  scheduled_to?: string;
  applied_from?: string;
  applied_to?: string;
  first_test_score_min?: string;
  first_test_score_max?: string;
  ai_relevance_score_min?: string;
  ai_relevance_score_max?: string;
  completed_first_test?: boolean;
  completed_video_test?: boolean;
  completed_general_questionnaire?: boolean;
  ordering?: "created_at" | "-created_at";
}): Promise<Page<ApplicationStageHrOverview>> {
  return request<Page<ApplicationStageHrOverview>>(
    `/careers/stages/hr-overview/${queryString(params ?? {})}`,
  );
}

export function getClientApplicationReviews(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  job_opening?: string;
  application_status?: string;
  client_user?: number;
  created_from?: string;
  created_to?: string;
  applied_from?: string;
  applied_to?: string;
  first_test_score_min?: string;
  first_test_score_max?: string;
  ai_relevance_score_min?: string;
  ai_relevance_score_max?: string;
  completed_first_test?: boolean;
  completed_video_test?: boolean;
  completed_general_questionnaire?: boolean;
}): Promise<Page<ClientApplicationReviewHr>> {
  return request<Page<ClientApplicationReviewHr>>(
    `/careers/client-application-reviews/${queryString(params ?? {})}`,
  );
}

export function getAssignedStages(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  job_opening?: string;
  application_status?: string;
  created_from?: string;
  created_to?: string;
  scheduled_from?: string;
  scheduled_to?: string;
  applied_from?: string;
  applied_to?: string;
  first_test_score_min?: string;
  first_test_score_max?: string;
  ai_relevance_score_min?: string;
  ai_relevance_score_max?: string;
  completed_first_test?: boolean;
  completed_video_test?: boolean;
  completed_general_questionnaire?: boolean;
  ordering?: "created_at" | "-created_at";
}): Promise<Page<ApplicationStageHrOverview>> {
  return request<Page<ApplicationStageHrOverview>>(
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
  body?: {
    interview_feedback?: string;
    manager_feedback?: string;
    metric_scores?: Array<{ metric_id: number; raw_score: string | number }>;
  },
): Promise<ApplicationStage> {
  return sendJson<ApplicationStage>(
    `/careers/stages/${stageId}/complete/`,
    "POST",
    body ?? {},
  );
}

export function getScorecardMetrics(stageId: number): Promise<{
  ideal_profile_id: number | null;
  job_opening_slug: string;
  metrics: Array<{
    metric_id: number;
    key: string;
    label: string;
    description: string;
    client_weight: number;
  }>;
}> {
  return request(`/careers/stages/${stageId}/scorecard-metrics/`);
}

export function reassignStage(
  stageId: number,
  assigned_to: number,
): Promise<ApplicationStage> {
  return sendJson<ApplicationStage>(`/careers/stages/${stageId}/reassign/`, "PATCH", {
    assigned_to,
  });
}

export function rescindStage(stageId: number): Promise<void> {
  return sendJson<void>(`/careers/stages/${stageId}/`, "DELETE");
}

export function getDepartmentManagers(
  departmentId: number,
): Promise<DepartmentManager[]> {
  return request<DepartmentManager[]>(
    `/careers/departments/${departmentId}/managers/`,
  );
}

export function createIdealProfileTemplate(
  body: IdealProfilePayload,
): Promise<IdealProfile> {
  return sendJson<IdealProfile>("/careers/ideal-profiles/templates/", "POST", body);
}

export function createIdealProfileForRole(
  slug: string,
  body: IdealProfilePayload,
): Promise<IdealProfile> {
  return sendJson<IdealProfile>(
    `/careers/job-openings/${encodeURIComponent(slug)}/create-ideal-profile/`,
    "POST",
    body,
  );
}

export function getIdealProfileForRole(
  slug: string,
): Promise<IdealProfile | null> {
  return request<IdealProfile | null>(
    `/careers/job-openings/${encodeURIComponent(slug)}/ideal-profile/`,
  );
}

export function updateIdealProfileForRole(
  slug: string,
  body: Partial<IdealProfilePayload>,
): Promise<IdealProfile> {
  return sendJson<IdealProfile>(
    `/careers/job-openings/${encodeURIComponent(slug)}/ideal-profile/`,
    "PATCH",
    body,
  );
}

export function getIdealProfileMetricCatalog(): Promise<
  IdealProfileMetricCatalogItem[]
> {
  return request<
    IdealProfileMetricCatalogItem[] | Page<IdealProfileMetricCatalogItem>
  >("/careers/ideal-profiles/metrics-catalog/").then((data) =>
    Array.isArray(data) ? data : (data.results ?? []),
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

export type BankQuestionWrite = {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  is_active?: boolean;
  department_id?: number | null;
  domain?: string | null;
  difficulty?: string;
  skill_ids?: number[];
};

export function createBankQuestion(
  body: BankQuestionWrite,
): Promise<BankQuestion> {
  return sendJson<BankQuestion>("/questions/", "POST", body);
}

export function patchBankQuestion(
  id: number,
  body: Partial<BankQuestionWrite>,
): Promise<BankQuestion> {
  return sendJson<BankQuestion>(`/questions/${id}/`, "PATCH", body);
}

export function getVideoPrompts(): Promise<VideoPrompt[]> {
  return request<VideoPrompt[]>("/video-test/questions/");
}

export type VideoPromptWrite = {
  prompt: string;
  is_active?: boolean;
  question_order?: number;
  time_limit_seconds?: number;
  department_id?: number | null;
  domain?: string | null;
  difficulty?: string;
  skill_ids?: number[];
};

export function createVideoPrompt(
  body: VideoPromptWrite,
): Promise<VideoPrompt> {
  return sendJson<VideoPrompt>("/video-test/questions/", "POST", body);
}

export function patchVideoPrompt(
  id: number,
  body: Partial<VideoPromptWrite>,
): Promise<VideoPrompt> {
  return sendJson<VideoPrompt>(`/video-test/questions/${id}/`, "PATCH", body);
}

export function getQuestionnairePrompts(): Promise<QuestionnairePrompt[]> {
  return request<QuestionnairePrompt[]>("/general-questionnaire/questions/");
}

export function createQuestionnairePrompt(body: {
  question_text: string;
  question_order: number;
  is_active?: boolean;
}): Promise<QuestionnairePrompt> {
  return sendJson<QuestionnairePrompt>(
    "/general-questionnaire/questions/",
    "POST",
    body,
  );
}

export function patchQuestionnairePrompt(
  id: number,
  body: Partial<QuestionnairePrompt>,
): Promise<QuestionnairePrompt> {
  return sendJson<QuestionnairePrompt>(
    `/general-questionnaire/questions/${id}/`,
    "PATCH",
    body,
  );
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

export function getAssessmentInviteSettings(): Promise<AssessmentInviteSettings> {
  return request<AssessmentInviteSettings>("/assessment-invite-settings/");
}

export function patchAssessmentInviteSettings(
  body: Partial<AssessmentInviteSettings>,
): Promise<AssessmentInviteSettings> {
  return sendJson<AssessmentInviteSettings>(
    "/assessment-invite-settings/",
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
  source?: "general" | "video_test" | "general_questionnaire",
): Promise<Comment> {
  return sendJson<Comment>(
    `/careers/job-applications/${applicationId}/comments/`,
    "POST",
    source ? { text, source } : { text },
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

export async function downloadJobApplicationResume(
  applicationId: number,
): Promise<Blob> {
  const { API_URL, ApiError } = await import("./api");
  const { sessionToken } = await import("./session");
  const headers = new Headers();
  const token = sessionToken();
  if (token) {
    headers.set("Authorization", `Token ${token}`);
  }
  const response = await fetch(
    `${API_URL}/careers/job-applications/${applicationId}/resume/`,
    { headers },
  );
  if (!response.ok) {
    throw new ApiError(response.status, await response.text());
  }
  return response.blob();
}

export function runVideoEvaluation(applicationId: number): Promise<{
  video_test: {
    status: string;
    score_percentage: string | number | null;
    questions: {
      order: number;
      prompt: string;
      transcript: string;
      video?: string | null;
    }[];
  };
  video_evaluation: import("./types").VideoEvaluation | null;
}> {
  return sendJson(
    `/careers/job-applications/${applicationId}/run-video-evaluation/`,
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

export function searchResumes(params: {
  q: string;
  page?: number;
  page_size?: number;
  status?: string;
  job_opening?: string;
  applied_from?: string;
  applied_to?: string;
  first_test_score_min?: string;
  first_test_score_max?: string;
  ai_relevance_score_min?: string;
  ai_relevance_score_max?: string;
  completed_first_test?: boolean;
  completed_video_test?: boolean;
  completed_general_questionnaire?: boolean;
}): Promise<Page<StaffApplicationCvSearchResult>> {
  return request<Page<StaffApplicationCvSearchResult>>(
    `/careers/job-applications/cv-search/${queryString(params)}`,
  );
}

export function getShareLinks(params?: {
  page?: number;
  page_size?: number;
  job_application?: number | string;
  search?: string;
  is_active?: boolean;
}): Promise<Page<ShareLink>> {
  const page = params?.page ?? 1;
  const page_size = params?.page_size ?? 10;
  return request<Page<ShareLink>>(
    `/careers/application-share-links/${queryString({
      page,
      page_size,
      job_application: params?.job_application,
      search: params?.search,
      is_active:
        params?.is_active === undefined ? undefined : params.is_active ? "true" : "false",
    })}`,
  );
}

export function getShareLink(id: string): Promise<ShareLink> {
  return request<ShareLink>(`/careers/application-share-links/${id}/`);
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
  pageSize = 10,
): Promise<
  Page<{
    id: number;
    ip_address: string;
    host: string;
    user_agent: string;
    referer: string;
    origin: string;
    scheme: string;
    path: string;
    accessed_at: string;
  }>
> {
  return request(
    `/careers/application-share-links/${id}/logs/${queryString({ page, page_size: pageSize })}`,
  );
}

export function deactivateShareLink(id: string): Promise<ShareLink> {
  return sendJson<ShareLink>(
    `/careers/application-share-links/${id}/deactivate/`,
    "POST",
  );
}

export function getSkillsPage(): Promise<Page<Skill>> {
  return request<Page<Skill>>("/careers/skills/?page_size=150");
}

export function createSkill(name: string): Promise<Skill> {
  return sendJson<Skill>("/careers/skills/", "POST", { name });
}

export function getIdealProfileTemplates(): Promise<Page<IdealProfile>> {
  return request<Page<IdealProfile>>(
    "/careers/ideal-profiles/templates/?page_size=150",
  );
}

export function assignIdealProfileTemplate(
  slug: string,
  templateId: number,
): Promise<unknown> {
  return sendJson(
    `/careers/job-openings/${encodeURIComponent(slug)}/assign-ideal-profile-template/`,
    "POST",
    { template_id: templateId },
  );
}
