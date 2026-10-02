export function formatTypeLabel(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function formatPositions(
  positions: number | string | null | undefined,
): string {
  const count = Number(positions);
  if (!Number.isFinite(count) || count <= 0) {
    return "Open role";
  }
  if (count === 1) {
    return "1 opening";
  }
  return `${count} openings`;
}

export function formatExperience(
  level: string | number | null | undefined,
): string {
  if (level === null || level === undefined || level === "") {
    return "Experience flexible";
  }
  const asNumber = Number(level);
  if (Number.isFinite(asNumber)) {
    return asNumber === 1 ? "1 year experience" : `${asNumber}+ years experience`;
  }
  return String(level);
}
