"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  ensure_month_in_options,
  resolve_statement_month_from_query,
} from "@/lib/datetime/default_statement_month";
import { fixed_deposit_month_options } from "@/lib/fixed_deposits/month_filter";
import type { FixedDepositRecord } from "@/lib/fixed_deposits/types";
import { useGlobalMonthUrl } from "@/lib/hooks/use_global_month_url";

export function resolve_fd_month_from_query(
  query_month: string | null,
  available_month_keys: string[],
): string | "all" {
  if (query_month === "all") return "all";
  return resolve_statement_month_from_query(query_month, available_month_keys);
}

export function useFixedDepositMonth(rows: FixedDepositRecord[]) {
  const searchParams = useSearchParams();
  const { set_month_param } = useGlobalMonthUrl();

  const base_options = useMemo(
    () => fixed_deposit_month_options(rows),
    [rows],
  );

  const available_month_keys = useMemo(
    () => base_options.map((o) => o.value).filter((v) => v !== "all"),
    [base_options],
  );

  const month = useMemo(
    () =>
      resolve_fd_month_from_query(
        searchParams.get("month"),
        available_month_keys,
      ),
    [searchParams, available_month_keys],
  );

  const month_options = useMemo(
    () => ensure_month_in_options(base_options, month),
    [base_options, month],
  );

  const set_month = useCallback(
    (value: string | "all") => {
      set_month_param(value);
    },
    [set_month_param],
  );

  return { month, set_month, month_options };
}