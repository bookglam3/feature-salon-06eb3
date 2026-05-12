// ─────────────────────────────────────────────────────────
// Shared currency config — used by /pricing and /subscribe
// Covers: Europe, Middle East, South Asia, Americas, Asia-Pacific
// ─────────────────────────────────────────────────────────

export type CurrencyCode =
  | "GBP" | "EUR" | "USD" | "CAD" | "AUD" | "NZD"
  | "PKR" | "INR" | "BDT" | "LKR"
  | "AED" | "SAR" | "QAR" | "KWD" | "BHD" | "OMR" | "JOD" | "EGP"
  | "TRY" | "ZAR" | "NGN" | "KES"
  | "SEK" | "NOK" | "DKK" | "CHF" | "PLN" | "CZK" | "HUF" | "RON" | "BGN"
  | "MYR" | "SGD" | "THB" | "IDR" | "PHP" | "VND" | "JPY" | "KRW";

export interface Currency {
  code:      CurrencyCode;
  symbol:    string;
  flag:      string;
  name:      string;
  /** GBP prices × rate (approximate, display-only) */
  rate:      number;
  /** ISO 3166-1 alpha-2 country codes that map to this currency */
  countries: string[];
  /** Format a numeric amount for display */
  format:    (n: number) => string;
}

export const CURRENCIES: Record<CurrencyCode, Currency> = {
  // ── British Isles ──
  GBP: { code: "GBP", symbol: "£",   flag: "🇬🇧", name: "British Pound",    rate: 1,
    countries: ["GB", "JE", "GG", "IM"],
    format: (n) => `£${n.toLocaleString("en-GB")}` },

  // ── Euro Zone ──
  EUR: { code: "EUR", symbol: "€",   flag: "🇪🇺", name: "Euro",             rate: 1.17,
    countries: ["DE","FR","ES","IT","NL","BE","AT","PT","IE","FI","GR","SK","SI","EE","LV","LT","LU","MT","CY","HR","AD","MC","SM","VA"],
    format: (n) => `€${n.toLocaleString("de-DE")}` },

  // ── Americas ──
  USD: { code: "USD", symbol: "$",   flag: "🇺🇸", name: "US Dollar",        rate: 1.27,
    countries: ["US","PR","GU","VI","AS","MP","EC","SV","MH","FM","PW","TC","BQ","PA"],
    format: (n) => `$${n.toLocaleString("en-US")}` },
  CAD: { code: "CAD", symbol: "CA$", flag: "🇨🇦", name: "Canadian Dollar",   rate: 1.73,
    countries: ["CA"],
    format: (n) => `CA$${n.toLocaleString("en-CA")}` },
  AUD: { code: "AUD", symbol: "A$",  flag: "🇦🇺", name: "Australian Dollar", rate: 1.95,
    countries: ["AU", "CX", "CC", "NF"],
    format: (n) => `A$${n.toLocaleString("en-AU")}` },
  NZD: { code: "NZD", symbol: "NZ$", flag: "🇳🇿", name: "New Zealand Dollar",rate: 2.14,
    countries: ["NZ", "CK", "NU", "TK"],
    format: (n) => `NZ$${n.toLocaleString("en-NZ")}` },

  // ── Non-Euro Europe ──
  SEK: { code: "SEK", symbol: "kr",  flag: "🇸🇪", name: "Swedish Krona",    rate: 13.1,
    countries: ["SE"],
    format: (n) => `${n.toLocaleString("sv-SE")} kr` },
  NOK: { code: "NOK", symbol: "kr",  flag: "🇳🇴", name: "Norwegian Krone",  rate: 13.3,
    countries: ["NO", "SJ", "BV"],
    format: (n) => `${n.toLocaleString("nb-NO")} kr` },
  DKK: { code: "DKK", symbol: "kr",  flag: "🇩🇰", name: "Danish Krone",     rate: 8.75,
    countries: ["DK", "FO", "GL"],
    format: (n) => `${n.toLocaleString("da-DK")} kr` },
  CHF: { code: "CHF", symbol: "CHF", flag: "🇨🇭", name: "Swiss Franc",      rate: 1.13,
    countries: ["CH", "LI"],
    format: (n) => `CHF ${n.toLocaleString("de-CH")}` },
  PLN: { code: "PLN", symbol: "zł",  flag: "🇵🇱", name: "Polish Zloty",     rate: 5.05,
    countries: ["PL"],
    format: (n) => `${n.toLocaleString("pl-PL")} zł` },
  CZK: { code: "CZK", symbol: "Kč",  flag: "🇨🇿", name: "Czech Koruna",     rate: 29.2,
    countries: ["CZ"],
    format: (n) => `${n.toLocaleString("cs-CZ")} Kč` },
  HUF: { code: "HUF", symbol: "Ft",  flag: "🇭🇺", name: "Hungarian Forint", rate: 495,
    countries: ["HU"],
    format: (n) => `${n.toLocaleString("hu-HU")} Ft` },
  RON: { code: "RON", symbol: "lei", flag: "🇷🇴", name: "Romanian Leu",     rate: 5.82,
    countries: ["RO"],
    format: (n) => `${n.toLocaleString("ro-RO")} lei` },
  BGN: { code: "BGN", symbol: "лв",  flag: "🇧🇬", name: "Bulgarian Lev",    rate: 2.29,
    countries: ["BG"],
    format: (n) => `${n.toLocaleString("bg-BG")} лв` },
  TRY: { code: "TRY", symbol: "₺",   flag: "🇹🇷", name: "Turkish Lira",     rate: 40.8,
    countries: ["TR"],
    format: (n) => `₺${n.toLocaleString("tr-TR")}` },

  // ── Middle East ──
  AED: { code: "AED", symbol: "AED", flag: "🇦🇪", name: "UAE Dirham",       rate: 4.65,
    countries: ["AE"],
    format: (n) => `AED ${n.toLocaleString("ar-AE")}` },
  SAR: { code: "SAR", symbol: "SAR", flag: "🇸🇦", name: "Saudi Riyal",      rate: 4.75,
    countries: ["SA"],
    format: (n) => `SAR ${n.toLocaleString("ar-SA")}` },
  QAR: { code: "QAR", symbol: "QR",  flag: "🇶🇦", name: "Qatari Riyal",     rate: 4.62,
    countries: ["QA"],
    format: (n) => `QR ${n.toLocaleString("ar-QA")}` },
  KWD: { code: "KWD", symbol: "KD",  flag: "🇰🇼", name: "Kuwaiti Dinar",    rate: 0.39,
    countries: ["KW"],
    format: (n) => `KD ${n.toLocaleString("ar-KW")}` },
  BHD: { code: "BHD", symbol: "BD",  flag: "🇧🇭", name: "Bahraini Dinar",   rate: 0.48,
    countries: ["BH"],
    format: (n) => `BD ${n.toLocaleString("ar-BH")}` },
  OMR: { code: "OMR", symbol: "OMR", flag: "🇴🇲", name: "Omani Rial",       rate: 0.49,
    countries: ["OM"],
    format: (n) => `OMR ${n.toLocaleString("ar-OM")}` },
  JOD: { code: "JOD", symbol: "JD",  flag: "🇯🇴", name: "Jordanian Dinar",  rate: 0.90,
    countries: ["JO"],
    format: (n) => `JD ${n.toLocaleString("ar-JO")}` },
  EGP: { code: "EGP", symbol: "EGP", flag: "🇪🇬", name: "Egyptian Pound",   rate: 62,
    countries: ["EG"],
    format: (n) => `EGP ${n.toLocaleString("ar-EG")}` },

  // ── South Asia ──
  PKR: { code: "PKR", symbol: "₨",   flag: "🇵🇰", name: "Pakistani Rupee",  rate: 350,
    countries: ["PK"],
    format: (n) => `₨${n.toLocaleString("en-PK")}` },
  INR: { code: "INR", symbol: "₹",   flag: "🇮🇳", name: "Indian Rupee",     rate: 105,
    countries: ["IN"],
    format: (n) => `₹${n.toLocaleString("en-IN")}` },
  BDT: { code: "BDT", symbol: "৳",   flag: "🇧🇩", name: "Bangladeshi Taka", rate: 139,
    countries: ["BD"],
    format: (n) => `৳${n.toLocaleString("bn-BD")}` },
  LKR: { code: "LKR", symbol: "Rs",  flag: "🇱🇰", name: "Sri Lankan Rupee", rate: 380,
    countries: ["LK"],
    format: (n) => `Rs ${n.toLocaleString("si-LK")}` },

  // ── Africa ──
  ZAR: { code: "ZAR", symbol: "R",   flag: "🇿🇦", name: "South African Rand",rate: 23.5,
    countries: ["ZA"],
    format: (n) => `R ${n.toLocaleString("en-ZA")}` },
  NGN: { code: "NGN", symbol: "₦",   flag: "🇳🇬", name: "Nigerian Naira",   rate: 2060,
    countries: ["NG"],
    format: (n) => `₦${n.toLocaleString("en-NG")}` },
  KES: { code: "KES", symbol: "KSh", flag: "🇰🇪", name: "Kenyan Shilling",  rate: 163,
    countries: ["KE"],
    format: (n) => `KSh ${n.toLocaleString("sw-KE")}` },

  // ── Asia-Pacific ──
  SGD: { code: "SGD", symbol: "S$",  flag: "🇸🇬", name: "Singapore Dollar", rate: 1.70,
    countries: ["SG"],
    format: (n) => `S$${n.toLocaleString("en-SG")}` },
  MYR: { code: "MYR", symbol: "RM",  flag: "🇲🇾", name: "Malaysian Ringgit",rate: 5.95,
    countries: ["MY"],
    format: (n) => `RM ${n.toLocaleString("ms-MY")}` },
  THB: { code: "THB", symbol: "฿",   flag: "🇹🇭", name: "Thai Baht",        rate: 44.5,
    countries: ["TH"],
    format: (n) => `฿${n.toLocaleString("th-TH")}` },
  IDR: { code: "IDR", symbol: "Rp",  flag: "🇮🇩", name: "Indonesian Rupiah",rate: 20200,
    countries: ["ID"],
    format: (n) => `Rp ${n.toLocaleString("id-ID")}` },
  PHP: { code: "PHP", symbol: "₱",   flag: "🇵🇭", name: "Philippine Peso",  rate: 72,
    countries: ["PH"],
    format: (n) => `₱${n.toLocaleString("fil-PH")}` },
  VND: { code: "VND", symbol: "₫",   flag: "🇻🇳", name: "Vietnamese Dong",  rate: 32000,
    countries: ["VN"],
    format: (n) => `${n.toLocaleString("vi-VN")}₫` },
  JPY: { code: "JPY", symbol: "¥",   flag: "🇯🇵", name: "Japanese Yen",     rate: 192,
    countries: ["JP"],
    format: (n) => `¥${n.toLocaleString("ja-JP")}` },
  KRW: { code: "KRW", symbol: "₩",   flag: "🇰🇷", name: "South Korean Won", rate: 1700,
    countries: ["KR"],
    format: (n) => `₩${n.toLocaleString("ko-KR")}` },
};

