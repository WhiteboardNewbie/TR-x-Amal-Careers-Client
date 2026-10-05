"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { createSkill } from "@/lib/staff-api";
import type { Skill } from "@/lib/types";
import { GhostButton, PrimaryButton, inputClass } from "./ui";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

export function AddSkillDialog({
  onClose,
  onCreated,
  onError,
}: {
  onClose: () => void;
  onCreated: (skill: Skill) => void;
  onError: (value: string) => void;
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit() {
    if (busy || !name.trim()) {
      return;
    }
    setBusy(true);
    try {
      onCreated(await createSkill(name.trim()));
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-amal-black/45 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-black/10 bg-amal-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-skill-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-black/10 p-5">
          <div>
            <h3 id="add-skill-title" className="text-lg font-bold">
              Add New Skill
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              Create a new skill for job requirements.
            </p>
          </div>
          <button
            type="button"
            className="rounded-full px-2 py-1 text-sm font-semibold text-zinc-500 hover:bg-amal-sheet hover:text-amal-ink"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="p-5">
          <label
            htmlFor="modal-skill-name"
            className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
          >
            Skill Name
          </label>
          <input
            id="modal-skill-name"
            className={`${inputClass} mt-1`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g., React, Python, Project Management"
            autoFocus
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void submit();
              }
            }}
          />
        </div>
        <div className="flex justify-end gap-3 border-t border-black/10 p-5">
          <GhostButton type="button" onClick={onClose} disabled={busy}>
            Cancel
          </GhostButton>
          <PrimaryButton
            type="button"
            disabled={busy || !name.trim()}
            onClick={() => void submit()}
          >
            {busy ? "Creating..." : "Create Skill"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
