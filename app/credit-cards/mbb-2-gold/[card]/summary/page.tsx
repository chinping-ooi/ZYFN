import { notFound } from "next/navigation";
import { TransactionAccountSummaryRoute } from "@/components/transaction_account_summary_page";
import { to_transaction_config } from "@/lib/accounts/registry";
import {
  is_mbb_2_gold_card_segment,
  MBB_2_GOLD_CARD_SEGMENTS,
  mbb_2_gold_card_href,
  mbb_2_gold_registry_entry_for_card,
} from "@/lib/credit_cards/mbb_2_gold_routes";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ card: string }>;
};

export function generateStaticParams() {
  return MBB_2_GOLD_CARD_SEGMENTS.map((card) => ({ card }));
}

export default async function Mbb2GoldCardSummaryPage({ params }: Props) {
  const { card } = await params;
  if (!is_mbb_2_gold_card_segment(card)) notFound();

  const entry = mbb_2_gold_registry_entry_for_card(card);
  if (!entry) notFound();

  return (
    <TransactionAccountSummaryRoute
      title={entry.title}
      config={to_transaction_config(entry)}
      account_slug={entry.slug}
      route_prefix="credit-cards"
      view_base_path={mbb_2_gold_card_href(card)}
      show_mbb_2_gold_link
    />
  );
}