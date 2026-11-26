import { TransactionAppShell } from "@/components/transaction_app_shell";
import { AccountViewLoadingHeader } from "@/components/loading/account_view_loading_header";
import { CashFlowSummarySkeleton } from "@/components/skeletons/cash_flow_summary_skeleton";
import { TransactionStatementSkeleton } from "@/components/skeletons/transaction_statement_skeleton";

export function AccountSummaryRouteLoading({
  shell_title = "Account",
  show_mbb_breakdown_footer = false,
}: {
  shell_title?: string;
  show_mbb_breakdown_footer?: boolean;
}) {
  return (
    <TransactionAppShell title={shell_title} viewport_lock={false}>
      <div className="min-h-0">
        <AccountViewLoadingHeader />
        <CashFlowSummarySkeleton
          show_overview_footer={show_mbb_breakdown_footer}
        />
      </div>
    </TransactionAppShell>
  );
}

export function AccountStatementRouteLoading({
  shell_title = "Account",
}: {
  shell_title?: string;
}) {
  return (
    <TransactionAppShell title={shell_title}>
      <TransactionStatementSkeleton include_header={false} header_slot={<AccountViewLoadingHeader title="Account statement" />} />
    </TransactionAppShell>
  );
}