"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, createAuthToken } from "@/lib/api";
import { pathForLanding, readSession, writeSession } from "@/lib/session";
import type { AuthLanding } from "@/lib/types";

function landingOf(value: string): AuthLanding {
  if (value === "staff" || value === "reviews" || value === "client") {
    return value;
  }
  return "";
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
    <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
      <div>
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-amal-ink">
          Sign in
        </h1>
        <p className="mt-1 text-[0.95rem] text-zinc-600">
          Use your Amal account name or email.
        </p>
      </div>
      {error ? (
        <p
          className="rounded-lg border border-amal-red/30 bg-amal-sheet px-3 py-2 text-sm text-amal-red"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <label className="flex flex-col gap-2 text-sm font-medium text-amal-ink">
        Username
        <input
          className="h-12 rounded-lg border border-black/20 px-4 text-base font-normal text-amal-ink outline-none focus:border-amal-red focus:ring-2 focus:ring-amal-red/20"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-amal-ink">
        Password
        <span className="relative">
          <input
            className="h-12 w-full rounded-lg border border-black/20 px-4 pr-12 text-base font-normal text-amal-ink outline-none focus:border-amal-red focus:ring-2 focus:ring-amal-red/20"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-zinc-500 hover:text-amal-ink"
            onClick={() => setShowPassword((open) => !open)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M3.3 2.3 2 3.6l3.1 3.1C3.2 8.1 2 10 2 12s3 7 10 7c2.1 0 3.9-.5 5.4-1.3l3 3 1.3-1.3L3.3 2.3zM12 17c-5.1 0-7.6-3.8-8.4-5 .5-.8 1.5-2.1 3-3.1l2.1 2.1A5 5 0 0 0 12 17zm8.4-5c-.4.7-1.2 1.8-2.4 2.8l-1.5-1.5c.3-.4.5-.9.5-1.3a5 5 0 0 0-5-5c-.4 0-.9.1-1.3.3L8.9 5.5C9.9 5.2 10.9 5 12 5c7 0 10 7 10 7s-.6 1.4-1.6 2.6z"
                />
              </svg>
            )}
          </button>
        </span>
      </label>
      <button
        type="submit"
        disabled={busy}
        className="inline-flex h-12 items-center justify-center rounded-lg bg-amal-red px-6 text-base font-semibold text-amal-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Signing in…" : "Submit"}
      </button>
    </form>
  );
}
