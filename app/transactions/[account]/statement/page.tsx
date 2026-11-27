import { notFound, redirect } from "next/navigation";
import { TransactionAccountRoute } from "@/components/transaction_account_page";
import {
  account_by_prefix_and_slug,
  accounts_for_route_prefix,
  to_transaction_config,
} from "@/lib/accounts/registry";
import { resolve_wallet_hub_summary } from "@/lib/wallets/page_context";
import {
  is_wallet_child_slug,
  wallet_legacy_redirect_href,
} from "@/lib/wallets/routes";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ account: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function generateStaticParams() {
  return accounts_for_route_prefix("transactions").map((entry) => ({
    account: entry.slug,
  }));
}

const LEGACY_TNG_SLUGS = new Set(["tng-ewallet", "tng-go-plus"]);

export default async function TransactionAccountStatementPage({
  params,
  searchParams,
}: Props) {
  const { account: slug } = await params;
  const query = await searchParams;
  if (LEGACY_TNG_SLUGS.has(slug)) {
    redirect(wallet_legacy_redirect_href(slug, query, "statement"));
  }

  if (slug === "touch-n-go") {
    const wallet_param =
      typeof query.wallet === "string" ? query.wallet : undefined;
    if (wallet_param && !is_wallet_child_slug(wallet_param)) notFound();
    const hub = resolve_wallet_hub_summary(wallet_param);
    if (!hub) notFound();

    return (
      <TransactionAccountRoute
        title={hub.title}
        config={hub.config}
        account_slug={hub.account_slug}
        route_prefix="transactions"
        view_base_path={hub.view_base_path}
        wallet_toggle={hub.wallet_toggle}
      />
    );
  }

  const entry = account_by_prefix_and_slug("transactions", slug);
  if (!entry) notFound();

  return (
    <TransactionAccountRoute
      title={entry.title}
      config={to_transaction_config(entry)}
      account_slug={slug}
      route_prefix="transactions"
    />
  );
}