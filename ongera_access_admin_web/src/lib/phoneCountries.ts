export type PhoneCountry = {
  iso: string;
  name: string;
  dial: string;
  flag: string;
};

/** Curated list; Rwanda first as the product default. */
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: 'RW', name: 'Rwanda', dial: '250', flag: '🇷🇼' },
  { iso: 'BI', name: 'Burundi', dial: '257', flag: '🇧🇮' },
  { iso: 'CD', name: 'DR Congo', dial: '243', flag: '🇨🇩' },
  { iso: 'UG', name: 'Uganda', dial: '256', flag: '🇺🇬' },
  { iso: 'KE', name: 'Kenya', dial: '254', flag: '🇰🇪' },
  { iso: 'TZ', name: 'Tanzania', dial: '255', flag: '🇹🇿' },
  { iso: 'ET', name: 'Ethiopia', dial: '251', flag: '🇪🇹' },
  { iso: 'SS', name: 'South Sudan', dial: '211', flag: '🇸🇸' },
  { iso: 'ZA', name: 'South Africa', dial: '27', flag: '🇿🇦' },
  { iso: 'NG', name: 'Nigeria', dial: '234', flag: '🇳🇬' },
  { iso: 'GH', name: 'Ghana', dial: '233', flag: '🇬🇭' },
  { iso: 'BE', name: 'Belgium', dial: '32', flag: '🇧🇪' },
  { iso: 'FR', name: 'France', dial: '33', flag: '🇫🇷' },
  { iso: 'DE', name: 'Germany', dial: '49', flag: '🇩🇪' },
  { iso: 'GB', name: 'United Kingdom', dial: '44', flag: '🇬🇧' },
  { iso: 'US', name: 'United States', dial: '1', flag: '🇺🇸' },
  { iso: 'CA', name: 'Canada', dial: '1', flag: '🇨🇦' },
  { iso: 'IN', name: 'India', dial: '91', flag: '🇮🇳' },
  { iso: 'CN', name: 'China', dial: '86', flag: '🇨🇳' },
  { iso: 'AE', name: 'United Arab Emirates', dial: '971', flag: '🇦🇪' },
];

export const DEFAULT_PHONE_COUNTRY_ISO = 'RW';

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function getPhoneCountry(iso: string): PhoneCountry {
  return (
    PHONE_COUNTRIES.find((c) => c.iso === iso) ??
    PHONE_COUNTRIES.find((c) => c.iso === DEFAULT_PHONE_COUNTRY_ISO)!
  );
}

/** Longest dial codes first so +250 wins over +2, etc. */
const DIAL_MATCHERS = [...PHONE_COUNTRIES].sort(
  (a, b) => b.dial.length - a.dial.length,
);

export function parsePhoneValue(value: string): {
  iso: string;
  national: string;
} {
  const trimmed = value.trim();
  if (!trimmed) {
    return { iso: DEFAULT_PHONE_COUNTRY_ISO, national: '' };
  }

  const digits = digitsOnly(trimmed.startsWith('+') ? trimmed.slice(1) : trimmed);
  const match = DIAL_MATCHERS.find((c) => digits.startsWith(c.dial));
  if (!match) {
    return { iso: DEFAULT_PHONE_COUNTRY_ISO, national: digits };
  }

  return {
    iso: match.iso,
    national: digits.slice(match.dial.length),
  };
}

export function formatPhoneValue(dial: string, national: string): string {
  const n = digitsOnly(national);
  if (!n) return '';
  return `+${digitsOnly(dial)}${n}`;
}
