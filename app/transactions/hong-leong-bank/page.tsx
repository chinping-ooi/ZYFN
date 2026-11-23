import { AppShell } from "@/components/app_shell";
import { HlbStatementView } from "@/components/hlb_statement_view";

export default function HongLeongPage() {
  return (
    <AppShell
      title="Hong Leong Bank"
      description="Transactions · demo data (Transaction.xlsx later)"
      footer_note="Demo HLB sample · MYR"
    >
      <HlbStatementView />
    </AppShell>
  );
}