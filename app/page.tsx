import { AppShell } from "@/components/app_shell";
import { DashboardFromWorkbook } from "@/components/dashboard_from_workbook";
import { DataQualityNotice } from "@/components/data_quality_notice";
import { WorkbookStatusPanel } from "@/components/workbook_status";
import { build_dashboard_metrics } from "@/lib/workbook/dashboard_metrics";
import { load_transaction_workbook } from "@/lib/workbook/load";
import { is_workbook_data } from "@/lib/workbook/types";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const workbook = load_transaction_workbook();

  return (
    <AppShell
      title="Dashboard"
      description="Personal financial overview"
      footer_note="HLB + PBE from Transaction.xlsx · MYR"
    >
      {!is_workbook_data(workbook) ? (
        <WorkbookStatusPanel result={workbook} />
      ) : (
        <>
          <DataQualityNotice sheets={[workbook.hlb, workbook.pbe]} />
          <DashboardFromWorkbook
            metrics={build_dashboard_metrics(workbook.hlb, workbook.pbe)}
          />
        </>
      )}
    </AppShell>
  );
}