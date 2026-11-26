import { notFound, redirect } from "next/navigation";
import { append_search_query } from "@/lib/accounts/view_paths";
import {
  account_by_prefix_and_slug,
  accounts_for_route_prefix,
} from "@/lib/accounts/registry";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ account: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const LEGACY_TNG_SLUGS = new Set(["tng-ewallet", "tng-go-plus"]);

export function generateStaticParams() {
  return accounts_for_route_prefix("transactions").map((entry) => ({
    account: entry.slug,
  }));
}

export default async function TransactionAccountLegacySummaryRedirect({
  params,
  searchParams,
}: Props) {
  const { account: slug } = await params;
  if (LEGACY_TNG_SLUGS.has(slug)) {
    redirect(
      append_search_query("/transactions/touch-n-go", await searchParams),
    );
  }
  const entry = account_by_prefix_and_slug("transactions", slug);
  if (!entry) notFound();

  redirect(
    append_search_query(`/transactions/${slug}`, await searchParams),
  );
}