"use client";

import { useCallback, useMemo, useState } from "react";
import {
  dashboard_summary_account_options,
  read_dashboard_summary_account_pref,
  write_dashboard_summary_account_pref,
} from "@/lib/dashboard/dashboard_summary";

export function useDashboardSummaryAccount() {
  const options = useMemo(() => dashboard_summary_account_options(), []);
  const [account_key, set_key] = useState(() =>
    read_dashboard_summary_account_pref(),
  );

  const set_account_key = useCallback((key: string) => {
    set_key(key);
    write_dashboard_summary_account_pref(key);
  }, []);

  return { account_key, set_account_key, account_options: options };
}