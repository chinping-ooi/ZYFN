import type { MicroAmount } from "@/lib/tng/money_micro";
import type { ReconcileWarning, TngAccount, TngLedgerRow } from "@/lib/tng/types";
import {
  detect_dump_chronology,
  sort_tng_rows,
  type DumpChronology,
  type TngRowWithOrder,
} from "@/lib/tng/sort_rows";

function movement_amount(row: TngLedgerRow): MicroAmount {
  return row.debit_micro > 0 ? row.debit_micro : row.credit_micro;
}

function is_quick_reload_to_wallet(row: TngLedgerRow): boolean {
  return row.description.toLowerCase().includes("quick reload payment");
}

function is_go_plus_cash_in(row: TngLedgerRow): boolean {
  return row.type === "GO+ Cash In";
}

function mismatch_pattern(
  delta: MicroAmount,
  amount: MicroAmount,
  prev_amount: MicroAmount | null,
): Pick<
  ReconcileWarning,
  "matches_amount" | "matches_2x_amount" | "matches_prev_row_amount"
> {
  const abs = Math.abs(delta);
  const two = amount * 2;
  return {
    matches_amount: amount > 0 && abs === amount,
    matches_2x_amount: amount > 0 && abs === two,
    matches_prev_row_amount:
      prev_amount !== null && prev_amount > 0 && abs === prev_amount,
  };
}

function build_warning(
  row: TngRowWithOrder,
  account: TngAccount,
  delta: MicroAmount,
  amount: MicroAmount,
  prev_amount: MicroAmount | null,
  first_of_day_in_ledger: boolean,
): ReconcileWarning {
  return {
    dump_order: row.dump_order,
    account,
    type: row.type,
    status: row.status,
    first_of_day_in_ledger,
    mismatch_sign: delta > 0 ? "positive" : "negative",
    ...mismatch_pattern(delta, amount, prev_amount),
  };
}

export function reconcile_tng_rows(
  rows: TngRowWithOrder[],
  dump_chronology: DumpChronology,
): { rows: TngLedgerRow[]; reconcile_warnings: ReconcileWarning[] } {
  const sorted = sort_tng_rows(rows, dump_chronology);
  const warnings: ReconcileWarning[] = [];

  let wallet_running: MicroAmount | null = null;
  let go_running: MicroAmount | null = null;

  const last_date: Record<TngAccount, string | null> = {
    wallet: null,
    go_plus: null,
  };
  let prev_wallet_amount: MicroAmount | null = null;
  let prev_go_amount: MicroAmount | null = null;

  for (const row of sorted) {
    row.reconcile_ok = true;

    if (!row.affects_totals) {
      continue;
    }

    const amount = movement_amount(row);

    if (row.account === "wallet") {
      const first_of_day = last_date.wallet !== row.date;
      if (wallet_running !== null) {
        const expected =
          wallet_running - row.debit_micro + row.credit_micro;
        const delta = row.balance_micro - expected;
        if (delta !== 0) {
          row.reconcile_ok = false;
          warnings.push(
            build_warning(
              row,
              "wallet",
              delta,
              amount,
              prev_wallet_amount,
              first_of_day,
            ),
          );
        }
      }
      wallet_running = row.balance_micro;
      last_date.wallet = row.date;
      prev_wallet_amount = amount;

      if (is_go_plus_cash_in(row)) {
        go_running = (go_running ?? 0) + amount;
      } else if (is_quick_reload_to_wallet(row)) {
        if (go_running !== null) {
          go_running -= amount;
        }
      }
    } else {
      // GO+ earnings rows report authoritative statement balance (coinflow anchors).
      go_running = row.balance_micro;
      last_date.go_plus = row.date;
      prev_go_amount = amount;
    }
  }

  return { rows: sorted, reconcile_warnings: warnings };
}

export function finalize_tng_rows(
  rows: TngRowWithOrder[],
  dump_dates_in_order: string[],
): {
  rows: TngLedgerRow[];
  reconcile_warnings: ReconcileWarning[];
} {
  const chronology = detect_dump_chronology(dump_dates_in_order);
  return reconcile_tng_rows(rows, chronology);
}