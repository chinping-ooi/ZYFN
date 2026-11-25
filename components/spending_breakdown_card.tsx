import { format_rm } from "@/lib/money";
import type { SpendingTransactionRow } from "@/lib/dashboard/spending_breakdown";
import { spending_total_sen } from "@/lib/dashboard/spending_breakdown";
import { CardHead } from "@/components/card_head";

export function SpendingBreakdownCard({
  rows,
  month_label,
  className = "",
}: {
  rows: SpendingTransactionRow[];
  month_label: string;
  className?: string;
}) {
  const total_sen = spending_total_sen(rows);

  return (
    <section
      className={`card flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[3px] border border-zyfn-line bg-white ${className}`}
    >
      <CardHead
        title="Spending breakdown"
        subtitle={`Transactions · ${month_label}`}
      />
      {rows.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-zyfn-muted">
          No spending in this month after exclusions.
        </p>
      ) : (
        <>
          <div className="accounts min-h-0 flex-1 overflow-y-auto px-5">
            {rows.map((row) => (
              <div
                key={row.id}
                className="account flex items-center gap-3 border-b border-[#dce1e7] py-3.5 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="bank-name text-sm font-semibold">
                    <span className="text-zyfn-muted">{row.date_label}</span>
                    {" · "}
                    {row.label}
                  </div>
                  <div className="account-type text-xs text-zyfn-muted">
                    {row.account}
                  </div>
                </div>
                <div className="account-value ml-auto shrink-0 text-right text-sm font-semibold tabular-nums">
                  {format_rm(row.amount_sen)}
                </div>
              </div>
            ))}
          </div>
          <div className="flex shrink-0 items-center justify-between border-t border-zyfn-line bg-[#fafbfc] px-5 py-3.5 text-sm">
            <span className="font-semibold text-zyfn-ink">Total</span>
            <span className="font-semibold tabular-nums text-zyfn-ink">
              {format_rm(total_sen)}
            </span>
          </div>
        </>
      )}
    </section>
  );
}