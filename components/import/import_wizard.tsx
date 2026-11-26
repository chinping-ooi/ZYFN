"use client";

import { useCallback, useMemo, useState } from "react";
import { Upload } from "lucide-react";
import { ACCOUNTS } from "@/lib/accounts/registry";
import { parse_csv_text, parse_excel_buffer } from "@/lib/import/excel";
import { parse_statement_text } from "@/lib/import/parsers";
import { extract_pbe_card_meta } from "@/lib/import/parsers/pbe_card";
import {
  load_column_mapping,
  save_column_mapping,
} from "@/lib/import/spreadsheet_mapping";
import type {
  ImportConfirmResult,
  ImportSourceKind,
  NormalizedImportRow,
  SpreadsheetColumnMapping,
} from "@/lib/import/types";
import { extract_pdf_text_local } from "@/lib/import/pdf_extract";
import { AccountTableCard } from "@/components/account_table_card";
import { DataTable } from "@/components/data_table/data_table";
import { ColumnMappingForm } from "@/components/import/column_mapping_form";
import {
  IMPORT_PREVIEW_COLUMNS,
  type ImportPreviewTableRow,
} from "@/components/import/import_preview_columns";

type Step = "start" | "map" | "preview" | "done";

const IMPORTABLE = ACCOUNTS.filter(
  (a): a is typeof a & { account_id: number } => a.account_id != null,
);

function kind_from_filename(name: string): ImportSourceKind | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return "excel";
  if (lower.endsWith(".csv")) return "csv";
  return null;
}

function status_label(status: NormalizedImportRow["status"]): string {
  if (status === "duplicate") return "Duplicate";
  if (status === "needs_review") return "Needs review";
  return "New";
}

function to_preview_rows(rows: NormalizedImportRow[]): ImportPreviewTableRow[] {
  return rows.map((row) => ({
    date: row.txn_at.slice(0, 10),
    txn_type: row.txn_type,
    detail: row.detail,
    description: row.description,
    in_sen: row.in_sen,
    out_sen: row.out_sen,
    balance_sen: row.balance_sen,
    import_status: status_label(row.status),
  }));
}

function suggest_account_from_pdf_text(
  text: string,
  current_ref: string,
): string | null {
  const meta = extract_pbe_card_meta(text);
  if (meta.suggested_account_ref) return meta.suggested_account_ref;
  const bias = current_ref || IMPORTABLE[0]?.account_ref || "PBE_SAVINGS";
  const { parser_id } = parse_statement_text(text, bias);
  if (parser_id === "tng_text") {
    return text.toUpperCase().includes("GO+")
      ? "TNG_GO_PLUS"
      : "TNG_EWALLET";
  }
  return null;
}

