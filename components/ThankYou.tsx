import Image from "next/image";
import Link from "next/link";

export function ThankYou() {
  return (
    <section className="relative flex min-h-[calc(100vh-var(--header-h))] flex-1 flex-col items-center justify-center overflow-hidden bg-amal-sheet py-[var(--section-y)] text-center">
      <div
        className="pointer-events-none absolute top-0 right-0 w-[90.1875%]"
        aria-hidden
      >
        <Image
          src="/hero-backdrop.svg"
          alt=""
          width={1443}
          height={844}
          sizes="90vw"
          className="h-auto w-full"
          priority
        />
      </div>
      <div className="page-container relative">
        <div className="page-article">
          <div className="thank-you-mark mx-auto mb-10 flex h-[100px] w-[100px] items-center justify-center rounded-full bg-amal-red">
            <svg
              width="50"
              height="50"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-amal-white"
              aria-hidden
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="mb-5 text-[clamp(2.25rem,calc(1.827rem+1.96vw),3.5rem)] font-medium leading-[1.1785] tracking-[-0.037em]">
            Thank You!
          </h1>
          <p className="mb-5 text-[clamp(1.2rem,calc(1.152rem+0.33vw),1.4375rem)] font-normal leading-[1.5] tracking-[-0.005em] text-zinc-500">
            Your application has been successfully submitted.
          </p>
          <p className="mb-[3.125rem] text-base text-zinc-500">
            We&apos;ve received your application and our team will review it
            carefully. We&apos;ll get back to you soon!
          </p>
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-amal-red px-12 py-4 text-base font-semibold text-amal-white hover:opacity-90"
          >
            Back to Careers
          </Link>
          <p className="mt-[3.75rem] flex items-center justify-center gap-2 text-[0.9rem] text-zinc-500">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden
            >
              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0" />
            </svg>
            Check your email for a confirmation message
          </p>
        </div>
      </div>
    </section>
  );
}
