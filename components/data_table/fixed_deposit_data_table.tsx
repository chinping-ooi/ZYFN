"use client";

import { DataTable } from "@/components/data_table/data_table";
import {
  fixed_deposit_columns,
  type FixedDepositDataRow,
} from "@/components/data_table/fixed_deposit_columns";

type Props = {
  label: string;
  scope: string;
  rows: FixedDepositDataRow[];
  show_bank?: boolean;
  export_account_label?: string;
  loading?: boolean;
};

export function FixedDepositDataTable({
  label,
  scope,
  rows,
  show_bank = false,
  export_account_label,
  loading,
}: Props) {
  return (
    <DataTable<FixedDepositDataRow>
      label={label}
      scope={scope}
      columns={fixed_deposit_columns(show_bank)}
      rows={rows}
      date_key="maturity_date"
      empty_period_message="No fixed deposits in this view."
      inset={false}
      export_account_label={export_account_label}
      loading={loading}
      skeleton_variant="fixed_deposit"
      skeleton_show_bank={show_bank}
    />
  );
}