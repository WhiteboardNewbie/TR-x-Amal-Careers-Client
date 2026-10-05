"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { pathForLanding, readSession, subscribeSession } from "@/lib/session";
import type { AuthLanding } from "@/lib/types";

export function SignedInShell({
  landing,
  wide,
  children,
}: {
  landing: Exclude<AuthLanding, "">;
  wide?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const session = useSyncExternalStore(
    subscribeSession,
    readSession,
    () => null,
  );

  useEffect(() => {
    if (!session) {
      router.replace("/sign-in");
      return;
    }
    if (session.landing !== landing) {
      router.replace(pathForLanding(session.landing) ?? "/sign-in");
    }
  }, [landing, router, session]);

  if (!session || session.landing !== landing) {
    return null;
  }

  return (
    <div className="flex min-h-full flex-col bg-amal-sheet text-amal-ink">
      <AppNav session={session} />
      <main className="flex-1">
        {wide ? children : <div className="staff-container py-10">{children}</div>}
      </main>
    </div>
  );
}
