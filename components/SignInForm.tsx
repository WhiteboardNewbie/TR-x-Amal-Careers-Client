"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AmalMark } from "@/components/AmalMark";
import { ApiError, createAuthToken } from "@/lib/api";
import { pathForLanding, readSession, writeSession } from "@/lib/session";
import type { AuthLanding } from "@/lib/types";

const fieldClass =
  "w-full rounded-full border border-black/15 bg-amal-white py-3 pl-11 pr-4 text-amal-ink outline-none transition placeholder:text-zinc-400 focus:border-amal-red focus:ring-2 focus:ring-amal-red/20";

function landingOf(value: string): AuthLanding {
  if (value === "staff" || value === "reviews" || value === "client") {
    return value;
  }
  return "";
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-400"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-400"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2zm-7-2a2 2 0 0 1 4 0v2h-4zm3 10.2a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6z"
      />
    </svg>
  );
}

export function SignInForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const session = readSession();
    const next = session ? pathForLanding(session.landing) : null;
    if (next) {
      router.replace(next);
    }
  }, [router]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const token = await createAuthToken({
        username: username.trim(),
        password,
      });
      const landing = landingOf(token.landing);
      const next = pathForLanding(landing);
      if (!next) {
        setError("You do not have access to Careers.");
        return;
      }
      writeSession({
        token: token.token,
        username: username.trim(),
        landing,
        is_hiring_staff: token.is_hiring_staff,
        is_clientuser: token.is_clientuser,
        permissions: token.permissions,
      });
      router.replace(next);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not sign in. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-10 flex justify-center lg:hidden">
        <Link href="/" className="inline-flex w-[var(--logo-w)] max-w-full">
          <AmalMark />
        </Link>
      </div>

      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-amal-ink">Welcome back</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Sign in to access your workspace
        </p>
      </div>

      {error ? (
        <p
          className="mb-4 rounded-xl border border-amal-red/30 bg-amal-sheet px-4 py-3 text-sm text-amal-red"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <div>
          <label
            htmlFor="username"
            className="mb-2 block text-sm font-semibold text-amal-ink"
          >
            Username
          </label>
          <div className="relative">
            <UserIcon />
            <input
              id="username"
              className={fieldClass}
              name="username"
              autoComplete="username"
              placeholder="Account name or email"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-semibold text-amal-ink"
          >
            Password
          </label>
          <div className="relative">
            <LockIcon />
            <input
              id="password"
              className={`${fieldClass} pr-12`}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-amal-ink"
              onClick={() => setShowPassword((open) => !open)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M3.3 2.3 2 3.6l3.1 3.1C3.2 8.1 2 10 2 12s3 7 10 7c2.1 0 3.9-.5 5.4-1.3l3 3 1.3-1.3L3.3 2.3zM12 17c-5.1 0-7.6-3.8-8.4-5 .5-.8 1.5-2.1 3-3.1l2.1 2.1A5 5 0 0 0 12 17zm8.4-5c-.4.7-1.2 1.8-2.4 2.8l-1.5-1.5c.3-.4.5-.9.5-1.3a5 5 0 0 0-5-5c-.4 0-.9.1-1.3.3L8.9 5.5C9.9 5.2 10.9 5 12 5c7 0 10 7 10 7s-.6 1.4-1.6 2.6z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-12 w-full items-center justify-center rounded-full bg-amal-red text-base font-semibold text-amal-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p className="mt-12 border-t border-black/10 pt-8 text-center text-xs text-zinc-400">
        Amal Academy Careers
      </p>
    </div>
  );
}
