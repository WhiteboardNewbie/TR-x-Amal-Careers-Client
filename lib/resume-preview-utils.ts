export type ResumePreviewKind = "pdf" | "word" | "unsupported";

export function getResumePreviewKind(
  resumePath: string | null | undefined,
): ResumePreviewKind {
  if (!resumePath) {
    return "unsupported";
  }
  const path = resumePath.split("?")[0]?.toLowerCase() ?? "";
  if (path.endsWith(".pdf")) {
    return "pdf";
  }
  if (path.endsWith(".docx") || path.endsWith(".doc")) {
    return "word";
  }
  return "unsupported";
}
