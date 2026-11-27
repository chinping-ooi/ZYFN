type LedgerDraft = {
  parse_index: number;
  txn_at: string;
  printed_balance_major?: string | null;
};

function day_key(txn_at: string): string {
  return txn_at.slice(0, 10);
}

/**
 * When balances rise down the PDF (parse_index increases), the file is
 * newest-first; ledger order is descending parse_index.
 */
function same_day_ledger_uses_descending_index(group: LedgerDraft[]): boolean {
  const with_bal = group.filter(
    (g) =>
      g.printed_balance_major != null &&
      Number.isFinite(Number(g.printed_balance_major)),
  );
  if (with_bal.length < 2) return false;
  const by_index = [...with_bal].sort(
    (a, b) => a.parse_index - b.parse_index,
  );
  const first = Number(by_index[0]!.printed_balance_major);
  const last = Number(by_index.at(-1)!.printed_balance_major);
  return first < last - 0.001;
}

export function sort_hlb_ledger_drafts<T extends LedgerDraft>(drafts: T[]): T[] {
  const sorted = [...drafts].sort(
    (a, b) =>
      a.txn_at.localeCompare(b.txn_at) || a.parse_index - b.parse_index,
  );
  const out: T[] = [];
  let i = 0;
  while (i < sorted.length) {
    const key = day_key(sorted[i]!.txn_at);
    const group: T[] = [];
    while (i < sorted.length && day_key(sorted[i]!.txn_at) === key) {
      group.push(sorted[i]!);
      i += 1;
    }
    const descending = same_day_ledger_uses_descending_index(group);
    group.sort((a, b) =>
      descending
        ? b.parse_index - a.parse_index
        : a.parse_index - b.parse_index,
    );
    out.push(...group);
  }
  return out;
}

export function stamp_hlb_ledger_txn_at<T extends { txn_at: string }>(
  ledger_order: T[],
): void {
  const by_day = new Map<string, number>();
  for (const item of ledger_order) {
    const day = day_key(item.txn_at);
    const seq = by_day.get(day) ?? 0;
    item.txn_at = `${day}T${String(seq).padStart(2, "0")}:00:00.000Z`;
    by_day.set(day, seq + 1);
  }
}

export function parse_index_from_temp_id(temp_id: string): number {
  const match = temp_id.match(/(\d+)$/);
  return match ? Number.parseInt(match[1], 10) : 0;
}