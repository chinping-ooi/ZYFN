import { AppShell } from "@/components/app_shell";
import { StatementFromWorkbook } from "@/components/statement_from_workbook";
import { WorkbookStatusPanel } from "@/components/workbook_status";
import { load_transaction_workbook } from "@/lib/workbook/load";
import { is_workbook_data } from "@/lib/workbook/workbook_guards";

export const dynamic = "force-dynamic";

export default function PublicBankPage() {
  const workbook = load_transaction_workbook();

  return (
    <AppShell
      title="Public Bank"
      description="Account statement · PBE sheet"
      footer_note="Transaction.xlsx / PBE · MYR"
    >
      {!is_workbook_data(workbook) ? (
        <WorkbookStatusPanel result={workbook} />
      ) : (
        <StatementFromWorkbook sheet={workbook.pbe} />
      )}
    </AppShell>
  );
}