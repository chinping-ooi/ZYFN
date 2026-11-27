/** Dedupe / comparison helper — collapse whitespace and case-fold. */
export function normalize_description_for_key(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Dedupe fuzzy compare: uppercase, collapse spaces, strip punctuation. */
export function normalize_description_for_dedupe(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function description_tokens(normalized: string): string[] {
  return normalized.split(" ").filter((t) => t.length > 0);
}

/** Same merchant text if one normalized string contains the other or token overlap ≥ 60%. */
export function descriptions_fuzzy_match(left: string, right: string): boolean {
  const a = normalize_description_for_dedupe(left);
  const b = normalize_description_for_dedupe(right);
  if (!a || !b) return a === b;
  if (a.includes(b) || b.includes(a)) return true;
  const ta = new Set(description_tokens(a));
  const tb = new Set(description_tokens(b));
  if (ta.size === 0 || tb.size === 0) return false;
  let shared = 0;
  for (const token of ta) {
    if (tb.has(token)) shared += 1;
  }
  const overlap = shared / Math.min(ta.size, tb.size);
  return overlap >= 0.6;
}

export function dedupe_key_parts(input: {
  account_id: number;
  txn_at: string;
  amount_major: string;
  description: string;
  balance_after_major: string;
}): string {
  const date = input.txn_at.slice(0, 10);
  const amount = input.amount_major.trim();
  const balance = input.balance_after_major.trim();
  const desc = normalize_description_for_key(input.description);
  return [
    String(input.account_id),
    date,
    amount,
    desc,
    balance,
  ].join("|");
}