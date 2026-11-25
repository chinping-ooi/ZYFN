import { AppShell } from "@/components/app_shell";
import { HlbStatementFromSupabase } from "@/components/hlb_statement_from_supabase";
import { StatementFromWorkbook } from "@/components/statement_from_workbook";
import { SupabaseStatusPanel } from "@/components/supabase_status_panel";
import { WorkbookStatusPanel } from "@/components/workbook_status";
import { load_hlb_statement } from "@/lib/supabase/load_hlb";
import { is_hlb_db_data } from "@/lib/supabase/types";
import { supabase_configured } from "@/lib/supabase/env";
import { load_transaction_workbook } from "@/lib/workbook/load";
import { is_workbook_data } from "@/lib/workbook/types";

export const dynamic = "force-dynamic";

export default async function HongLeongPage() {
  if (supabase_configured()) {
    const statement = await load_hlb_statement();

    return (
      <AppShell
        title="Hong Leong Bank"
        description="Account statement · Supabase"
        footer_note="public.zyfn_transactions · HLB · MYR"
      >
        {!is_hlb_db_data(statement) ? (
          <SupabaseStatusPanel result={statement} />
        ) : (
          <HlbStatementFromSupabase data={statement} />
        )}
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