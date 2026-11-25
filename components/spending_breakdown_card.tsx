import { format_rm } from "@/lib/money";
import type { SpendingCategoryRow } from "@/lib/dashboard/spending_breakdown";
import { CardHead } from "@/components/card_head";

export function SpendingBreakdownCard({
  rows,
  month_label,
}: {
  rows: SpendingCategoryRow[];
  month_label: string;
}) {
  return (
    <section className="card overflow-hidden rounded-[3px] border border-zyfn-line bg-white">
      <CardHead
        title="Spending breakdown"
        subtitle={`By transaction type · ${month_label}`}
      />
      <div className="accounts px-5">
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-zyfn-muted">
            No spending in this month after exclusions.
          </p>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className="account flex items-center gap-3 border-b border-[#dce1e7] py-3.5 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <div className="bank-name text-sm font-semibold">{row.label}</div>
                <div className="account-type text-xs text-zyfn-muted">
                  {row.count} transaction{row.count === 1 ? "" : "s"} ·{" "}
                  {row.pct.toFixed(1)}%
                </div>
              </div>
              <div className="account-value ml-auto text-right text-sm font-semibold tabular-nums">
                {format_rm(row.amount_sen)}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}