import { notFound } from "next/navigation";
import { TransactionAccountRoute } from "@/components/transaction_account_page";
import {
  account_by_prefix_and_slug,
  accounts_for_route_prefix,
  to_transaction_config,
} from "@/lib/accounts/registry";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ account: string }>;
};

export function generateStaticParams() {
  return accounts_for_route_prefix("credit-cards", {
    include_summary_only: false,
  }).map((entry) => ({
    account: entry.slug,
  }));
}

export default async function CreditCardAccountPage({ params }: Props) {
  const { account: slug } = await params;
  const entry = account_by_prefix_and_slug("credit-cards", slug);
  if (!entry || entry.summary_only) notFound();

  return (
    <TransactionAccountRoute
      title={entry.title}
      config={to_transaction_config(entry)}
      account_slug={slug}
      route_prefix="credit-cards"
    />
  );
}