import { notFound, redirect } from "next/navigation";
import { append_search_query } from "@/lib/accounts/view_paths";
import {
  is_mbb_2_gold_card_segment,
  MBB_2_GOLD_CARD_SEGMENTS,
  mbb_2_gold_card_href,
} from "@/lib/credit_cards/mbb_2_gold_routes";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ card: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function generateStaticParams() {
  return MBB_2_GOLD_CARD_SEGMENTS.map((card) => ({ card }));
}

export default async function Mbb2GoldCardLegacySummaryRedirect({
  params,
  searchParams,
}: Props) {
  const { card } = await params;
  if (!is_mbb_2_gold_card_segment(card)) notFound();

  redirect(
    append_search_query(mbb_2_gold_card_href(card), await searchParams),
  );
}