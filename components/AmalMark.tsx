import Image from "next/image";

export function AmalMark() {
  return (
    <Image
      src="/amal-wordmark.png"
      alt="Amal Academy"
      width={701}
      height={197}
      className="h-auto w-[var(--logo-w)] max-w-full bg-transparent"
      unoptimized
      priority
    />
  );
}
