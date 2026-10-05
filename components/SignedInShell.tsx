"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AppFooter } from "@/components/AppFooter";
import { AppNav } from "@/components/AppNav";
import { pathForLanding, readSession, subscribeSession } from "@/lib/session";
import type { AuthLanding } from "@/lib/types";

function subscribeClientOnly() {
  return () => {};
}

function clientTrue() {
  return true;
}

function serverFalse() {
  return false;
}

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
  const sessionReady = useSyncExternalStore(
    subscribeClientOnly,
    clientTrue,
    serverFalse,
  );
  const session = useSyncExternalStore(
    subscribeSession,
    readSession,
    () => null,
  );

  useEffect(() => {
    if (!sessionReady) {
      return;
    }
    const current = readSession();
    if (!current) {
      router.replace("/sign-in");
      return;
    }
    if (current.landing !== landing) {
      router.replace(pathForLanding(current.landing) ?? "/sign-in");
    }
  }, [landing, router, session, sessionReady]);

  if (!sessionReady || !session || session.landing !== landing) {
    return null;
  }

  return (
    <div className="flex min-h-full flex-col bg-amal-sheet text-amal-ink">
      <AppNav session={session} />
      <main className="overflow-anchor-none flex-1">
        {wide ? children : <div className="staff-container py-10">{children}</div>}
      </main>
      <AppFooter />
    </div>
  );
}
