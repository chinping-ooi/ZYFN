"use client";

import { useMemo, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ensure_month_in_options,
  is_statement_month_key,
} from "@/lib/datetime/default_statement_month";
import { fixed_deposit_month_options } from "@/lib/fixed_deposits/month_filter";
import type { FixedDepositRecord } from "@/lib/fixed_deposits/types";

export function resolve_fd_month_from_query(
  query_month: string | null,
): string | "all" {
  if (!query_month || query_month === "all") return "all";
  if (is_statement_month_key(query_month)) return query_month;
  return "all";
}

export function useFixedDepositMonth(rows: FixedDepositRecord[]) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const month = useMemo(
    () => resolve_fd_month_from_query(searchParams.get("month")),
    [searchParams],
  );

  const base_options = useMemo(
    () => fixed_deposit_month_options(rows),
    [rows],
  );

  const month_options = useMemo(
    () => ensure_month_in_options(base_options, month),
    [base_options, month],
  );

  const set_month = useCallback(
    (value: string | "all") => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all") params.delete("month");
      else params.set("month", value);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  return { month, set_month, month_options };
}