export type Department = {
  id: number;
  name: string;
};

export type Skill = {
  id: number;
  name: string;
};

export type JobOpeningAnalytics = {
  total_applications: number;
  by_status: Record<string, number>;
  assessments: {
    first_test_completed: number;
    video_completed: number;
    questionnaire_completed: number;
    all_three_complete: number;
  };
  pipeline: Record<string, number>;
  averages: {
    first_test_score: number | null;
    manager_overall: number | null;
  };
  days_open: number | null;
};

export type JobOpening = {
  id: number;
  title: string;
  slug: string;
  description: string;
  location: string;
  positions: number;
  department: number;
  department_name: string;
  experience_level: string;
  work_type: string;
  employment_type: string;
  skills: Skill[];
  qualifications: string;
  is_active: boolean;
  is_draft: boolean;
  application_count?: number;
  analytics?: JobOpeningAnalytics;
  client_users?: { id: number; first_name: string; last_name: string; email: string }[];
};

export type Applicant = {
  id: number;
  name: string;
  email: string;
  city: string;
  contact: string;
  notes: string;
};

export type CreatedJobApplication = {
  id: number;
  job_opening: string;
  job_opening_name: string;
  applicant: Applicant;
  resume: string;
  cover_letter: string;
  notes: string;
  status: string;
  applied_at: string;
};

export type ApplyFields = {
  job_opening: string;
  applicant_name: string;
  applicant_email: string;
  applicant_city: string;
  applicant_contact: string;
  resume: File;
  cover_letter?: string;
  notes?: string;
};

export type AuthLanding = "staff" | "reviews" | "client" | "";

export type AuthToken = {
  token: string;
  permissions: string[];
  is_manager: boolean;
  is_clientuser: boolean;
  is_admin: boolean;
  is_hiring_staff: boolean;
  landing: AuthLanding;
};

export type AuthSession = {
  token: string;
  username: string;
  landing: AuthLanding;
  is_hiring_staff: boolean;
  is_clientuser: boolean;
  permissions: string[];
};

export type Notice = {
  id: number;
  title: string;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
};

export type Page<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type JobApplicationStatus =
  | "new"
  | "in-review"
  | "manager-review"
  | "client-review"
  | "shortlisted"
  | "interviewed"
  | "offered"
  | "rejected"
  | "parking-lot";

export type StaffJobOpening = JobOpening & {
  client_users?: { id: number; first_name: string; last_name: string; email: string }[];
};

export type AssessmentSessionSummary = {
  test_token: string;
  status: string;
  effective_status?: string;
  expires_at?: string | null;
  score_percentage?: string | number | null;
};

export type StaffApplication = {
  id: number;
  job_opening: string;
  job_opening_name: string;
  applicant: Applicant;
  resume: string;
  cover_letter?: string;
  notes?: string;
  status: JobApplicationStatus;
  applied_at: string;
  test_session?: AssessmentSessionSummary | null;
  video_test_session?: AssessmentSessionSummary | null;
  general_questionnaire_session?: AssessmentSessionSummary | null;
  ai_relevance_score?: number | null;
  manager_score_avg?: string | number | null;
};

export type CvMatchType = "exact" | "starts_with" | "ends_with" | "contains";

export type JobApplicationCvMatch = {
  term: string;
  match_type: CvMatchType | string;
  snippet: string;
};

export type StaffApplicationCvSearchResult = StaffApplication & {
  cv_matches: JobApplicationCvMatch[];
  match_score: number;
};

export type ApplicationStage = {
  id: number;
  job_application: number;
  order: number;
  name: string;
  assigned_to: number;
  assigned_by: number | null;
  status: string;
  hr_notes: string;
  created_at: string;
  completed_at: string | null;
  interview_type: string;
  scheduled_at: string | null;
  meeting_link: string;
  interview_feedback: string;
};

export type OrgTitle = {
  id: number;
  name: string;
  level: { id: number; code: string; order: number };
  department: { id: number; name: string };
};

export type Employee = {
  id: number;
  user: number | null;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  title: number | null;
  reports_to: number | null;
  left_at: string | null;
};

export type DepartmentManager = {
  id: number;
  full_name: string;
  email: string;
};

export type ApplicantRow = Applicant & {
  application_count: number;
  last_applied_at: string | null;
};

export type OrgLevel = {
  id: number;
  code: string;
  order: number;
  promotion_timeline: string;
};

export type OrgClient = {
  id: number;
  name: string;
};

export type OrgClientUser = {
  id: number;
  client: number;
  first_name: string;
  last_name: string;
  email: string;
  job_title?: string;
  status?: string;
  user?: number | null;
};

export type BankQuestion = {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  is_active: boolean;
};

export type VideoPrompt = {
  id: number;
  prompt: string;
  is_active: boolean;
};

export type AssessmentSetting = {
  test_type: string;
  total_questions: number;
  technical_question_count: number;
  behavioral_question_count: number;
  time_limit_minutes: number;
  validity_days: number;
  estimated_minutes: number;
};

export type Comment = {
  id: number;
  text: string;
  author: number | null;
  application_stage: number | null;
  source: string;
  created_at: string;
};

export type ShareLink = {
  id: string;
  job_application_id?: number;
  job_application?: number;
  comment: string;
  expires_at: string | null;
  is_active: boolean;
  share_url: string;
  created_at: string;
};

export type WrittenTestSection = {
  status: string;
  score_percentage: string | number | null;
  questions: {
    order: number;
    question_text: string;
    selected_option: string | null;
  }[];
};

export type VideoTestSection = {
  status: string;
  score_percentage: string | number | null;
  questions: {
    order: number;
    prompt: string;
    transcript: string;
  }[];
};

export type ApplicationAssessment = {
  invite_token: string | null;
  expires_at: string | null;
  invite_url: string | null;
  first_test: WrittenTestSection | null;
  video_test: VideoTestSection | null;
  questionnaire: WrittenTestSection | null;
};

export type ClientRole = {
  id: number;
  slug: string;
  title: string;
  department_name: string;
  location: string;
};

export type IdealProfileMetric = {
  metric_id: number;
  client_weight: number;
  key?: string;
  label?: string;
  description?: string;
};

export type IdealProfileTestConfig = {
  test_type: string;
  question_count: number;
  time_limit_minutes: number;
};

export type IdealProfile = {
  id: number;
  name: string;
  is_template: boolean;
  job_opening: number | null;
  department: { id: number; name: string } | null;
  title: { id: number; name: string } | null;
  skills: Skill[];
  metric_weights: IdealProfileMetric[];
  test_configurations: IdealProfileTestConfig[];
};

export type IdealProfilePayload = {
  name: string;
  department_id?: number | null;
  title_id?: number | null;
  skill_ids?: number[];
  metric_weights?: IdealProfileMetric[];
  test_configurations?: IdealProfileTestConfig[];
};

export type IdealProfileMetricCatalogItem = {
  id: number;
  key: string;
  label: string;
  description: string;
  display_order: number;
  is_active?: boolean;
};

export type ClientApplicationRow = {
  id: number;
  status: string;
  applicant_name: string;
  review_status: string | null;
};
