import { account_config_by_ref } from "@/lib/accounts/registry";
import type { ImportParsedAccount } from "@/lib/import/types";

const PRODUCT_ACCOUNTS: Array<{
  pattern: RegExp;
  account_ref: string;
  account_id: number;
}> = [
  {
    pattern: /MAYBANK\s+2\s+GOLD\s+VISA/i,
    account_ref: "MBB_VISA_1697",
    account_id: 8,
  },
  {
    pattern: /MAYBANK\s+2\s+GOLD\s+AMEX/i,
    account_ref: "MBB_AMEX_8060",
    account_id: 9,
  },
];

function collapse_spaces(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function scan_mbb_card_accounts_from_text(
  text: string,
): ImportParsedAccount[] {
  const accounts: ImportParsedAccount[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = collapse_spaces(raw.replace(/\t/g, " "));
    for (const entry of PRODUCT_ACCOUNTS) {
      if (!entry.pattern.test(line)) continue;
      if (accounts.some((a) => a.account_id === entry.account_id)) continue;
      const config = account_config_by_ref(entry.account_ref);
      accounts.push({
        account_id: entry.account_id,
        account_ref: entry.account_ref,
        account_label: config?.account_label ?? entry.account_ref,
      });
    }
  }
  return accounts;
}