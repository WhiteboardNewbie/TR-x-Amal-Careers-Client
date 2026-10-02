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
