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

const DATE_PATTERNS = [
  /TARIKH\s+PENYATA[\s\S]{0,400}?(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{2,4})\b/i,
  /Statement\s+Date[\s\S]{0,240}?(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{2,4})\b/i,
  /TARIKH[\s\S]{0,80}?PENYATA[\s\S]{0,200}?(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{2,4})\b/i,
  /:\s*(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{2,4})\b/,
];

export function parse_mbb_savings_statement_date(text: string): {
  iso: string | null;
  month: number | null;
  year: number | null;
} {
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;
    const day = match[1].padStart(2, "0");
    const month = Number.parseInt(match[2], 10);
    const year = year_from_token(match[3]);
    if (month < 1 || month > 12 || year == null) continue;
    const iso = `${year}-${String(month).padStart(2, "0")}-${day}`;
    return { iso, month, year };
  }
  return { iso: null, month: null, year: null };
}