import { AmalMark } from "@/components/AmalMark";

export const CAREERS_CONTACT = "hello@amalacademy.org";
export const CAREERS_PATH = "/";

export const shellGradient =
  "flex min-h-screen items-center justify-center bg-gradient-to-br from-amal-red/5 to-amal-blue/10 p-4";

export const cardShell =
  "w-full max-w-2xl rounded-lg bg-amal-white p-8 shadow-xl";

/** Compact mark for in-test sticky headers (matches AppNav). */
export function AssessmentHeaderMark() {
  return (
    <AmalMark className="-ml-2 h-8 w-auto max-w-full shrink-0 bg-transparent sm:-ml-3" />
  );
}

export function StepNumber({ n }: { n: number }) {
  return (
    <span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amal-red text-sm font-semibold leading-6 text-amal-white">
      {n}
    </span>
  );
}

export function formatClock(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function errorText(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Request failed.";
}
