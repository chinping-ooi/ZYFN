import { KpiCardSkeleton } from "@/components/skeletons/kpi_card_skeleton";
import { SpendingBreakdownSkeleton } from "@/components/skeletons/spending_breakdown_skeleton";
import { CashFlowChartSkeleton } from "@/components/skeletons/cash_flow_chart_skeleton";
import { AccountBalancesSkeleton } from "@/components/skeletons/account_balances_skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardLoadingContent() {
  return (
    <div className="dashboard-shell">
      <header className="dashboard-toolbar">
        <div className="min-w-0">
          <h2 className="m-0 text-[17px] font-semibold">Monthly summary</h2>
          <Skeleton className="mt-[6px] h-[13px] w-[min(100%,22rem)]" />
        </div>
        <Skeleton className="h-9 w-[11.5rem] shrink-0" />
      </header>

      <div className="dashboard-columns" data-gap-check="body">
        <div className="dashboard-column dashboard-column-left">
          <div className="dashboard-kpi-row" aria-busy="true" aria-label="Loading">
            <KpiCardSkeleton compact_amount snug />
            <KpiCardSkeleton compact_amount snug />
          </div>
          <SpendingBreakdownSkeleton
            content_sized
            column_fill
            className="min-h-0 flex-1"
          />
        </div>
        <div className="dashboard-column dashboard-column-right">
          <CashFlowChartSkeleton
            className="shrink-0"
            title="Daily spending"
            subtitle=" "
          />
          <AccountBalancesSkeleton column_fill className="min-h-0 flex-1" />
        </div>
      </div>
    </div>
  );
}