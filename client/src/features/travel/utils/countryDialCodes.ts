export interface CountryDialCode {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  placeholder: string;
  minDigits: number;
  maxDigits: number;
  pattern?: RegExp;
  formatHint?: string;
}

export const COUNTRIES: CountryDialCode[] = [
  {
    code: 'IN',
    name: 'India',
    dialCode: '+91',
    flag: '🇮🇳',
    placeholder: '98765 43210',
    minDigits: 10,
    maxDigits: 10,
    pattern: /^[6-9]\d{9}$/,
    formatHint: '10 digits starting with 6, 7, 8, or 9',
  },
  {
    code: 'US',
    name: 'United States',
    dialCode: '+1',
    flag: '🇺🇸',
    placeholder: '(555) 000-0000',
    minDigits: 10,
    maxDigits: 10,
    pattern: /^[2-9]\d{2}[2-9]\d{6}$/,
    formatHint: '10 digits with valid area code',
  },
  {
    code: 'CA',
    name: 'Canada',
    dialCode: '+1',
    flag: '🇨🇦',
    placeholder: '(555) 000-0000',
    minDigits: 10,
    maxDigits: 10,
    pattern: /^[2-9]\d{2}[2-9]\d{6}$/,
    formatHint: '10 digits with valid area code',
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    dialCode: '+44',
    flag: '🇬🇧',
    placeholder: '7911 123456',
    minDigits: 10,
    maxDigits: 11,
    pattern: /^(?:7\d{9}|[1-9]\d{9,10})$/,
    formatHint: '10 to 11 digits',
  },
  {
    code: 'JP',
    name: 'Japan',
    dialCode: '+81',
    flag: '🇯🇵',
    placeholder: '90 1234 5678',
    minDigits: 10,
    maxDigits: 11,
    pattern: /^(?:[789]0\d{8}|[1-9]\d{9})$/,
    formatHint: '10 to 11 digits',
  },
  {
    code: 'SG',
    name: 'Singapore',
    dialCode: '+65',
    flag: '🇸🇬',
    placeholder: '8123 4567',
    minDigits: 8,
    maxDigits: 8,
    pattern: /^[89]\d{7}$/,
    formatHint: '8 digits starting with 8 or 9',
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    dialCode: '+971',
    flag: '🇦🇪',
    placeholder: '50 123 4567',
    minDigits: 9,
    maxDigits: 9,
    pattern: /^5\d{8}$/,
    formatHint: '9 digits starting with 5',
  },
  {
    code: 'DE',
    name: 'Germany',
    dialCode: '+49',
    flag: '🇩🇪',
    placeholder: '151 12345678',
    minDigits: 10,
    maxDigits: 12,
    pattern: /^(?:1[5-7]\d{8,10}|[1-9]\d{9,11})$/,
    formatHint: '10 to 12 digits',
  },
  {
    code: 'AU',
    name: 'Australia',
    dialCode: '+61',
    flag: '🇦🇺',
    placeholder: '412 345 678',
    minDigits: 9,
    maxDigits: 9,
    pattern: /^4\d{8}$/,
    formatHint: '9 digits starting with 4',
  },
  {
    code: 'FR',
    name: 'France',
    dialCode: '+33',
    flag: '🇫🇷',
    placeholder: '6 12 34 56 78',
    minDigits: 9,
    maxDigits: 9,
    pattern: /^[67]\d{8}$/,
    formatHint: '9 digits starting with 6 or 7',
  },
  {
    code: 'NL',
    name: 'Netherlands',
    dialCode: '+31',
    flag: '🇳🇱',
    placeholder: '6 12345678',
    minDigits: 9,
    maxDigits: 9,
    pattern: /^6\d{8}$/,
    formatHint: '9 digits starting with 6',
  },
  {
    code: 'CH',
    name: 'Switzerland',
    dialCode: '+41',
    flag: '🇨🇭',
    placeholder: '79 123 45 67',
    minDigits: 9,
    maxDigits: 9,
    pattern: /^7[5-9]\d{7}$/,
    formatHint: '9 digits starting with 75-79',
  },
  {
    code: 'IE',
    name: 'Ireland',
    dialCode: '+353',
    flag: '🇮🇪',
    placeholder: '85 123 4567',
    minDigits: 9,
    maxDigits: 9,
    pattern: /^8[3-9]\d{7}$/,
    formatHint: '9 digits starting with 83-89',
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    dialCode: '+966',
    flag: '🇸🇦',
    placeholder: '50 123 4567',
    minDigits: 9,
    maxDigits: 9,
    pattern: /^5\d{8}$/,
    formatHint: '9 digits starting with 5',
  },
  {
    code: 'CN',
    name: 'China',
    dialCode: '+86',
    flag: '🇨🇳',
    placeholder: '138 0000 0000',
    minDigits: 11,
    maxDigits: 11,
    pattern: /^1[3-9]\d{9}$/,
    formatHint: '11 digits starting with 1',
  },
  {
    code: 'HK',
    name: 'Hong Kong',
    dialCode: '+852',
    flag: '🇭🇰',
    placeholder: '9123 4567',
    minDigits: 8,
    maxDigits: 8,
    pattern: /^[4-9]\d{7}$/,
    formatHint: '8 digits starting with 4-9',
  },
  {
    code: 'KR',
    name: 'South Korea',
    dialCode: '+82',
    flag: '🇰🇷',
    placeholder: '10 1234 5678',
    minDigits: 9,
    maxDigits: 11,
    pattern: /^(?:10\d{7,8}|[1-9]\d{8,10})$/,
    formatHint: '9 to 11 digits',
  },
  {
    code: 'MY',
    name: 'Malaysia',
    dialCode: '+60',
    flag: '🇲🇾',
    placeholder: '12 345 6789',
    minDigits: 9,
    maxDigits: 10,
    pattern: /^1[0-9]\d{7,8}$/,
    formatHint: '9 to 10 digits starting with 1',
  },
  {
    code: 'PH',
    name: 'Philippines',
    dialCode: '+63',
    flag: '🇵🇭',
    placeholder: '917 123 4567',
    minDigits: 10,
    maxDigits: 10,
    pattern: /^9\d{9}$/,
    formatHint: '10 digits starting with 9',
  },
  {
    code: 'TH',
    name: 'Thailand',
    dialCode: '+66',
    flag: '🇹🇭',
    placeholder: '81 234 5678',
    minDigits: 9,
    maxDigits: 9,
    pattern: /^[689]\d{8}$/,
    formatHint: '9 digits starting with 6, 8, or 9',
  },
  {
    code: 'ID',
    name: 'Indonesia',
    dialCode: '+62',
    flag: '🇮🇩',
    placeholder: '812 3456 7890',
    minDigits: 9,
    maxDigits: 12,
    pattern: /^8\d{8,11}$/,
    formatHint: '9 to 12 digits starting with 8',
  },
  {
    code: 'VN',
    name: 'Vietnam',
    dialCode: '+84',
    flag: '🇻🇳',
    placeholder: '91 234 5678',
    minDigits: 9,
    maxDigits: 9,
    pattern: /^[35789]\d{8}$/,
    formatHint: '9 digits starting with 3, 5, 7, 8, or 9',
  },
  {
    code: 'ES',
    name: 'Spain',
    dialCode: '+34',
    flag: '🇪🇸',
    placeholder: '612 34 56 78',
    minDigits: 9,
    maxDigits: 9,
    pattern: /^[67]\d{8}$/,
    formatHint: '9 digits starting with 6 or 7',
  },
  {
    code: 'IT',
    name: 'Italy',
    dialCode: '+39',
    flag: '🇮🇹',
    placeholder: '312 345 6789',
    minDigits: 9,
    maxDigits: 10,
    pattern: /^3\d{8,9}$/,
    formatHint: '9 to 10 digits starting with 3',
  },
  {
    code: 'SE',
    name: 'Sweden',
    dialCode: '+46',
    flag: '🇸🇪',
    placeholder: '70 123 45 67',
    minDigits: 9,
    maxDigits: 9,
    pattern: /^7\d{8}$/,
    formatHint: '9 digits starting with 7',
  },
  {
    code: 'NO',
    name: 'Norway',
    dialCode: '+47',
    flag: '🇳🇴',
    placeholder: '412 34 567',
    minDigits: 8,
    maxDigits: 8,
    pattern: /^[49]\d{7}$/,
    formatHint: '8 digits starting with 4 or 9',
  },
  {
    code: 'DK',
    name: 'Denmark',
    dialCode: '+45',
    flag: '🇩🇰',
    placeholder: '20 12 34 56',
    minDigits: 8,
    maxDigits: 8,
    pattern: /^[2-9]\d{7}$/,
    formatHint: '8 digits',
  },
  {
    code: 'NZ',
    name: 'New Zealand',
    dialCode: '+64',
    flag: '🇳🇿',
    placeholder: '21 123 4567',
    minDigits: 8,
    maxDigits: 10,
    pattern: /^2\d{7,9}$/,
    formatHint: '8 to 10 digits starting with 2',
  },
  {
    code: 'ZA',
    name: 'South Africa',
    dialCode: '+27',
    flag: '🇿🇦',
    placeholder: '82 123 4567',
    minDigits: 9,
    maxDigits: 9,
    pattern: /^[678]\d{8}$/,
    formatHint: '9 digits starting with 6, 7, or 8',
  },
  {
    code: 'BR',
    name: 'Brazil',
    dialCode: '+55',
    flag: '🇧🇷',
    placeholder: '11 91234 5678',
    minDigits: 10,
    maxDigits: 11,
    pattern: /^[1-9]{2}9\d{8}$/,
    formatHint: '10 to 11 digits starting with area code + 9',
  },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // India (+91)

export function findCountryByDialCode(dialCode: string): CountryDialCode | undefined {
  if (!dialCode) return undefined;
  const normalized = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
  return COUNTRIES.find((c) => c.dialCode === normalized);
}

export function filterCountries(query: string): CountryDialCode[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return COUNTRIES;

  const normalizedQuery = trimmed.startsWith('+') ? trimmed.slice(1) : trimmed;

  return COUNTRIES.filter((c) => {
    const nameMatch = c.name.toLowerCase().includes(trimmed);
    const codeMatch = c.code.toLowerCase().includes(trimmed);
    const dialMatch = c.dialCode.toLowerCase().includes(trimmed) || c.dialCode.slice(1).includes(normalizedQuery);
    return nameMatch || codeMatch || dialMatch;
  });
}

/**
 * Splits a full international phone number string (e.g. "+91 9876543210")
 * into its CountryDialCode and nationalNumber components.
 */
export function splitPhoneNumber(fullPhone: string): {
  country: CountryDialCode;
  nationalNumber: string;
} {
  if (!fullPhone || typeof fullPhone !== 'string') {
    return { country: DEFAULT_COUNTRY, nationalNumber: '' };
  }

  const trimmed = fullPhone.trim();

  // Sort dial codes by length descending (e.g. +971 before +91) to match longest prefix
  const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);

  for (const c of sorted) {
    if (trimmed.startsWith(c.dialCode)) {
      const rest = trimmed.slice(c.dialCode.length).trim().replace(/[^\d]/g, '');
      return { country: c, nationalNumber: rest };
    }
  }

  // If starts with + but no exact match in 30 countries, fallback to default
  const digitsOnly = trimmed.replace(/[^\d]/g, '');
  return { country: DEFAULT_COUNTRY, nationalNumber: digitsOnly };
}

