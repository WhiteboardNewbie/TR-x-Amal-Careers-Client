import type { AuthLanding, AuthSession } from "./types";

const KEY = "amal-auth";
const EVENT = "amal-auth";

let cachedRaw: string | null | undefined;
let cachedSession: AuthSession | null = null;

export function pathForLanding(landing: AuthLanding | string): string | null {
  if (landing === "staff") {
    return "/staff";
  }
  if (landing === "reviews") {
    return "/reviews";
  }
  if (landing === "client") {
    return "/client";
  }
  return null;
}

function parseSession(raw: string | null): AuthSession | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed.token || typeof parsed.token !== "string") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function readSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(KEY);
  if (raw === cachedRaw) {
    return cachedSession;
  }
  cachedRaw = raw;
  cachedSession = parseSession(raw);
  return cachedSession;
}

function notify(): void {
  cachedRaw = undefined;
  window.dispatchEvent(new Event(EVENT));
}

export function writeSession(session: AuthSession): void {
  window.localStorage.setItem(KEY, JSON.stringify(session));
  notify();
}

export function clearSession(): void {
  window.localStorage.removeItem(KEY);
  notify();
}

export function subscribeSession(onStoreChange: () => void): () => void {
  const onChange = () => onStoreChange();
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function sessionToken(): string | null {
  return readSession()?.token ?? null;
}
