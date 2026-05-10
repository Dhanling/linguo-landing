/**
 * Phone number validation & formatting for Linguo registration / checkout forms.
 *
 * Strategy:
 * - Default country: Indonesia (+62)
 * - Accepts international (e.g. +65, +1) for Indonesian diaspora
 * - Output: E.164 format (e.g. "+628123456789") — clean for WA blast (Wablas/Fonnte) & wa.me links
 * - Input: lenient — strips spaces, dashes, parens; auto-handles 0xxx → +62xxx
 *
 * Usage:
 *   const result = validatePhone(input);
 *   if (result.valid) {
 *     submitToBackend({ phone: result.e164 }); // always E.164
 *   } else {
 *     showError(result.error); // user-friendly Indonesian message
 *   }
 */

import {
  parsePhoneNumberFromString,
  AsYouType,
  type CountryCode,
} from 'libphonenumber-js';

const DEFAULT_COUNTRY: CountryCode = 'ID';

export type PhoneValidationResult = {
  valid: boolean;
  /** Canonical E.164 format, e.g. "+628123456789". Always set when valid=true. */
  e164: string | null;
  /** User-facing error message in Indonesian. Null when valid=true. */
  error: string | null;
};

/**
 * Validate phone number with default country = Indonesia.
 *
 * Accepts:
 *   "081234567890"        → +6281234567890   (Indonesian, leading 0)
 *   "+62 812 3456 7890"   → +6281234567890   (Indonesian with +62 + spaces)
 *   "62 812 3456 7890"    → +6281234567890   (Indonesian, no leading +)
 *   "+65 9123 4567"       → +6591234567      (Singapore — diaspora)
 *
 * Rejects:
 *   ""                    → "Nomor WhatsApp wajib diisi"
 *   "0812"                → "Nomor terlalu pendek"
 *   "021 7501234"         → "Pakai nomor HP (mulai 08), bukan nomor rumah"
 *   "abcdef"              → "Format nomor tidak valid"
 */
export function validatePhone(input: string): PhoneValidationResult {
  const trimmed = (input ?? '').trim();

  if (!trimmed) {
    return { valid: false, e164: null, error: 'Nomor WhatsApp wajib diisi' };
  }

  // Strip everything except digits and leading +
  // (libphonenumber-js handles spaces, but better to normalize first)
  const cleaned = trimmed.replace(/[^\d+]/g, '');

  if (cleaned.length < 4) {
    return { valid: false, e164: null, error: 'Nomor terlalu pendek' };
  }

  let phoneNumber;
  try {
    phoneNumber = parsePhoneNumberFromString(cleaned, DEFAULT_COUNTRY);
  } catch {
    return { valid: false, e164: null, error: 'Format nomor tidak valid' };
  }

  if (!phoneNumber) {
    return { valid: false, e164: null, error: 'Format nomor tidak valid' };
  }

  if (!phoneNumber.isValid()) {
    const e164Try = phoneNumber.number ?? '';
    if (e164Try.replace(/\D/g, '').length < 10) {
      return { valid: false, e164: null, error: 'Nomor terlalu pendek' };
    }
    return { valid: false, e164: null, error: 'Nomor tidak valid' };
  }

  // Extra check for Indonesia: must be a mobile (starts with 8)
  // Landline numbers (021, 022, etc) ditolak — kita butuh nomor WA
  if (phoneNumber.country === 'ID') {
    const nationalNumber = phoneNumber.nationalNumber.toString();
    if (!nationalNumber.startsWith('8')) {
      return {
        valid: false,
        e164: null,
        error: 'Pakai nomor HP (mulai 08), bukan nomor rumah',
      };
    }
  }

  return {
    valid: true,
    e164: phoneNumber.number, // E.164: "+628123456789"
    error: null,
  };
}

/**
 * Format phone number while user is typing — for live UX feedback.
 * Returns formatted string with spaces, e.g. "+62 812 3456 7890".
 *
 * Note: This is OPTIONAL — only use if you want as-you-type formatting.
 * For most modals, just letting user type freely + validating on submit is enough.
 */
export function formatPhoneAsYouType(input: string): string {
  if (!input) return '';
  const formatter = new AsYouType(DEFAULT_COUNTRY);
  return formatter.input(input);
}

/**
 * Pretty-print E.164 for display: "+628123456789" → "+62 812 3456 7890"
 * Useful for displaying back to user (e.g. in confirmation screens).
 */
export function formatPhoneE164(e164: string): string {
  try {
    const phone = parsePhoneNumberFromString(e164);
    return phone?.formatInternational() ?? e164;
  } catch {
    return e164;
  }
}
