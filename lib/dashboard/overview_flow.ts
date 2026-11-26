import {
  cash_flow_income_sen,
  cash_flow_spending_sen,
} from "@/lib/dashboard/cash_flow_amounts";
import { is_cash_flow_excluded } from "@/lib/dashboard/cash_flow_exclusion";
import { is_fixed_deposit_daily_chart_row } from "@/lib/dashboard/spending_donut_fd";
import type { MonthKey } from "@/lib/dashboard/metrics";
import { kl_month_key } from "@/lib/datetime/kl_month_key";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import type { InOutFlowBreakdown } from "@/lib/transactions/in_out_flow";
import { build_overview_flow_slices } from "@/lib/transactions/in_out_flow";

/**
 * Dashboard Overview donut: cash-flow in, cash-flow out (no FD), and FD placement out.
 * Centre net matches dashboard KPIs (in − spending − FD outflows).
 */
export function dashboard_overview_flow_for_month(
  statements: AccountStatementFromDb[],
  month: MonthKey,
  in_label = "Total in",
  out_label = "Total out",
  fd_label = "FD",
): InOutFlowBreakdown {
  let total_in_sen = 0;
  let total_out_sen = 0;
  let total_fd_out_sen = 0;
  let total_in_micro = 0;
  let total_out_micro = 0;
  let total_fd_out_micro = 0;
  let in_count = 0;
  let out_count = 0;
  let fd_count = 0;

  for (const statement of statements) {
    const use_micro = statement.amount_scale === "micro";

    for (const row of statement.rows) {
      if (kl_month_key(row.date) !== month) continue;

      const in_sen = cash_flow_income_sen(row, statement.account_kind, use_micro);
      const out_sen = cash_flow_spending_sen(row, statement.account_kind, use_micro);
      const in_micro = row.in_micro;
      const out_micro = row.out_micro;

      const is_fd = is_fixed_deposit_daily_chart_row(row);

      if (is_fd) {
        if (in_sen > 0) {
          total_in_sen += in_sen;
          total_in_micro += in_micro;
          in_count += 1;
        }
        if (out_sen > 0) {
          total_fd_out_sen += out_sen;
          total_fd_out_micro += out_micro;
          fd_count += 1;
        }
        continue;
      }

      if (is_cash_flow_excluded(row, { account_kind: statement.account_kind })) {
        continue;
      }

      if (in_sen > 0) {
        total_in_sen += in_sen;
        total_in_micro += in_micro;
        in_count += 1;
      }
      if (out_sen > 0) {
        total_out_sen += out_sen;
        total_out_micro += out_micro;
        out_count += 1;
      }
    }
  }

  return build_overview_flow_slices({
    scale: "sen",
    in_label,
    out_label,
    fd_label,
    total_in_sen,
    total_out_sen,
    total_fd_out_sen,
    total_in_micro,
    total_out_micro,
    total_fd_out_micro,
    in_count,
    out_count,
    fd_count,
  });
}