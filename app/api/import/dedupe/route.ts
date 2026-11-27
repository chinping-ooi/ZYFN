import { NextResponse } from "next/server";
import { account_config_by_ref } from "@/lib/accounts/registry";
import type { NormalizedImportRow } from "@/lib/import/types";
import { dedupe_import_rows } from "@/lib/supabase/import_transactions";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      account_id: number;
      account_ref?: string;
      rows: NormalizedImportRow[];
    };
    if (!body.account_id || !Array.isArray(body.rows)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const kind = body.account_ref
      ? account_config_by_ref(body.account_ref)?.kind
      : undefined;
    const rows = await dedupe_import_rows(
      body.account_id,
      body.rows,
      kind,
      body.account_ref,
    );
    return NextResponse.json({ rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Dedupe failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}