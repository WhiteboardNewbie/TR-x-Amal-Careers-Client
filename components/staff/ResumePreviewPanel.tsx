"use client";

import { useEffect, useRef, useState } from "react";
import { getResumePreviewKind } from "@/lib/resume-preview-utils";
import { ExternalLinkIcon, FileTextIcon } from "./icons";

function WordDocPreview({
  blob,
  downloadUrl,
}: {
  blob: Blob;
  downloadUrl: string;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLDivElement>(null);
  const [rendering, setRendering] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = bodyRef.current;
    const styleContainer = styleRef.current;
    if (!container || !styleContainer) {
      return;
    }

    let cancelled = false;
    setRendering(true);
    setError(null);
    container.innerHTML = "";
    styleContainer.innerHTML = "";

    async function render() {
      try {
        const { renderAsync } = await import("docx-preview");
        if (cancelled || !container || !styleContainer) {
          return;
        }
        await renderAsync(blob, container, styleContainer, {
          className: "docx-resume-preview",
          inWrapper: true,
          breakPages: true,
          ignoreWidth: true,
          ignoreHeight: true,
        });
      } catch {
        if (!cancelled) {
          setError(
            "Could not render this Word document. Legacy .doc files may need to be downloaded.",
          );
        }
      } finally {
        if (!cancelled) {
          setRendering(false);
        }
      }
    }

    void render();
    return () => {
      cancelled = true;
      container.innerHTML = "";
      styleContainer.innerHTML = "";
    };
  }, [blob]);

  if (error) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
        <FileTextIcon className="mb-3 h-12 w-12 text-zinc-400" />
        <h2 className="text-lg font-bold">Word preview unavailable</h2>
        <p className="mt-2 max-w-sm text-sm text-zinc-600">{error}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <a
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-amal-ink px-4 py-2 text-sm font-semibold text-amal-white hover:bg-amal-ink/90"
          >
            <ExternalLinkIcon className="h-4 w-4" />
            Open Resume
          </a>
          <a
            href={downloadUrl}
            download
            className="inline-flex items-center gap-2 rounded-lg border border-black/15 bg-amal-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-amal-sheet"
          >
            Download
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-w-0 max-w-full">
      <div ref={styleRef} className="docx-resume-preview-styles" aria-hidden />
      {rendering ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-amal-white/80 text-sm text-zinc-500">
          Rendering document...
        </div>
      ) : null}
      <div
        ref={bodyRef}
        className="docx-resume-preview-host h-[calc(100vh-15rem)] min-h-[560px] w-full max-w-full overflow-auto bg-amal-white p-4"
      />
    </div>
  );
}

export function ResumePreviewPanel({
  resumePath,
  resumeBlob,
  downloadUrl,
  hasResume,
  loading = false,
  showHeader = true,
}: {
  resumePath: string | null | undefined;
  resumeBlob: Blob | null;
  downloadUrl: string;
  hasResume: boolean;
  loading?: boolean;
  showHeader?: boolean;
}) {
  const previewKind = getResumePreviewKind(resumePath);

  const body = !hasResume ? (
    <div className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center text-zinc-500">
      <FileTextIcon className="mb-3 h-12 w-12" />
      <p>No resume uploaded.</p>
    </div>
  ) : loading ? (
    <div className="flex min-h-[420px] items-center justify-center p-8 text-sm text-zinc-500">
      Loading resume preview...
    </div>
  ) : !resumeBlob || !downloadUrl ? (
    <div className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center text-zinc-500">
      <FileTextIcon className="mb-3 h-12 w-12" />
      <p>Could not load resume preview.</p>
    </div>
  ) : previewKind === "pdf" ? (
    <iframe
      src={downloadUrl}
      title="Candidate resume"
      className="h-[calc(100vh-15rem)] min-h-[560px] w-full bg-amal-sheet"
    />
  ) : previewKind === "word" ? (
    <WordDocPreview blob={resumeBlob} downloadUrl={downloadUrl} />
  ) : (
    <div className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
      <FileTextIcon className="mb-3 h-12 w-12 text-zinc-400" />
      <h2 className="text-lg font-bold">Resume preview unavailable</h2>
      <p className="mt-2 max-w-sm text-sm text-zinc-600">
        This file type cannot be previewed in the browser. Open or download it
        to review the document.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <a
          href={downloadUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-amal-ink px-4 py-2 text-sm font-semibold text-amal-white hover:bg-amal-ink/90"
        >
          <ExternalLinkIcon className="h-4 w-4" />
          Open Resume
        </a>
        <a
          href={downloadUrl}
          download
          className="inline-flex items-center gap-2 rounded-lg border border-black/15 bg-amal-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-amal-sheet"
        >
          Download
        </a>
      </div>
    </div>
  );

  if (!showHeader) {
    return body;
  }

  return (
    <section className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-black/10 bg-amal-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 px-5 py-4">
        <div>
          <h2 className="text-lg font-bold">Resume</h2>
          <p className="text-sm text-zinc-500">Candidate document preview</p>
        </div>
        {downloadUrl ? (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-amal-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-amal-sheet"
          >
            <ExternalLinkIcon className="h-3.5 w-3.5" />
            Open
          </a>
        ) : null}
      </div>
      {body}
    </section>
  );
}
