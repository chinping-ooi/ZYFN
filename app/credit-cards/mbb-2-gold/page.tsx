import { TransactionAccountSummaryRoute } from "@/components/transaction_account_summary_page";
import {
  account_by_prefix_and_slug,
  to_transaction_config,
} from "@/lib/accounts/registry";
import { mbb_2_gold_combined_href } from "@/lib/credit_cards/mbb_2_gold_routes";

export const dynamic = "force-dynamic";

export default async function Mbb2GoldCombinedPage() {
  const entry = account_by_prefix_and_slug("credit-cards", "mbb-2-gold");
  if (!entry) {
    throw new Error("Missing MBB 2 Gold registry entry");
  }

  return (
    <TransactionAccountSummaryRoute
      title={entry.title}
      config={to_transaction_config(entry)}
      account_slug={entry.slug}
      route_prefix="credit-cards"
      view_base_path={mbb_2_gold_combined_href()}
      hide_view_tabs
    />
  );
}