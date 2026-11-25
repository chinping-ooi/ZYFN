import { AppShell } from "@/components/app_shell";
import { DashboardFromWorkbook } from "@/components/dashboard_from_workbook";
import { DataQualityNotice } from "@/components/data_quality_notice";
import { WorkbookStatusPanel } from "@/components/workbook_status";
import { build_dashboard_metrics } from "@/lib/workbook/dashboard_metrics";
import { load_transaction_workbook } from "@/lib/workbook/load";
import { is_workbook_data } from "@/lib/workbook/workbook_guards";
import { load_tng_data } from "@/lib/tng/load";
import { is_tng_data } from "@/lib/tng/tng_guards";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const workbook = load_transaction_workbook();
  const tng = load_tng_data();

  return (
    <AppShell
      title="Dashboard"
      description="Personal financial overview"
      footer_note="HLB + PBE + TNG sources · MYR"
    >
      {!is_workbook_data(workbook) ? (
        <WorkbookStatusPanel result={workbook} />
      ) : (
        <>
          <DataQualityNotice sheets={[workbook.hlb, workbook.pbe]} />
          <DashboardFromWorkbook
            metrics={build_dashboard_metrics(
              workbook.hlb,
              workbook.pbe,
              is_tng_data(tng) ? tng : null,
            )}
          />
        </>
      )}
    </AppShell>
  );
}