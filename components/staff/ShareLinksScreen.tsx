"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  createShareLink,
  deactivateShareLink,
  getShareLinks,
  getStaffApplications,
  patchShareLink,
} from "@/lib/staff-api";
import type { ShareLink, StaffApplication } from "@/lib/types";
import { Field, GhostButton, Modal, PrimaryButton, TablePager, inputClass } from "./ui";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

export function ShareLinksScreen() {
  const [page, setPage] = useState(1);
  const [tick, setTick] = useState(0);
  const [rows, setRows] = useState<ShareLink[]>([]);
  const [count, setCount] = useState(0);
  const [notice, setNotice] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ShareLink | null>(null);

  useEffect(() => {
    let ignore = false;
    getShareLinks(page)
      .then((data) => {
        if (!ignore) {
          setRows(data.results);
          setCount(data.count);
        }
      })
      .catch((error) => {
        if (!ignore) {
          setNotice(errorText(error));
        }
      });
    return () => {
      ignore = true;
    };
  }, [page, tick]);

  return (
    <div>
      <Link href="/staff" className="text-sm font-semibold text-amal-red">
        ← Careers
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Share links</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600">
        Create a public link to an application, edit it, or turn it off.
      </p>
      {notice ? (
        <p className="mt-4 text-sm text-amal-red">{notice}</p>
      ) : null}
      <div className="mt-6">
        <PrimaryButton type="button" onClick={() => setCreating(true)}>
          Create link
        </PrimaryButton>
      </div>
      <div className="mt-6 rounded-2xl border border-black/10 bg-amal-white p-4 md:p-6">
        {rows.length === 0 ? (
          <p className="text-sm text-zinc-500">No share links yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-zinc-500">
                  <th className="py-2">Application</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-black/5">
                    <td className="py-3 font-semibold">
                      #{row.job_application_id ?? row.job_application}
                    </td>
                    <td>
                      {row.expires_at
                        ? row.expires_at.slice(0, 16).replace("T", " ")
                        : "—"}
                    </td>
                    <td>{row.is_active ? "Active" : "Off"}</td>
                    <td className="space-x-2 text-right">
                      <Link
                        href={`/staff/share-links/${row.id}/logs`}
                        className="font-semibold text-amal-red"
                      >
                        Logs
                      </Link>
                      <GhostButton type="button" onClick={() => setEditing(row)}>
                        Edit
                      </GhostButton>
                      {row.is_active ? (
                        <GhostButton
                          type="button"
                          onClick={() =>
                            void deactivateShareLink(row.id)
                              .then(() => setTick((value) => value + 1))
                              .catch((error) => setNotice(errorText(error)))
                          }
                        >
                          Deactivate
                        </GhostButton>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <TablePager page={page} pageSize={10} count={count} onPage={setPage} />
      </div>
      {creating ? (
        <CreateShareModal
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            setTick((value) => value + 1);
          }}
          onError={setNotice}
        />
      ) : null}
      {editing ? (
        <EditShareModal
          link={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setTick((value) => value + 1);
          }}
          onError={setNotice}
        />
      ) : null}
    </div>
  );
}

function CreateShareModal({
  onClose,
  onSaved,
  onError,
}: {
  onClose: () => void;
  onSaved: () => void;
  onError: (value: string) => void;
}) {
  const [applications, setApplications] = useState<StaffApplication[]>([]);
  const [applicationId, setApplicationId] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getStaffApplications({ page: 1, page_size: 50 }).then((data) =>
      setApplications(data.results),
    );
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await createShareLink({
        job_application: Number(applicationId),
        comment,
      });
      onSaved();
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Create share link" onClose={onClose}>
      <form onSubmit={onSubmit}>
        <Field label="Application">
          <select
            className={inputClass}
            value={applicationId}
            onChange={(event) => setApplicationId(event.target.value)}
            required
          >
            <option value="">Select</option>
            {applications.map((row) => (
              <option key={row.id} value={row.id}>
                {row.applicant.name} · {row.job_opening_name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Comment">
          <textarea
            className={`${inputClass} h-20 py-2`}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </Field>
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? "Saving…" : "Create"}
        </PrimaryButton>
      </form>
    </Modal>
  );
}

function EditShareModal({
  link,
  onClose,
  onSaved,
  onError,
}: {
  link: ShareLink;
  onClose: () => void;
  onSaved: () => void;
  onError: (value: string) => void;
}) {
  const [comment, setComment] = useState(link.comment ?? "");
  const [expires, setExpires] = useState(
    link.expires_at ? link.expires_at.slice(0, 16) : "",
  );
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await patchShareLink(link.id, {
        comment,
        expires_at: expires ? new Date(expires).toISOString() : null,
      });
      onSaved();
    } catch (error) {
      onError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Edit share link" onClose={onClose}>
      <form onSubmit={onSubmit}>
        <p className="mb-3 break-all text-sm text-zinc-600">{link.share_url}</p>
        <Field label="Expires">
          <input
            className={inputClass}
            type="datetime-local"
            value={expires}
            onChange={(event) => setExpires(event.target.value)}
          />
        </Field>
        <Field label="Comment">
          <textarea
            className={`${inputClass} h-20 py-2`}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </Field>
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </PrimaryButton>
      </form>
    </Modal>
  );
}
