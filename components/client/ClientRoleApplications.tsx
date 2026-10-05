"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { getClientRoleApplications } from "@/lib/client-api";
import { labelFor } from "@/lib/status";
import type { ClientApplicationRow } from "@/lib/types";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

export function ClientRoleApplications({ slug }: { slug: string }) {
  const [rows, setRows] = useState<ClientApplicationRow[]>([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let ignore = false;
    getClientRoleApplications(slug)
      .then((data) => {
        if (!ignore) {
          setRows(data);
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
  }, [slug]);

  return (
    <div>
      <Link href="/client" className="text-sm font-semibold text-amal-red">
        ← Hiring
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Applications</h1>
      {notice ? <p className="mt-4 text-sm text-amal-red">{notice}</p> : null}
      <div className="mt-6 rounded-2xl border border-black/10 bg-amal-white p-4 md:p-6">
        {rows.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No applications have been handed to you on this role.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-zinc-500">
                  <th className="py-2">Applicant</th>
                  <th>Status</th>
                  <th>Your review</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-black/5">
                    <td className="py-3">
                      <Link
                        href={`/client/applications/${row.id}`}
                        className="font-semibold text-amal-red"
                      >
                        {row.applicant_name}
                      </Link>
                    </td>
                    <td>{labelFor(row.status)}</td>
                    <td>{labelFor(row.review_status ?? "pending")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
