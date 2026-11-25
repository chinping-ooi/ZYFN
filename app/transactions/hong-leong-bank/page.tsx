import { AppShell } from "@/components/app_shell";
import { SupabaseTransactionPage } from "@/components/supabase_transaction_page";
import { StatementFromWorkbook } from "@/components/statement_from_workbook";
import { WorkbookStatusPanel } from "@/components/workbook_status";
import { HLB_ACCOUNT } from "@/lib/transactions/account_config";
import { supabase_configured } from "@/lib/supabase/env";
import { load_transaction_workbook } from "@/lib/workbook/load";
import { is_workbook_data } from "@/lib/workbook/types";

export const dynamic = "force-dynamic";

export default async function HongLeongPage() {
  if (supabase_configured()) {
    return (
      <AppShell
        title="Hong Leong Bank"
        description="Account statement · Supabase"
        footer_note="public.zyfn_transactions · HLB · MYR"
      >
        <SupabaseTransactionPage config={HLB_ACCOUNT} />
      </AppShell>
    );
  }

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