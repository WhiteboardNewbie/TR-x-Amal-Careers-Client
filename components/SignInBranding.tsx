import Link from "next/link";
import { AmalMark } from "@/components/AmalMark";

const FEATURES = [
  "Roles and applications",
  "Stage reviews",
  "Assessments",
  "Client review",
];

export function SignInBranding() {
  return (
    <aside className="relative hidden min-h-dvh overflow-hidden bg-amal-staff-banner lg:flex lg:w-1/2">
      <div className="absolute right-0 top-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full bg-amal-red/40" />
      <div className="absolute bottom-0 left-0 h-72 w-72 -translate-x-1/2 translate-y-1/2 rounded-full bg-amal-black/20" />
      <div className="absolute left-1/4 top-1/4 h-32 w-32 rounded-full bg-amal-red/50 blur-2xl" />
      <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-amal-white/10 blur-3xl" />
      <div className="relative z-10 flex w-full flex-col justify-between p-12">
        <Link href="/" className="inline-flex w-44 max-w-full">
          <AmalMark className="h-auto w-full bg-transparent brightness-0 invert" />
        </Link>
        <div className="max-w-md">
          <h1 className="text-4xl font-bold leading-tight text-amal-white">
            Hiring for Amal
            <br />
            Hire in one place.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-amal-white/80">
            Roles, applications, stage reviews, and assessments in one
            workspace.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {FEATURES.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 text-sm text-amal-white/90"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amal-white" />
                {feature}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-amal-white/50">Amal Academy Careers</p>
      </div>
    </aside>
  );
}