export function ImportWizard() {
  const [step, set_step] = useState<Step>("start");
  const [account_ref, set_account_ref] = useState("");
  const [file, set_file] = useState<File | null>(null);
  const [source_kind, set_source_kind] = useState<ImportSourceKind | null>(null);
  const [pdf_text_cache, set_pdf_text_cache] = useState<string | null>(null);
  const [headers, set_headers] = useState<string[]>([]);
  const [mapping, set_mapping] = useState<SpreadsheetColumnMapping | null>(null);
  const [rows, set_rows] = useState<NormalizedImportRow[]>([]);
  const [parser_id, set_parser_id] = useState<string | null>(null);
  const [ocr_pages, set_ocr_pages] = useState(0);
  const [busy, set_busy] = useState(false);
  const [detecting, set_detecting] = useState(false);
  const [error, set_error] = useState<string | null>(null);
  const [result, set_result] = useState<ImportConfirmResult | null>(null);

  const account = useMemo(
    () => IMPORTABLE.find((a) => a.account_ref === account_ref),
    [account_ref],
  );
  const account_id = account?.account_id;
  const can_parse = Boolean(file && account_ref && account_id != null);

  const counts = useMemo(() => {
    const new_count = rows.filter((r) => r.status === "new").length;
    const dup = rows.filter((r) => r.status === "duplicate").length;
    const review = rows.filter((r) => r.status === "needs_review").length;
    return { new_count, dup, review };
  }, [rows]);

  const assign_file = useCallback(
    async (f: File) => {
      const kind = kind_from_filename(f.name);
      if (!kind) {
        set_error("Use .xlsx, .xls, .csv, or .pdf");
        return;
      }
      set_file(f);
      set_source_kind(kind);
      set_pdf_text_cache(null);
      set_error(null);
      if (kind === "pdf") {
        set_detecting(true);
        try {
          const buffer = await f.arrayBuffer();
          const { text, ocr_pages: ocr } = await extract_pdf_text_local(buffer);
          set_pdf_text_cache(text);
          set_ocr_pages(ocr);
          const suggested = suggest_account_from_pdf_text(text, account_ref);
          if (suggested) set_account_ref(suggested);
        } catch {
          /* user can still parse after choosing account */
        } finally {
          set_detecting(false);
        }
      }
    },
    [account_ref],
  );

  const run_dedupe = useCallback(
    async (parsed: NormalizedImportRow[]) => {
      if (account_id == null) return;
      const res = await fetch("/api/import/dedupe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id,
          account_ref,
          rows: parsed,
        }),
      });
      const body = (await res.json()) as {
        rows?: NormalizedImportRow[];
        error?: string;
      };
      if (!res.ok) throw new Error(body.error ?? "Dedupe failed");
      set_rows(body.rows ?? []);
      set_step("preview");
    },
    [account_id, account_ref],
  );

  const parse_file = useCallback(async () => {
    if (!file || !account || !source_kind || account_id == null) return;
    set_busy(true);
    set_error(null);
    try {
      const buffer = await file.arrayBuffer();
      if (source_kind === "excel" || source_kind === "csv") {
        const saved = load_column_mapping(account_ref);
        if (source_kind === "excel") {
          const out = await parse_excel_buffer(buffer, saved ?? undefined);
          set_headers(out.headers);
          set_mapping(out.mapping);
          if (!saved && out.headers.length > 0) {
            set_rows(out.rows);
            set_step("map");
            return;
          }
          save_column_mapping(account_ref, out.mapping);
          await run_dedupe(out.rows);
        } else {
          const text = new TextDecoder().decode(buffer);
          const out = parse_csv_text(text, saved ?? undefined);
          set_headers(out.headers);
          set_mapping(out.mapping);
          if (!saved && out.headers.length > 0) {
            set_rows(out.rows);
            set_step("map");
            return;
          }
          save_column_mapping(account_ref, out.mapping);
          await run_dedupe(out.rows);
        }
      } else if (source_kind === "pdf") {
        let text = pdf_text_cache;
        let ocr = ocr_pages;
        if (!text) {
          const extracted = await extract_pdf_text_local(buffer);
          text = extracted.text;
          ocr = extracted.ocr_pages;
          set_pdf_text_cache(text);
        }
        set_ocr_pages(ocr);
        const { parser_id: pid, rows: parsed } = parse_statement_text(
          text,
          account_ref,
        );
        set_parser_id(pid);
        const kind: ImportSourceKind =
          account.kind.startsWith("tng") && pid === "tng_text"
            ? "tng_text"
            : "pdf";
        set_source_kind(kind);
        await run_dedupe(parsed);
      }
    } catch (err) {
      set_error(err instanceof Error ? err.message : "Parse failed");
    } finally {
      set_busy(false);
    }
  }, [
    file,
    account,
    source_kind,
    account_ref,
    account_id,
    run_dedupe,
    pdf_text_cache,
    ocr_pages,
  ]);

  const apply_mapping = useCallback(async () => {
    if (!file || !mapping || !source_kind) return;
    if (source_kind !== "excel" && source_kind !== "csv") return;
    set_busy(true);
    set_error(null);
    try {
      save_column_mapping(account_ref, mapping);
      const buffer = await file.arrayBuffer();
      if (source_kind === "excel") {
        const out = await parse_excel_buffer(buffer, mapping);
        set_headers(out.headers);
        set_mapping(out.mapping);
        await run_dedupe(out.rows);
      } else {
        const text = new TextDecoder().decode(buffer);
        const out = parse_csv_text(text, mapping);
        set_headers(out.headers);
        set_mapping(out.mapping);
        await run_dedupe(out.rows);
      }
    } catch (err) {
      set_error(err instanceof Error ? err.message : "Re-parse failed");
    } finally {
      set_busy(false);
    }
  }, [file, mapping, source_kind, account_ref, run_dedupe]);

  const confirm_import = useCallback(async () => {
    if (!account?.account_id || !file || !source_kind) return;
    set_busy(true);
    set_error(null);
    try {
      const payload = rows.map((row) => ({
        temp_id: row.temp_id,
        txn_at: row.txn_at,
        description: row.description,
        detail: row.detail,
        txn_type: row.txn_type,
        direction: row.direction,
        amount_major: row.amount_major,
        balance_after_major: row.balance_after_major,
      }));
      const res = await fetch("/api/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: account.account_id,
          account_ref,
          source_filename: file.name,
          source_kind,
          rows: payload,
        }),
      });
      const body = (await res.json()) as ImportConfirmResult & { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Import failed");
      set_result(body);
      set_step("done");
    } catch (err) {
      set_error(err instanceof Error ? err.message : "Import failed");
    } finally {
      set_busy(false);
    }
  }, [account, file, source_kind, rows, account_ref]);

  const on_drop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (!f) return;
    void assign_file(f);
  };

  const file_input_id = "import-statement-file";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      {step === "start" ? (
        <section className="rounded-[3px] border border-zyfn-line bg-white p-5">
          <h2 className="text-sm font-semibold text-zyfn-navy">
            1. Account &amp; statement
          </h2>
          <p className="mt-1 text-[13px] text-slate-600">
            Imports are insert-only. Existing rows are never updated or deleted.
            Upload a PDF to auto-detect PBE card accounts from the last four digits.
          </p>
          <div className="mt-4 grid gap-5 md:grid-cols-2 md:items-start">
            <div>
              <label
                htmlFor="import-account"
                className="text-[13px] font-medium text-slate-700"
              >
                Account
              </label>
              <select
                id="import-account"
                className="mt-2 h-10 w-full rounded-[3px] border border-zyfn-line px-3 text-[13px]"
                value={account_ref}
                onChange={(e) => set_account_ref(e.target.value)}
              >
                <option value="">Select account…</option>
                {IMPORTABLE.map((a) => (
                  <option key={a.account_ref} value={a.account_ref}>
                    {a.account_label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="text-[13px] font-medium text-slate-700">File</span>
              <div
                className="mt-2 flex min-h-[140px] flex-col items-center justify-center rounded-[3px] border border-dashed border-[#b8c2cf] bg-[#f8f9fb] px-4 py-8 text-center"
                onDragOver={(e) => e.preventDefault()}
                onDrop={on_drop}
              >
                <Upload className="mb-2 size-8 text-slate-400" aria-hidden />
                <p className="text-[13px] text-slate-600">
                  Drag and drop .xlsx, .xls, .csv, or .pdf
                </p>
                <label
                  htmlFor={file_input_id}
                  className="mt-3 cursor-pointer text-[13px] font-medium text-sky-700 hover:underline"
                >
                  Browse files
                </label>
                <input
                  id={file_input_id}
                  type="file"
                  className="sr-only"
                  accept=".xlsx,.xls,.csv,.pdf,application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void assign_file(f);
                  }}
                />
                {file ? (
                  <p className="mt-2 text-xs text-slate-500">{file.name}</p>
                ) : null}
                {detecting ? (
                  <p className="mt-2 text-xs text-slate-500">Detecting account…</p>
                ) : null}
              </div>
            </div>
          </div>
          <div className="mt-5">
            <button
              type="button"
              className="rounded-[3px] border border-zyfn-navy bg-zyfn-navy px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
              disabled={!can_parse || busy || detecting}
              onClick={() => void parse_file()}
            >
              {busy ? "Parsing…" : "Parse & preview"}
            </button>
          </div>
        </section>
      ) : null}

      {step === "map" && mapping && headers.length > 0 ? (
        <section className="rounded-[3px] border border-zyfn-line bg-white p-5">
          <h2 className="text-sm font-semibold text-zyfn-navy">
            2. Column mapping
          </h2>
          <p className="mt-1 text-[13px] text-slate-600">
            Adjust headers if needed. Mapping is saved per account in this browser.
          </p>
          <div className="mt-4">
            <ColumnMappingForm
              headers={headers}
              mapping={mapping}
              on_change={set_mapping}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="rounded-[3px] border border-zyfn-line px-4 py-2 text-[13px] hover:bg-slate-50"
              onClick={() => set_step("start")}
            >
              Back
            </button>
            <button
              type="button"
              className="rounded-[3px] border border-zyfn-navy bg-zyfn-navy px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
              disabled={busy}
              onClick={() => void apply_mapping()}
            >
              {busy ? "Applying…" : "Apply mapping & preview"}
            </button>
          </div>
        </section>
      ) : null}

      {step === "preview" ? (
        <>
          <section className="rounded-[3px] border border-zyfn-line bg-white p-5">
            <h2 className="text-sm font-semibold text-zyfn-navy">
              3. Import preview
            </h2>
            <p className="mt-1 text-[13px] text-slate-600">
              {counts.new_count} new · {counts.dup} duplicate · {counts.review}{" "}
              needs review
              {parser_id ? ` · parser: ${parser_id}` : ""}
              {ocr_pages > 0 ? ` · OCR pages: ${ocr_pages}` : ""}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-[3px] border border-zyfn-line px-4 py-2 text-[13px] hover:bg-slate-50"
                onClick={() => {
                  set_step("start");
                  set_rows([]);
                }}
              >
                Start over
              </button>
              <button
                type="button"
                className="rounded-[3px] border border-zyfn-navy bg-zyfn-navy px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
                disabled={busy || counts.new_count === 0}
                onClick={() => void confirm_import()}
              >
                {busy ? "Importing…" : `Confirm import (${counts.new_count} new)`}
              </button>
            </div>
          </section>
          <AccountTableCard title="Parsed rows" fill_height>
            <DataTable
              label="Import preview"
              scope={`import-${account_ref}`}
              columns={IMPORT_PREVIEW_COLUMNS}
              rows={to_preview_rows(rows)}
              date_key="date"
              fill_height
              export_account_label={account?.account_label ?? "import"}
            />
          </AccountTableCard>
        </>
      ) : null}

      {step === "done" && result ? (
        <section className="rounded-[3px] border border-zyfn-line bg-white p-5">
          <h2 className="text-sm font-semibold text-zyfn-navy">4. Import complete</h2>
          <p className="mt-2 text-[13px] text-slate-700">
            Inserted {result.inserted} row(s). Skipped {result.skipped_duplicates}{" "}
            duplicate(s).
            {result.batch_id ? ` Batch #${result.batch_id}.` : ""}
          </p>
          {result.error ? (
            <p className="mt-2 text-[13px] text-amber-800">{result.error}</p>
          ) : null}
          <button
            type="button"
            className="mt-4 rounded-[3px] border border-zyfn-navy bg-zyfn-navy px-4 py-2 text-[13px] font-medium text-white"
            onClick={() => {
              set_step("start");
              set_file(null);
              set_pdf_text_cache(null);
              set_account_ref("");
              set_rows([]);
              set_result(null);
              set_source_kind(null);
            }}
          >
            Start another import
          </button>
        </section>
      ) : null}

      {error ? (
        <p className="text-[13px] text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}