/**
 * Returns specific error message for invalid phone input, or null if valid.
 */
export function getPhoneValidationError(fullPhone: string): string | null {
  if (!fullPhone || typeof fullPhone !== 'string' || !fullPhone.trim()) {
    return 'Emergency contact phone is required';
  }

  const trimmed = fullPhone.trim();
  const { country, nationalNumber } = splitPhoneNumber(trimmed);
  const nationalDigits = nationalNumber.replace(/\D/g, '');

  if (!nationalDigits) {
    return `Please enter a phone number for ${country.name} (${country.dialCode})`;
  }

  // Block dummy numbers where all national digits are identical (e.g. 0000000000 or 9999999999)
  if (/^(\d)\1+$/.test(nationalDigits)) {
    return 'Please enter a valid, non-dummy phone number';
  }

  // Length boundaries check
  if (nationalDigits.length < country.minDigits || nationalDigits.length > country.maxDigits) {
    if (country.minDigits === country.maxDigits) {
      return `${country.name} (${country.dialCode}) phone numbers must be exactly ${country.minDigits} digits`;
    }
    return `${country.name} (${country.dialCode}) phone numbers must be between ${country.minDigits} and ${country.maxDigits} digits`;
  }

  // Country-specific pattern check (e.g. India starts with 6-9, US valid area code)
  if (country.pattern && !country.pattern.test(nationalDigits)) {
    const hint = country.formatHint ? ` (${country.formatHint})` : '';
    return `Invalid phone number format for ${country.name} (${country.dialCode})${hint}`;
  }

  return null;
}

/**
 * Validates whether an emergency phone number is valid according to its country rules.
 */
export function isValidEmergencyPhone(fullPhone: string): boolean {
  return getPhoneValidationError(fullPhone) === null;
}
