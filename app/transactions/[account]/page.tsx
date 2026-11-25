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
  return accounts_for_route_prefix("transactions").map((entry) => ({
    account: entry.slug,
  }));
}

export default async function TransactionAccountPage({ params }: Props) {
  const { account: slug } = await params;
  const entry = account_by_prefix_and_slug("transactions", slug);
  if (!entry) notFound();

  return (
    <TransactionAccountRoute
      title={entry.title}
      config={to_transaction_config(entry)}
    />
  );
}