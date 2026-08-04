/**
 * Normalizes a Vietnamese phone number to canonical E.164 format (+84xxxxxxxxx).
 *
 * Rules:
 * - Accepts: 0912345678, 912345678, +84912345678, 84912345678.
 * - Output: +84912345678.
 * - Validates against valid Vietnamese mobile prefixes (03, 05, 07, 08, 09).
 * - Returns null if invalid.
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;

  // Remove all non-numeric characters except leading '+'
  let digits = phone.trim().replace(/[^\d+]/g, '');

  if (digits.startsWith('+84')) {
    digits = digits.substring(3);
  } else if (digits.startsWith('84') && (digits.length === 11 || digits.length === 10)) {
    digits = digits.substring(2);
  } else if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }

  // A valid Vietnamese mobile number (after removing +84 or 0 or 84) must be exactly 9 digits
  if (digits.length !== 9) return null;

  // It must start with 3, 5, 7, 8, or 9
  const validPrefixes = ['3', '5', '7', '8', '9'];
  if (!validPrefixes.includes(digits[0])) return null;

  return `+84${digits}`;
}

export function normalizeVietnamPhone(phone: string | null | undefined): string | null {
  return normalizePhone(phone);
}

export function isValidVietnamPhone(phone: string | null | undefined): boolean {
  return normalizePhone(phone) !== null;
}

export function toLocalVietnamPhone(phone: string | null | undefined): string | null {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  return `0${normalized.substring(3)}`;
}
