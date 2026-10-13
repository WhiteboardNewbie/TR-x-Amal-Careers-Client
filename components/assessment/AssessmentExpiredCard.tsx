import { AlertCircleIcon } from "./icons";
import {
  CAREERS_CONTACT,
  CAREERS_PATH,
  cardShell,
  shellGradient,
} from "./shared";

export function isAssessmentLinkExpiredOrInvalid(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("expired") || lower.includes("invalid") || lower.includes("not found");
}

export function AssessmentExpiredCard({
  message,
  title = "This assessment has expired",
}: {
  message?: string;
  title?: string;
}) {
  return (
    <div className={shellGradient}>
      <div className={`${cardShell} max-w-md`} role="alert" aria-live="polite">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amal-red/15">
          <AlertCircleIcon className="h-8 w-8 text-amal-red" />
        </div>
        <h2 className="mb-2 text-center text-2xl font-bold text-amal-ink">{title}</h2>
        <p className="mb-2 text-center text-zinc-600">
          {message ??
            "This assessment link is no longer valid. You can explore other open roles or contact us if you need help."}
        </p>
        <div className="mt-6 flex flex-col items-stretch gap-3">
          <a
            href={CAREERS_PATH}
            className="flex w-full items-center justify-center rounded-lg bg-amal-red px-6 py-3 text-center font-semibold text-amal-white transition hover:bg-amal-red/90"
          >
            Explore Open Roles
          </a>
          <p className="text-center text-sm text-zinc-500">
            Need help or an extension? Contact{" "}
            <a
              href={`mailto:${CAREERS_CONTACT}`}
              className="font-medium text-amal-red underline underline-offset-2 hover:text-amal-red/80"
            >
              {CAREERS_CONTACT}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
