import { AppShell } from "@/components/app_shell";
import { StatementFromWorkbook } from "@/components/statement_from_workbook";
import { WorkbookStatusPanel } from "@/components/workbook_status";
import { load_transaction_workbook } from "@/lib/workbook/load";
import { is_workbook_data } from "@/lib/workbook/types";

export const dynamic = "force-dynamic";

export default function HongLeongPage() {
  const workbook = load_transaction_workbook();

  return (
    <AppShell
      title="Hong Leong Bank"
      description="Account statement · HLB sheet"
      footer_note="Transaction.xlsx / HLB · MYR"
    >
      {!is_workbook_data(workbook) ? (
        <WorkbookStatusPanel result={workbook} />
      ) : (
        <StatementFromWorkbook sheet={workbook.hlb} />
      )}
    </AppShell>
  );
}