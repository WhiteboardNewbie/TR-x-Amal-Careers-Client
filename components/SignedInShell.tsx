"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AppFooter } from "@/components/AppFooter";
import { AppNav } from "@/components/AppNav";
import { can } from "@/lib/ability";
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

type SignedInLanding = Exclude<AuthLanding, "">;

export function SignedInShell({
  landing,
  permission,
  wide,
  children,
}: {
  landing: SignedInLanding | readonly SignedInLanding[];
  permission?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const allowedKey = (Array.isArray(landing) ? landing : [landing]).join(",");
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
    const allowed = allowedKey.split(",") as SignedInLanding[];
    if (!allowed.includes(current.landing as SignedInLanding)) {
      router.replace(pathForLanding(current.landing) ?? "/sign-in");
    }
  }, [allowedKey, router, session, sessionReady]);

  const allowed = allowedKey.split(",") as SignedInLanding[];
  if (
    !sessionReady ||
    !session ||
    !allowed.includes(session.landing as SignedInLanding)
  ) {
    return null;
  }

  return (
    <div className="flex min-h-full flex-col bg-amal-sheet text-amal-ink">
      <AppNav session={session} />
      <main className="overflow-anchor-none flex-1">
        {!permission || can(session, permission) ? (
          wide ? (
            children
          ) : (
            <div className="staff-container py-10">{children}</div>
          )
        ) : (
          <div className="staff-container py-8 text-sm text-zinc-600">
            You do not have permission to view this page.
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
