import { notFound, redirect } from "next/navigation";
import { append_search_query } from "@/lib/accounts/view_paths";
import { slug_to_bank_code } from "@/lib/fixed_deposits/banks";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ bank: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FixedDepositsBankLegacyRedirect({
  params,
  searchParams,
}: Props) {
  const { bank: slug } = await params;
  if (!slug_to_bank_code(slug)) notFound();

  redirect(
    append_search_query("/fixed-deposits", {
      ...(await searchParams),
      bank: slug,
    }),
  );
}