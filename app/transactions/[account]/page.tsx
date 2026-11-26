import { notFound, redirect } from "next/navigation";
import { TransactionAccountSummaryRoute } from "@/components/transaction_account_summary_page";
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
  return accounts_for_route_prefix("transactions").map((entry) => ({
    account: entry.slug,
  }));
}

const LEGACY_TNG_SLUGS = new Set(["tng-ewallet", "tng-go-plus"]);

export default async function TransactionAccountPage({ params }: Props) {
  const { account: slug } = await params;
  if (LEGACY_TNG_SLUGS.has(slug)) {
    redirect("/transactions/touch-n-go");
  }
  const entry = account_by_prefix_and_slug("transactions", slug);
  if (!entry) notFound();

  return (
    <TransactionAccountSummaryRoute
      title={entry.title}
      config={to_transaction_config(entry)}
      account_slug={slug}
      route_prefix="transactions"
    />
  );
}