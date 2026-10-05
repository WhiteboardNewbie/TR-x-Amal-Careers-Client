"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { getClientRoles } from "@/lib/client-api";
import type { ClientRole } from "@/lib/types";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Request failed.";
}

export function ClientHiring() {
  const [rows, setRows] = useState<ClientRole[]>([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let ignore = false;
    getClientRoles()
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
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Hiring</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600">
        Roles sent to your client.
      </p>
      {notice ? <p className="mt-4 text-sm text-amal-red">{notice}</p> : null}
      <div className="mt-6 rounded-2xl border border-black/10 bg-amal-white p-4 md:p-6">
        {rows.length === 0 ? (
          <p className="text-sm text-zinc-500">No linked roles yet.</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/client/roles/${row.slug}`}
                  className="block rounded-lg bg-amal-sheet px-4 py-3"
                >
                  <p className="font-semibold text-amal-red">{row.title}</p>
                  <p className="text-sm text-zinc-500">
                    {row.department_name} · {row.location}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
