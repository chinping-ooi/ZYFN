import { notFound, redirect } from "next/navigation";
import { TransactionAccountRoute } from "@/components/transaction_account_page";
import {
  account_by_prefix_and_slug,
  accounts_for_route_prefix,
  to_transaction_config,
} from "@/lib/accounts/registry";
import {
  append_month_query,
  MBB_2_GOLD_LEGACY_SLUGS,
  mbb_2_gold_legacy_statement_redirect,
} from "@/lib/credit_cards/mbb_2_gold_routes";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ account: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const CREDIT_CARD_SUMMARY_ONLY_SLUGS = new Set(["mbb-2-gold"]);

export function generateStaticParams() {
  return accounts_for_route_prefix("credit-cards")
    .filter((entry) => !CREDIT_CARD_SUMMARY_ONLY_SLUGS.has(entry.slug))
    .map((entry) => ({
      account: entry.slug,
    }));
}

export default async function CreditCardAccountPage({
  params,
  searchParams,
}: Props) {
  const { account: slug } = await params;
  if (CREDIT_CARD_SUMMARY_ONLY_SLUGS.has(slug)) notFound();

  if (MBB_2_GOLD_LEGACY_SLUGS.has(slug)) {
    const target = mbb_2_gold_legacy_statement_redirect(slug);
    if (target) {
      redirect(append_month_query(target, await searchParams));
    }
  }

  const entry = account_by_prefix_and_slug("credit-cards", slug);
  if (!entry) notFound();

  return (
    <TransactionAccountRoute
      title={entry.title}
      config={to_transaction_config(entry)}
      account_slug={slug}
      route_prefix="credit-cards"
    />
  );
}