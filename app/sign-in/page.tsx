import { AmalMark } from "@/components/AmalMark";
import { SignInForm } from "@/components/SignInForm";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="flex min-h-full bg-amal-white text-amal-ink">
      <aside className="relative hidden flex-col justify-between bg-amal-sheet px-12 py-12 lg:flex lg:w-1/2">
        <Link href="/" className="inline-flex w-[var(--logo-w)] max-w-full">
          <AmalMark />
        </Link>
        <div className="max-w-md">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-amal-red">
            Amal Academy
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Careers
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-zinc-600">
            Empowering Pakistan&apos;s youth with the skills, knowledge, and
            confidence they need to succeed.
          </p>
        </div>
      </aside>
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-10">
        <div className="mb-10 lg:hidden">
          <Link href="/" className="inline-flex w-[var(--logo-w)] max-w-full">
            <AmalMark />
          </Link>
        </div>
        <div className="mx-auto w-full max-w-md">
          <SignInForm />
        </div>
      </div>
    </div>
  );
}
