import { API_URL, request } from "./api";

export type SessionStatus = {
  status: string;
  total_questions: number;
  time_limit_minutes: number;
  expires_at: string;
};

export type InvitePayload = {
  applicant: { name: string; email: string };
  role: { slug: string; title: string };
  expires_at: string;
  first_test: SessionStatus;
  video_test: SessionStatus;
  questionnaire: SessionStatus;
};

export type McqItem = {
  id: number;
  order: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
};

export type QuestionnaireItem = {
  id: number;
  question_text: string;
  question_order: number;
};

export type VideoItem = {
  id: number;
  order: number;
  prompt: string;
};

export type SharedApplication = {
  id: number;
  applicant: { name: string; email: string; city: string; contact: string };
  role: { title: string; slug: string; department_name: string; location: string };
  has_resume: boolean;
  status: string;
  first_test: {
    status: string;
    score_percentage: string | number | null;
    questions: { order: number; question_text: string; selected_option: string | null }[];
  } | null;
  video_test: {
    status: string;
    score_percentage: string | number | null;
    questions: { order: number; prompt: string; transcript: string }[];
  } | null;
  questionnaire: {
    status: string;
    score_percentage: string | number | null;
    questions: {
      order: number;
      question_text: string;
      answer_text?: string | null;
      selected_option: string | null;
    }[];
  } | null;
};

export function getPublicInvite(token: string): Promise<InvitePayload> {
  return request(`/careers/public/unified-tests/${token}/`);
}

export function startFirstTest(token: string): Promise<McqItem[]> {
  return request(`/first_test/sessions/${token}/start/`, { method: "POST" });
}

export function answerFirstTest(
  token: string,
  question_id: number,
  selected_option: string,
): Promise<{ success: boolean }> {
  return request(`/first_test/sessions/${token}/submit-answer/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question_id, selected_option }),
  });
}

export function completeFirstTest(
  token: string,
): Promise<{ status: string; score_percentage: string }> {
  return request(`/first_test/sessions/${token}/complete/`, { method: "POST" });
}

export function startVideoTest(token: string): Promise<VideoItem[]> {
  return request(`/video-test/sessions/${token}/start/`, { method: "POST" });
}

export function uploadVideoAnswer(
  token: string,
  question_id: number,
  file: File,
): Promise<{ success: boolean }> {
  const data = new FormData();
  data.set("question_id", String(question_id));
  data.set("file", file);
  return request(`/video-test/sessions/${token}/upload/`, {
    method: "POST",
    body: data,
  });
}

export function completeVideoTest(
  token: string,
): Promise<{ status: string; score_percentage: string }> {
  return request(`/video-test/sessions/${token}/complete/`, { method: "POST" });
}

export function startQuestionnaire(token: string): Promise<QuestionnaireItem[]> {
  return request(`/general-questionnaire/sessions/${token}/start/`, {
    method: "POST",
  });
}

export function answerQuestionnaire(
  token: string,
  question_id: number,
  answer_text: string,
  attachment?: File | null,
): Promise<{ success: boolean }> {
  if (attachment) {
    const data = new FormData();
    data.set("question_id", String(question_id));
    data.set("answer_text", answer_text);
    data.set("attachment", attachment);
    return request(`/general-questionnaire/sessions/${token}/submit-answer/`, {
      method: "POST",
      body: data,
    });
  }
  return request(`/general-questionnaire/sessions/${token}/submit-answer/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question_id, answer_text }),
  });
}

export function completeQuestionnaire(
  token: string,
): Promise<{ status: string; score_percentage: string | null }> {
  return request(`/general-questionnaire/sessions/${token}/complete/`, {
    method: "POST",
  });
}

export function getSharedApplication(id: string): Promise<SharedApplication> {
  return request(`/careers/public/application-shares/${id}/`);
}

export function sharedResumeUrl(id: string): string {
  return `${API_URL}/careers/public/application-shares/${id}/resume/`;
}
