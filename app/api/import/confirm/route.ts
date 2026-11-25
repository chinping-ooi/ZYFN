import { NextResponse } from "next/server";
import { confirm_import_rows } from "@/lib/supabase/import_transactions";
import type { ImportConfirmRow, ImportSourceKind } from "@/lib/import/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      account_id: number;
      account_ref: string;
      source_filename: string;
      source_kind: ImportSourceKind;
      rows: ImportConfirmRow[];
    };
    if (
      !body.account_id ||
      !body.source_filename ||
      !body.source_kind ||
      !Array.isArray(body.rows)
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const result = await confirm_import_rows(body);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}