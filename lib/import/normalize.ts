/** Dedupe / comparison helper — collapse whitespace and case-fold. */
export function normalize_description_for_key(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
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