import { notFound } from "next/navigation";
import { AppShell } from "@/components/app_shell";
import { FixedDepositPageView } from "@/components/fixed_deposit_page_view";
import {
  bank_code_to_label,
  slug_to_bank_code,
} from "@/lib/fixed_deposits/banks";
import { load_fixed_deposits } from "@/lib/fixed_deposits/load";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ bank: string }>;
};

export default async function FixedDepositsBankPage({ params }: Props) {
  const { bank: slug } = await params;
  const code = slug_to_bank_code(slug);
  if (!code) notFound();

  const load = await load_fixed_deposits(code);
  const label = bank_code_to_label(code);

  return (
    <AppShell
      title={`${label} · Fixed deposits`}
      description="Deposit register and maturity tracking"
      footer_note={`${label} fixed deposits · MYR`}
    >
      <FixedDepositPageView
        title={`${label} fixed deposits`}
        subtitle={`Filtered by bank code ${code}`}
        load={load}
        table_scope={`fd-${slug}`}
        show_bank_column={false}
      />
    </AppShell>
  );
}