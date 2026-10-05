"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ComponentProps } from "react";

type CKEditorCmp = typeof import("@ckeditor/ckeditor5-react").CKEditor;
type ClassicEditorCtor =
  typeof import("@ckeditor/ckeditor5-build-classic").default;

type JobDescriptionEditorProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  id?: string;
  error?: string;
  toolbar?: string[];
};

export function JobDescriptionEditor({
  value,
  onChange,
  label = "Job Description",
  id = "job-description",
  error,
  toolbar = [
    "bold",
    "italic",
    "link",
    "bulletedList",
    "numberedList",
    "|",
    "undo",
    "redo",
  ],
}: JobDescriptionEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [mods, setMods] = useState<{
    CKEditor: CKEditorCmp;
    ClassicEditor: ClassicEditorCtor;
  } | null>(null);

  const autoResize = useCallback(() => {
    if (!editorRef.current) {
      return;
    }
    const editable = editorRef.current.querySelector(
      ".ck-editor__editable",
    ) as HTMLElement | null;
    if (editable) {
      editable.style.height = "auto";
      editable.style.height = `${editable.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    autoResize();
  }, [autoResize]);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      import("@ckeditor/ckeditor5-react"),
      import("@ckeditor/ckeditor5-build-classic"),
    ]).then(([react, classic]) => {
      if (!ignore) {
        setMods({
          CKEditor: react.CKEditor,
          ClassicEditor: classic.default,
        });
      }
    });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="job-description-editor w-full">
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
      >
        {label}
      </label>
      <div
        ref={editorRef}
        className="mt-1 min-h-[140px] rounded-lg border border-black/15 bg-amal-white"
      >
        {mods ? (
          <mods.CKEditor
            editor={
              mods.ClassicEditor as unknown as ComponentProps<
                CKEditorCmp
              >["editor"]
            }
            data={value}
            onChange={(_event, editor) => {
              onChange(editor.getData());
            }}
            onReady={() => autoResize()}
            config={{
              toolbar,
            }}
          />
        ) : (
          <p className="px-3 py-3 text-sm text-zinc-500">Loading editor…</p>
        )}
      </div>
      {error ? <p className="mt-1 text-xs text-amal-red">{error}</p> : null}
      <style>{`
        .ck-editor__editable_inline {
          padding: 0.75rem !important;
          min-height: 140px;
        }
        .ck-content ul,
        .ck-content ol {
          margin-left: 1rem !important;
        }
        .job-description-editor .ck.ck-toolbar {
          border: 0;
          border-bottom: 1px solid color-mix(in srgb, var(--amal-black) 15%, transparent);
          background: var(--amal-sheet);
        }
        .job-description-editor .ck.ck-editor__main > .ck-editor__editable {
          border: 0;
        }
        .job-description-editor .ck-content a {
          color: var(--amal-red);
        }
      `}</style>
    </div>
  );
}
