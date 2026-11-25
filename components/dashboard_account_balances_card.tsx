import { format_rm } from "@/lib/money";
import type { DashboardBalanceRow } from "@/lib/dashboard/dashboard_balances";
import { CardHead } from "@/components/card_head";

export function DashboardAccountBalancesCard({
  rows,
  className = "",
}: {
  rows: DashboardBalanceRow[];
  className?: string;
}) {
  return (
    <section
      className={`card flex shrink-0 flex-col overflow-hidden rounded-[3px] border border-zyfn-line bg-white ${className}`}
    >
      <CardHead
        title="Account balances"
        subtitle="Savings, wallet, and active fixed deposits"
        align="center"
      />
      <div className="px-5">
        {rows.map((account) => (
          <div
            key={account.id}
            className="flex items-center gap-2 border-b border-[#dce1e7] py-2 last:border-0"
          >
            <div className="min-w-0 flex-1 text-sm font-semibold leading-tight">
              {account.name}
            </div>
            <div className="shrink-0 text-right text-sm font-semibold tabular-nums">
              {format_rm(account.balance_sen)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}