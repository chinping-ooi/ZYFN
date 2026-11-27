import { unstable_noStore as noStore } from "next/cache";
import { cache } from "react";
import {
  build_dashboard_metrics,
  type DashboardLoadResult,
} from "@/lib/dashboard/metrics";
import { load_account_transactions } from "@/lib/supabase/load_account_transactions";
import { is_account_statement_data } from "@/lib/supabase/account_statement_guards";
import { supabase_configured } from "@/lib/supabase/env";
import { DASHBOARD_ACCOUNTS } from "@/lib/transactions/account_config";

async function load_dashboard_impl(): Promise<DashboardLoadResult> {
  noStore();

  if (!supabase_configured()) {
    return {
      kind: "missing",
      message:
        "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local to load the dashboard from Supabase.",
    };
  }

  const statements = [];
  const errors: string[] = [];

  for (const config of DASHBOARD_ACCOUNTS) {
    const result = await load_account_transactions(
      config.account_ref,
      config.account_label,
      config.kind,
      config.account_id ?? null,
      config.account_code ?? null,
      { allow_empty: true },
    );
    if (is_account_statement_data(result)) {
      statements.push(result);
    } else if (result.kind === "error") {
      errors.push(result.message);
    }
  }

  if (statements.length === 0) {
    return {
      kind: "error",
      message:
        errors[0] ??
        "No ledger data loaded from Supabase for dashboard accounts. Check RLS policies and account rows.",
      details: errors.length > 1 ? errors.slice(1).join(" · ") : undefined,
    };
  }

  return {
    kind: "data",
    metrics: build_dashboard_metrics(statements),
    statements,
  };
}

export const load_dashboard = cache(load_dashboard_impl);