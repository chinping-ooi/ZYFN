const MONTH_TO_NUM: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
};

function expand_year_yy(yy: number): number {
  return yy >= 70 ? 1900 + yy : 2000 + yy;
}

function year_from_token(raw: string): number | null {
  if (raw.length === 4) {
    const y = Number.parseInt(raw, 10);
    return Number.isFinite(y) ? y : null;
  }
  if (raw.length === 2) {
    return expand_year_yy(Number.parseInt(raw, 10));
  }
  return null;
}

const HEADER_PATTERNS = [
  /Statement\s+Date\/?[\s\S]{0,400}?(\d{1,2})\s+([A-Z]{3})\s+(\d{2,4})\b/i,
  /Tarikh\s+Penyata[\s\S]{0,400}?(\d{1,2})\s+([A-Z]{3})\s+(\d{2,4})\b/i,
  /Statement\s+Date[\s\S]{0,200}?(\d{1,2})\s+([A-Z]{3})\s+(\d{2,4})\b/i,
];

export function parse_mbb_card_statement_header_date(text: string): {
  iso: string | null;
  month: number | null;
  year: number | null;
} {
  for (const pattern of HEADER_PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;
    const day = match[1].padStart(2, "0");
    const month_key = match[2].toUpperCase();
    const month = MONTH_TO_NUM[month_key];
    const year = year_from_token(match[3]);
    if (!month || year == null) continue;
    const iso = `${year}-${String(month).padStart(2, "0")}-${day}`;
    return { iso, month, year };
  }
  return { iso: null, month: null, year: null };
}