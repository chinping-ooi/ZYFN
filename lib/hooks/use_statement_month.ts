"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";
import { transaction_month_options } from "@/lib/supabase/transaction_statement";
import {
  ensure_month_in_options,
  resolve_statement_month_from_query,
} from "@/lib/datetime/default_statement_month";

export function useStatementMonth(rows: TransactionDbRow[]) {
  const searchParams = useSearchParams();
  const query_month = searchParams.get("month");

  const base_options = useMemo(
    () => transaction_month_options(rows),
    [rows],
  );

  const available_month_keys = useMemo(
    () => base_options.map((o) => o.value).filter((v) => v !== "all"),
    [base_options],
  );

  const [month, set_month] = useState<string | "all">(() =>
    resolve_statement_month_from_query(query_month, available_month_keys),
  );

  const month_options = useMemo(
    () => ensure_month_in_options(base_options, month),
    [base_options, month],
  );

  return { month, set_month, month_options };
}

/** @alias useStatementMonth */
export const use_statement_month = useStatementMonth;