"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { getAssignedStages } from "@/lib/staff-api";
import { labelFor } from "@/lib/status";
import { TablePager } from "@/components/staff/ui";
import type { ApplicationStage } from "@/lib/types";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

export function ReviewsScreen() {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<ApplicationStage[]>([]);
  const [count, setCount] = useState(0);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let ignore = false;
    getAssignedStages({ page, page_size: 10 })
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
  }, [page]);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Reviews</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600">
        Stages assigned to you.
      </p>
      {notice ? <p className="mt-4 text-sm text-amal-red">{notice}</p> : null}
      <div className="mt-6 rounded-2xl border border-black/10 bg-amal-white p-4 md:p-6">
        {rows.length === 0 ? (
          <p className="text-sm text-zinc-500">No stages assigned yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-zinc-500">
                  <th className="py-2">Stage</th>
                  <th>Application</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-black/5">
                    <td className="py-3 font-semibold">{row.name || "Review"}</td>
                    <td>
                      <Link
                        href={`/reviews/${row.job_application}`}
                        className="font-semibold text-amal-red"
                      >
                        #{row.job_application}
                      </Link>
                    </td>
                    <td>{labelFor(row.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <TablePager page={page} pageSize={10} count={count} onPage={setPage} />
      </div>
    </div>
  );
}
