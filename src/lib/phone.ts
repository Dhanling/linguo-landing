/**
 * Phone number validation & formatting for Linguo registration / checkout forms.
 *
 * Strategy:
 * - Default country: Indonesia (+62)
 * - Curated country list: Indo + main diaspora destinations
 * - Output: E.164 format (e.g. "+628123456789") — clean for WA blast & wa.me links
 *
 * Two validation modes:
 * - validatePhone(input)               → auto-detect country from prefix (e.g. user types "+65...")
 * - validatePhoneWithCountry(num, ID)  → explicit country (for split UI: dropdown + national number)
 */

import {
  parsePhoneNumberFromString,
  AsYouType,
  type CountryCode,
} from 'libphonenumber-js';

const DEFAULT_COUNTRY_CODE: CountryCode = 'ID';

export type Country = {
  code: CountryCode;        // ISO 'ID', 'SG', etc
  dialCode: string;         // '62', '65', etc (without +)
  flag: string;             // emoji 🇮🇩
  name: string;             // display name in Bahasa Indonesia
  examplePhone: string;     // local format example, no country code
};

/**
 * Curated list — covers ~99% Indonesian diaspora destinations.
 * Order: Indonesia first, then ASEAN neighbors, East Asia, Middle East, West.
 */
export const COUNTRIES: Country[] = [
  { code: 'ID', dialCode: '62',  flag: '🇮🇩', name: 'Indonesia',     examplePhone: '812 3456 7890' },
  { code: 'SG', dialCode: '65',  flag: '🇸🇬', name: 'Singapura',     examplePhone: '9123 4567'     },
  { code: 'MY', dialCode: '60',  flag: '🇲🇾', name: 'Malaysia',      examplePhone: '12 345 6789'   },
  { code: 'HK', dialCode: '852', flag: '🇭🇰', name: 'Hong Kong',     examplePhone: '5123 4567'     },
  { code: 'TW', dialCode: '886', flag: '🇹🇼', name: 'Taiwan',        examplePhone: '912 345 678'   },
  { code: 'KR', dialCode: '82',  flag: '🇰🇷', name: 'Korea Selatan', examplePhone: '10 1234 5678'  },
  { code: 'JP', dialCode: '81',  flag: '🇯🇵', name: 'Jepang',        examplePhone: '90 1234 5678'  },
  { code: 'SA', dialCode: '966', flag: '🇸🇦', name: 'Arab Saudi',    examplePhone: '51 234 5678'   },
  { code: 'AE', dialCode: '971', flag: '🇦🇪', name: 'UAE',           examplePhone: '50 123 4567'   },
  { code: 'AU', dialCode: '61',  flag: '🇦🇺', name: 'Australia',     examplePhone: '412 345 678'   },
  { code: 'NL', dialCode: '31',  flag: '🇳🇱', name: 'Belanda',       examplePhone: '6 12345678'    },
  { code: 'DE', dialCode: '49',  flag: '🇩🇪', name: 'Jerman',        examplePhone: '1512 3456789'  },
  { code: 'GB', dialCode: '44',  flag: '🇬🇧', name: 'Inggris',       examplePhone: '7400 123456'   },
  { code: 'US', dialCode: '1',   flag: '🇺🇸', name: 'Amerika',       examplePhone: '202 555 0123'  },
  { code: 'CN', dialCode: '86',  flag: '🇨🇳', name: 'China',         examplePhone: '131 2345 6789' },
];

export const DEFAULT_COUNTRY: Country = COUNTRIES[0]; // Indonesia

export function findCountry(code: CountryCode): Country {
  return COUNTRIES.find((c) => c.code === code) ?? DEFAULT_COUNTRY;
}

export type PhoneValidationResult = {
  valid: boolean;
  /** Canonical E.164 format, e.g. "+628123456789". Always set when valid=true. */
  e164: string | null;
  /** User-facing error message in Indonesian. Null when valid=true. */
  error: string | null;
};

/**
 * Validate phone number with explicit country code (preferred for split UI).
 *
 * @param nationalNumber  National number as user typed it (without dial code)
 * @param country         CountryCode from dropdown selector
 */
export function validatePhoneWithCountry(
  nationalNumber: string,
  country: CountryCode
): PhoneValidationResult {
  const trimmed = (nationalNumber ?? '').trim();

  if (!trimmed) {
    return { valid: false, e164: null, error: 'Nomor WhatsApp wajib diisi' };
  }

  const cleaned = trimmed.replace(/\D/g, '');
  if (cleaned.length < 4) {
    return { valid: false, e164: null, error: 'Nomor terlalu pendek' };
  }

  let phoneNumber;
  try {
    phoneNumber = parsePhoneNumberFromString(cleaned, country);
  } catch {
    return { valid: false, e164: null, error: 'Format nomor tidak valid' };
  }

  if (!phoneNumber) {
    return { valid: false, e164: null, error: 'Format nomor tidak valid' };
  }

  if (!phoneNumber.isValid()) {
    if (cleaned.length < 8) {
      return { valid: false, e164: null, error: 'Nomor terlalu pendek' };
    }
    return { valid: false, e164: null, error: 'Nomor tidak valid' };
  }

  // Indonesia-specific: must be a mobile (national starts with 8)
  if (country === 'ID') {
    const national = phoneNumber.nationalNumber.toString();
    if (!national.startsWith('8')) {
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
 * Auto-detect country from input prefix. Useful when input is a single field
 * accepting full international format like "+65 9123 4567" or "081234567890".
 *
 * Kept for backward compatibility — for new forms, prefer validatePhoneWithCountry().
 */
export function validatePhone(input: string): PhoneValidationResult {
  const trimmed = (input ?? '').trim();

  if (!trimmed) {
    return { valid: false, e164: null, error: 'Nomor WhatsApp wajib diisi' };
  }

  const cleaned = trimmed.replace(/[^\d+]/g, '');
  if (cleaned.length < 4) {
    return { valid: false, e164: null, error: 'Nomor terlalu pendek' };
  }

  let phoneNumber;
  try {
    phoneNumber = parsePhoneNumberFromString(cleaned, DEFAULT_COUNTRY_CODE);
  } catch {
    return { valid: false, e164: null, error: 'Format nomor tidak valid' };
  }

  if (!phoneNumber) {
    return { valid: false, e164: null, error: 'Format nomor tidak valid' };
  }

  if (!phoneNumber.isValid()) {
    if ((phoneNumber.number ?? '').replace(/\D/g, '').length < 10) {
      return { valid: false, e164: null, error: 'Nomor terlalu pendek' };
    }
    return { valid: false, e164: null, error: 'Nomor tidak valid' };
  }

  if (phoneNumber.country === 'ID') {
    const national = phoneNumber.nationalNumber.toString();
    if (!national.startsWith('8')) {
      return {
        valid: false,
        e164: null,
        error: 'Pakai nomor HP (mulai 08), bukan nomor rumah',
      };
    }
  }

  return { valid: true, e164: phoneNumber.number, error: null };
}

/**
 * Format phone as user types — for live UX feedback.
 * Returns formatted string with spaces, e.g. "812 3456 7890".
 */
export function formatPhoneAsYouType(
  input: string,
  country: CountryCode = DEFAULT_COUNTRY_CODE
): string {
  if (!input) return '';
  return new AsYouType(country).input(input);
}

/**
 * Pretty-print E.164 for display: "+628123456789" → "+62 812 3456 7890"
 */
export function formatPhoneE164(e164: string): string {
  try {
    const phone = parsePhoneNumberFromString(e164);
    return phone?.formatInternational() ?? e164;
  } catch {
    return e164;
  }
}
