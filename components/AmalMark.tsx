import Image from "next/image";

export function AmalMark() {
  return (
    <Image
      src="/amal-logo.png"
      alt="Amal Academy"
      width={701}
      height={197}
      className="h-8 w-auto"
      priority
    />
  );
}
