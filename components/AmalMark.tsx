import Image from "next/image";

type AmalMarkProps = {
  variant?: "color" | "white";
};

export function AmalMark({ variant = "color" }: AmalMarkProps) {
  if (variant === "white") {
    return (
      <Image
        src="/amal-logo-white.png"
        alt="Amal Academy"
        width={2499}
        height={832}
        className="h-9 w-auto"
        priority
      />
    );
  }

  return (
    <Image
      src="/amal-logo.png"
      alt="Amal Academy"
      width={1000}
      height={1000}
      className="h-16 w-auto"
    />
  );
}
