"use client";

import { useSearchParams } from "next/navigation";
import { FixedDepositSummaryCards } from "@/components/fixed_deposit_summary";
import { FixedDepositDataTable } from "@/components/data_table/fixed_deposit_data_table";
import type { FixedDepositDataRow } from "@/components/data_table/fixed_deposit_columns";
import type { FixedDepositLoadResult } from "@/lib/fixed_deposits/types";
import { summarize_fixed_deposits } from "@/lib/fixed_deposits/summary";
import { to_table_rows } from "@/lib/fixed_deposits/transform";
import {
  bank_code_to_label,
  slug_to_bank_code,
} from "@/lib/fixed_deposits/banks";
import { PageToolbar } from "@/components/page_toolbar";
import { AccountTableCard } from "@/components/account_table_card";
import { FixedDepositBankToggle } from "@/components/fixed_deposit_bank_toggle";

function filter_rows_by_bank_slug(
  rows: FixedDepositLoadResult["rows"],
  bank_slug: string | null,
) {
  if (!bank_slug) return rows;
  const code = slug_to_bank_code(bank_slug);
  if (!code) return rows;
  return rows.filter((row) => row.bank_code === code);
}

export function FixedDepositPageView({
  load,
}: {
  load: FixedDepositLoadResult;
}) {
  const searchParams = useSearchParams();
  const bank_slug = searchParams.get("bank")?.trim() || null;
  const bank_code = bank_slug ? slug_to_bank_code(bank_slug) : null;

  const visible_rows = filter_rows_by_bank_slug(load.rows, bank_slug);
  const summary = summarize_fixed_deposits(visible_rows);
  const table_rows = to_table_rows(visible_rows) as FixedDepositDataRow[];

  const source_note =
    load.source === "unconfigured"
      ? "Supabase is not configured — fixed deposit tables are empty."
      : load.empty_from_supabase
        ? "Supabase returned no rows."
        : "Loaded from Supabase.";

  const title = bank_code
    ? `${bank_code_to_label(bank_code)} fixed deposits`
    : "All fixed deposits";

  const subtitle = bank_code
    ? `Filtered by bank code ${bank_code} · ${source_note}`
    : `Active and matured placements across banks · ${source_note}`;

  const table_scope = bank_slug ? `fd-${bank_slug}` : "fd-all";
  const show_bank_column = !bank_code;

  return (
    <>
      <PageToolbar
        title={title}
        subtitle={subtitle}
        controls={
          <FixedDepositBankToggle bank_codes={load.bank_codes} />
        }
      />

      {load.configured && load.empty_from_supabase ? (
        <aside
          className="mb-5 rounded-[3px] border border-[#decea9] bg-[#faf6ec] px-4 py-3 text-sm text-[#805e23]"
          role="status"
        >
          No fixed deposits were returned. Row Level Security is enabled on{" "}
          <code className="text-xs">zyfn_accounts</code> and{" "}
          <code className="text-xs">zyfn_fixed_deposits</code> — add a{" "}
          <code className="text-xs">SELECT</code> policy for the publishable
          role (see deployment notes) before live data appears.
        </aside>
      ) : null}

      <FixedDepositSummaryCards summary={summary} />

      <AccountTableCard title="Deposit register">
        <FixedDepositDataTable
          label={title}
          scope={table_scope}
          export_account_label={title}
          rows={table_rows}
          show_bank={show_bank_column}
        />
      </AccountTableCard>
    </>
  );
}