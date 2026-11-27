import { redirect } from "next/navigation";
import {
  append_month_query,
  mbb_2_gold_combined_href,
} from "@/lib/credit_cards/mbb_2_gold_routes";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Mbb2GoldLegacySummaryRedirect({
  searchParams,
}: Props) {
  const params = await searchParams;
  redirect(append_month_query(mbb_2_gold_combined_href(), params));
}