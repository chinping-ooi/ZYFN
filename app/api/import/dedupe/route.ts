import { NextResponse } from "next/server";
import { dedupe_import_rows } from "@/lib/supabase/import_transactions";
import type { NormalizedImportRow } from "@/lib/import/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      account_id: number;
      rows: NormalizedImportRow[];
    };
    if (!body.account_id || !Array.isArray(body.rows)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const rows = await dedupe_import_rows(body.account_id, body.rows);
    return NextResponse.json({ rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Dedupe failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}