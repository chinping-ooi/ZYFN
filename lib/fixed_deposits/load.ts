import { unstable_noStore as noStore } from "next/cache";
import { MOCK_FIXED_DEPOSITS } from "@/lib/fixed_deposits/mock_data";
import {
  bank_code_to_label,
  ordered_bank_codes,
} from "@/lib/fixed_deposits/banks";
import type {
  FixedDepositLoadResult,
  FixedDepositRecord,
} from "@/lib/fixed_deposits/types";
import { create_supabase_server_client } from "@/lib/supabase/server";
import { supabase_configured } from "@/lib/supabase/env";

type SupabaseFdRow = {
  id: number;
  account_id: number;
  receipt_no: string;
  principal: number | string;
  interest_rate: number | string;
  start_date: string;
  maturity_date: string;
  interest_earned: number | string | null;
  status: number;
  account: {
    code: string;
    institution: string | null;
    account_name: string | null;
  } | null;
};

function num(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : Number(value);
}

function map_row(row: SupabaseFdRow): FixedDepositRecord {
  const account = Array.isArray(row.account) ? row.account[0] : row.account;
  const code = account?.code ?? "UNK";
  return {
    id: row.id,
    account_id: row.account_id,
    bank_code: code,
    bank_label: bank_code_to_label(code, account?.institution),
    receipt_no: row.receipt_no,
    principal_major: num(row.principal),
    interest_rate: num(row.interest_rate),
    start_date: row.start_date,
    maturity_date: row.maturity_date,
    interest_earned_major:
      row.interest_earned === null || row.interest_earned === undefined
        ? null
        : num(row.interest_earned),
    status: row.status === 1 ? 1 : 0,
  };
}

function mock_result(filter_code?: string): FixedDepositLoadResult {
  const rows = filter_code
    ? MOCK_FIXED_DEPOSITS.filter((r) => r.bank_code === filter_code)
    : MOCK_FIXED_DEPOSITS;
  return {
    source: "mock",
    configured: false,
    rows,
    bank_codes: ordered_bank_codes(
      MOCK_FIXED_DEPOSITS.map((r) => r.bank_code),
    ),
    empty_from_supabase: false,
  };
}

export async function load_fixed_deposits(
  filter_code?: string,
): Promise<FixedDepositLoadResult> {
  noStore();

  if (!supabase_configured()) {
    return mock_result(filter_code);
  }

  try {
    const supabase = await create_supabase_server_client();
    const { data, error } = await supabase
      .from("zyfn_fixed_deposits")
      .select(
        `
        id,
        account_id,
        receipt_no,
        principal,
        interest_rate,
        start_date,
        maturity_date,
        interest_earned,
        status,
        account:zyfn_accounts!inner (
          code,
          institution,
          account_name
        )
      `,
      )
      .order("maturity_date", { ascending: true });

    if (error) {
      console.error("zyfn_fixed_deposits:", error.message);
      return {
        source: "supabase",
        configured: true,
        rows: [],
        bank_codes: [],
        empty_from_supabase: true,
      };
    }

    let rows = (data ?? []).map((row) =>
      map_row(row as unknown as SupabaseFdRow),
    );
    if (filter_code) {
      rows = rows.filter((r) => r.bank_code === filter_code);
    }

    const codes_result = await supabase
      .from("zyfn_fixed_deposits")
      .select("account:zyfn_accounts!inner (code)")
      .limit(500);

    const bank_codes = ordered_bank_codes(
      (codes_result.data ?? [])
        .map((r) => (r as { account?: { code?: string } }).account?.code)
        .filter((c): c is string => Boolean(c)),
    );

    return {
      source: "supabase",
      configured: true,
      rows,
      bank_codes,
      empty_from_supabase: rows.length === 0,
    };
  } catch (error) {
    console.error(error);
    return {
      source: "supabase",
      configured: true,
      rows: [],
      bank_codes: [],
      empty_from_supabase: true,
    };
  }
}

export async function list_fd_bank_codes(): Promise<string[]> {
  const loaded = await load_fixed_deposits();
  return loaded.bank_codes;
}