/** Fixed display prices per currency (hand-curated, display-only) */
export const PLAN_PRICES: Record<CurrencyCode, [number, number, number]> = {
  GBP: [29,       59,       99      ],
  EUR: [34,       69,       115     ],
  USD: [37,       75,       125     ],
  CAD: [50,       102,      170     ],
  AUD: [57,       115,      195     ],
  NZD: [62,       126,      210     ],
  SEK: [380,      770,      1290    ],
  NOK: [390,      785,      1320    ],
  DKK: [255,      515,      865     ],
  CHF: [33,       67,       112     ],
  PLN: [147,      298,      499     ],
  CZK: [849,      1720,     2890    ],
  HUF: [14400,    29200,    48900   ],
  RON: [169,      342,      575     ],
  BGN: [67,       135,      226     ],
  TRY: [1185,     2400,     4050    ],
  AED: [135,      275,      459     ],
  SAR: [138,      280,      469     ],
  QAR: [134,      272,      455     ],
  KWD: [11,       23,       38      ],
  BHD: [14,       29,       48      ],
  OMR: [14,       29,       49      ],
  JOD: [26,       53,       89      ],
  EGP: [1799,     3650,     6100    ],
  PKR: [8500,     17000,    28500   ],
  INR: [3050,     6200,     10400   ],
  BDT: [4050,     8200,     13700   ],
  LKR: [11000,    22300,    37400   ],
  ZAR: [685,      1385,     2325    ],
  NGN: [59900,    121500,   203500  ],
  KES: [4750,     9650,     16100   ],
  SGD: [50,       101,      169     ],
  MYR: [173,      350,      588     ],
  THB: [1295,     2625,     4400    ],
  IDR: [587000,   1190000,  1995000 ],
  PHP: [2095,     4240,     7115    ],
  VND: [930000,   1885000,  3160000 ],
  JPY: [5580,     11300,    18950   ],
  KRW: [49500,    100200,   168000  ],
};

/** Detect best currency from ipapi.co country_code */
export function detectCurrency(countryCode: string): CurrencyCode {
  for (const [key, cur] of Object.entries(CURRENCIES)) {
    if (cur.countries.includes(countryCode)) return key as CurrencyCode;
  }
  // Fallback: GBP for unknown
  return "GBP";
}
