// ─────────────────────────────────────────────────────────
// Shared currency config — used by /pricing and /subscribe
// ─────────────────────────────────────────────────────────

export type CurrencyCode = "GBP" | "PKR" | "AED" | "SAR";

export interface Currency {
  code:       CurrencyCode;
  symbol:     string;
  flag:       string;
  name:       string;
  /** GBP prices × rate (approximate, display-only) */
  rate:       number;
  /** ipapi.co country_code values that map to this currency */
  countries:  string[];
  /** Format a numeric amount for display */
  format:     (n: number) => string;
}

export const CURRENCIES: Record<CurrencyCode, Currency> = {
  GBP: {
    code: "GBP", symbol: "£", flag: "🇬🇧", name: "British Pound", rate: 1,
    countries: ["GB"],
    format: (n) => `£${n.toLocaleString("en-GB")}`,
  },
  PKR: {
    code: "PKR", symbol: "₨", flag: "🇵🇰", name: "Pakistani Rupee", rate: 350,
    countries: ["PK"],
    format: (n) => `₨${n.toLocaleString("en-PK")}`,
  },
  AED: {
    code: "AED", symbol: "AED", flag: "🇦🇪", name: "UAE Dirham", rate: 4.65,
    countries: ["AE"],
    format: (n) => `AED ${n.toLocaleString("en-AE")}`,
  },
  SAR: {
    code: "SAR", symbol: "SAR", flag: "🇸🇦", name: "Saudi Riyal", rate: 4.75,
    countries: ["SA"],
    format: (n) => `SAR ${n.toLocaleString("en-SA")}`,
  },
};

/** Fixed display prices per currency (not rate-calculated — hand-curated) */
export const PLAN_PRICES: Record<CurrencyCode, [number, number, number]> = {
  GBP: [29,     59,     99    ],
  PKR: [8500,   17000,  28000 ],
  AED: [109,    219,    369   ],
  SAR: [109,    219,    369   ],
};

/** Detect currency from ipapi.co country_code */
export function detectCurrency(countryCode: string): CurrencyCode {
  for (const [key, cur] of Object.entries(CURRENCIES)) {
    if (cur.countries.includes(countryCode)) return key as CurrencyCode;
  }
  return "GBP";
}
