"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { getShareLinkLogs } from "@/lib/staff-api";
import { TablePager } from "./ui";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

export function ShareLinkLogsScreen({ id }: { id: string }) {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<
    {
      id: number;
      ip_address: string;
      host: string;
      user_agent: string;
      referer: string;
      accessed_at: string;
    }[]
  >([]);
  const [count, setCount] = useState(0);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let ignore = false;
    getShareLinkLogs(id, page)
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
  }, [id, page]);

  return (
    <div>
      <Link href="/staff/share-links" className="text-sm font-semibold text-amal-red">
        ← Share links
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Access logs</h1>
      {notice ? <p className="mt-4 text-sm text-amal-red">{notice}</p> : null}
      <div className="mt-6 rounded-2xl border border-black/10 bg-amal-white p-4 md:p-6">
        {rows.length === 0 ? (
          <p className="text-sm text-zinc-500">No opens recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-zinc-500">
                  <th className="py-2">When</th>
                  <th>IP</th>
                  <th>Host</th>
                  <th>User agent</th>
                  <th>Referer</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-black/5">
                    <td className="py-3">
                      {row.accessed_at.slice(0, 16).replace("T", " ")}
                    </td>
                    <td>{row.ip_address || "—"}</td>
                    <td>{row.host || "—"}</td>
                    <td className="max-w-xs truncate">{row.user_agent || "—"}</td>
                    <td className="max-w-xs truncate">{row.referer || "—"}</td>
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
