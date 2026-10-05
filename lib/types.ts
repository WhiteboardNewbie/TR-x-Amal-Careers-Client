export type Department = {
  id: number;
  name: string;
};

export type Skill = {
  id: number;
  name: string;
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
