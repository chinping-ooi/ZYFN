"use client";

import { WalletAccountToggle } from "@/components/wallet_account_toggle";

export function WalletPageControls() {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <WalletAccountToggle />
    </div>
  );
}