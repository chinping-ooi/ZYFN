"use client";

import { MonthSelect } from "@/components/month_select";
import { WalletAccountToggle } from "@/components/wallet_account_toggle";

export function WalletPageControls({
  month,
  month_options,
  on_month_change,
}: {
  month: string;
  month_options: { value: string; label: string }[];
  on_month_change: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <WalletAccountToggle />
      <MonthSelect
        label="Statement month"
        value={month}
        options={month_options}
        onChange={on_month_change}
      />
    </div>
  );
}