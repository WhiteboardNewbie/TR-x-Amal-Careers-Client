import {
  formatPhoneNumberIntl,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumber,
} from "react-phone-number-input";

/**
 * Phone numbers are stored as text (ideally E.164, e.g. +923356685103).
 * Numbers typed or stored without a "+" are read as Pakistani.
 */

export const DEFAULT_PHONE_COUNTRY = "PK";

/** Text to E.164, or null when it doesn't parse as a real number. */
export function normalizePhoneStorage(
  raw: string | null | undefined,
): string | null {
  const text = String(raw ?? "").trim();
  if (!text) {
    return null;
  }
  try {
    const parsed = parsePhoneNumber(text, DEFAULT_PHONE_COUNTRY);
    return parsed?.isValid() ? parsed.number : null;
  } catch {
    return null;
  }
}

/** tel: link for a recognised number, otherwise null (render plain text). */
export function phoneTelHref(raw: string | null | undefined): string | null {
  const e164 = normalizePhoneStorage(raw);
  return e164 ? `tel:${e164}` : null;
}

/**
 * For an editable phone field seeded from stored text: recognised text
 * (parses to a real number) normalizes to E.164 so the PhoneField widget can
 * use it directly. Anything else (blank, garbage, already-broken data) stays
 * plain text, shown and edited as-is — never silently reformatted or
 * dropped. Use this wherever an edit form loads an existing stored phone.
 */
export function resolvePhoneFieldMode(raw: string | null | undefined): {
  mode: "field" | "fallback";
  phone: string;
} {
  const text = String(raw ?? "").trim();
  if (!text) {
    return { mode: "field", phone: "" };
  }
  const normalized = normalizePhoneStorage(text);
  return normalized
    ? { mode: "field", phone: normalized }
    : { mode: "fallback", phone: text };
}

/** True when the text is a valid number (empty is not valid). */
export function isValidPhone(raw: string | null | undefined): boolean {
  return normalizePhoneStorage(raw) != null;
}

/**
 * Read-only label: recognised numbers as +92 335 6685103, anything else
 * shown exactly as stored. Empty is —.
 */
export function formatPhoneDisplay(raw: string | null | undefined): string {
  const text = String(raw ?? "").trim();
  if (!text) {
    return "—";
  }
  const e164 = normalizePhoneStorage(text);
  return e164 ? formatPhoneNumberIntl(e164) : text;
}

const CALLING_CODES = new Set(
  getCountries().map((country) => String(getCountryCallingCode(country))),
);

/**
 * True when there is no number: empty, or only a country code (+92).
 */
export function isBlankPhone(raw: string | null | undefined): boolean {
  const text = String(raw ?? "").trim();
  if (!text) {
    return true;
  }
  const match = /^\+(\d{1,4})$/.exec(text);
  return match != null && CALLING_CODES.has(match[1]);
}

export const PHONE_REQUIRED_MESSAGE = "Please enter a phone number.";

export function getPhoneSubmitError(
  value: string | null | undefined,
  { required = false }: { required?: boolean } = {},
): string | null {
  if (isBlankPhone(value)) {
    return required ? PHONE_REQUIRED_MESSAGE : null;
  }
  return isValidPhone(value)
    ? null
    : required
      ? "Enter a valid phone number."
      : "Enter a valid phone number, or leave it empty.";
}

export function preparePhoneForSubmit(
  value: string | null | undefined,
): string | null {
  if (isBlankPhone(value)) {
    return null;
  }
  const text = String(value ?? "").trim();
  return normalizePhoneStorage(text) ?? text;
}
