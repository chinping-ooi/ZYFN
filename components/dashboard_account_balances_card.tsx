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
      className={`card flex shrink-0 flex-col overflow-visible rounded-[3px] border border-zyfn-line bg-white ${className}`}
    >
      <CardHead
        compact
        title="Account balances"
        subtitle="Savings, wallet, and active fixed deposits"
        align="center"
      />
      <div className="px-4 pb-2 md:px-5 md:pb-3">
        {rows.map((account) => (
          <div
            key={account.id}
            className="flex items-center gap-2 border-b border-[#dce1e7] py-1 last:border-0 md:py-1.5"
          >
            <div className="min-w-0 flex-1 text-xs font-semibold leading-tight md:text-sm">
              {account.name}
            </div>
            <div className="shrink-0 text-right text-xs font-semibold tabular-nums md:text-sm">
              {format_rm(account.balance_sen)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}