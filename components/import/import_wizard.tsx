"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FileSpreadsheet, Loader2, Upload, X } from "lucide-react";
import {
  ACCOUNTS,
  account_config_by_ref,
  account_path,
} from "@/lib/accounts/registry";
import {
  group_import_rows_by_account,
  import_account_summaries,
} from "@/lib/import/group_rows_by_account";
import {
  should_show_detected_upload_accounts,
  should_show_upload_account_select,
} from "@/lib/import/import_upload_account";
import type { ImportParsedAccount } from "@/lib/import/types";
import {
  IMPORT_STATUS_CHIP_LABELS,
  parser_display_name,
} from "@/lib/import/import_labels";
import { IMPORT_STATUS_SURFACE } from "@/lib/import/import_status_surface";
import { build_import_preview_export_filename } from "@/lib/export_filename";
import { parse_csv_text, parse_excel_buffer } from "@/lib/import/excel";
import { parse_statement_text } from "@/lib/import/parsers";
import { parse_mbb_card_statement } from "@/lib/import/parsers/mbb_card";
import {
  mbb_savings_is_likely_statement,
  parse_mbb_savings_statement,
} from "@/lib/import/parsers/mbb_savings";
import {
  pbe_savings_is_likely_statement,
  parse_pbe_savings_statement,
} from "@/lib/import/parsers/pbe_savings";
import {
  hlb_savings_is_likely_statement,
  parse_hlb_savings_statement,
} from "@/lib/import/parsers/hlb_savings";
import {
  parse_tng_wallet_statement,
  tng_wallet_is_likely_statement,
} from "@/lib/import/parsers/tng_wallet";
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
import {
  extract_pdf_text_local,
  type PdfDocMeta,
} from "@/lib/import/pdf_extract";
import { pdf_upload_detection_warning } from "@/lib/import/pdf_upload_detection";
import { statement_detection_corpus } from "@/lib/import/statement_detection";
import { AccountTableCard } from "@/components/account_table_card";
import { TransactionDataTable } from "@/components/data_table/transaction_data_table";
import { ColumnMappingForm } from "@/components/import/column_mapping_form";
import { map_import_rows_to_statement_rows } from "@/lib/import/map_preview_rows";
import {
  ImportStepper,
  type ImportWizardStep,
} from "@/components/import/import_stepper";

const IMPORTABLE = ACCOUNTS.filter(
  (a): a is typeof a & { account_id: number } => a.account_id != null,
);

const CARD_SHELL =
  "rounded-[3px] border border-zyfn-line bg-white px-5 py-5";

function kind_from_filename(name: string): ImportSourceKind | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return "excel";
  if (lower.endsWith(".csv")) return "csv";
  return null;
}

function suggest_account_from_pdf_text(
  text: string,
  current_ref: string,
  pdf_meta?: PdfDocMeta | null,
): string | null {
  const meta = extract_pbe_card_meta(text);
  if (meta.suggested_account_ref) return meta.suggested_account_ref;
  const bias = current_ref || IMPORTABLE[0]?.account_ref || "PBE_SAVINGS";
  const { parser_id } = parse_statement_text(text, bias, pdf_meta);
  if (parser_id === "tng_wallet") return "TNG_EWALLET";
  if (parser_id === "tng_text") {
    return text.toUpperCase().includes("GO+")
      ? "TNG_GO_PLUS"
      : "TNG_EWALLET";
  }
  if (parser_id === "mbb_savings") return "MBB_SAVINGS";
  if (parser_id === "pbe_savings") return "PBE_SAVINGS";
  if (parser_id === "hlb_savings") return "HLB";
  return null;
}

function format_file_size(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatChip({
  label,
  value,
  status_key,
}: {
  label: string;
  value: string | number;
  status_key?: NormalizedImportRow["status"];
}) {
  if (status_key) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-[2px] px-2 py-0.5 text-[11px] font-medium ${IMPORT_STATUS_SURFACE[status_key]}`}
      >
        <span>{label}</span>
        <span className="font-semibold">{value}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-[3px] border border-[#dce1e7] bg-white px-2 py-0.5 text-[11px] text-slate-700">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-zyfn-navy">{value}</span>
    </span>
  );
}

export function ImportWizard() {
  const [step, set_step] = useState<ImportWizardStep>("start");
  const [account_ref, set_account_ref] = useState("");
  const [file, set_file] = useState<File | null>(null);
  const [source_kind, set_source_kind] = useState<ImportSourceKind | null>(null);
  const [pdf_text_cache, set_pdf_text_cache] = useState<string | null>(null);
  const [pdf_meta_cache, set_pdf_meta_cache] = useState<PdfDocMeta | null>(null);
  const [headers, set_headers] = useState<string[]>([]);
  const [mapping, set_mapping] = useState<SpreadsheetColumnMapping | null>(null);
  const [rows, set_rows] = useState<NormalizedImportRow[]>([]);
  const [parser_id, set_parser_id] = useState<string | null>(null);
  const [parse_warning, set_parse_warning] = useState<string | null>(null);
  const [upload_detection_warning, set_upload_detection_warning] = useState<
    string | null
  >(null);
  const [ocr_pages, set_ocr_pages] = useState(0);
  const [mapping_skipped, set_mapping_skipped] = useState(false);
  const [busy, set_busy] = useState(false);
  const [detecting, set_detecting] = useState(false);
  const [error, set_error] = useState<string | null>(null);
  const [result, set_result] = useState<ImportConfirmResult | null>(null);
  const [confirm_open, set_confirm_open] = useState(false);
  const [multi_account, set_multi_account] = useState(false);
  const [parsed_accounts, set_parsed_accounts] = useState<ImportParsedAccount[]>(
    [],
  );
  const [done_by_account, set_done_by_account] = useState<
    Array<{ account_label: string; inserted: number; skipped_duplicates: number }>
  >([]);
  const [detected_upload_accounts, set_detected_upload_accounts] = useState<
    ImportParsedAccount[]
  >([]);
  const [account_select_override, set_account_select_override] = useState(false);
  const auto_parse_key_ref = useRef<string | null>(null);

  const show_detected_upload_accounts = should_show_detected_upload_accounts({
    has_file: Boolean(file),
    source_kind,
    detected_accounts: detected_upload_accounts,
    account_select_override,
  });
  const show_upload_account_select = should_show_upload_account_select({
    has_file: Boolean(file),
    source_kind,
    detected_accounts: detected_upload_accounts,
    account_select_override,
  });

  const account = useMemo(
    () => IMPORTABLE.find((a) => a.account_ref === account_ref),
    [account_ref],
  );
  const account_id = account?.account_id;
  const preview_rows = useMemo(
    () => map_import_rows_to_statement_rows(rows),
    [rows],
  );
  const upload_locked = busy || detecting;
  const start_upload_error = Boolean(error && step === "start" && file);
  const include_mapping_step =
    !mapping_skipped &&
    (step === "map" || step === "preview" || step === "done");

  const counts = useMemo(() => {
    const new_count = rows.filter((r) => r.status === "new").length;
    const dup = rows.filter((r) => r.status === "duplicate").length;
    const review = rows.filter((r) => r.status === "needs_review").length;
    return { new_count, dup, review };
  }, [rows]);

  const account_summaries = useMemo(() => {
    if (!multi_account || parsed_accounts.length === 0) return [];
    return import_account_summaries(rows, parsed_accounts);
  }, [multi_account, parsed_accounts, rows]);

  const preview_kind = useMemo(() => {
    if (multi_account && parsed_accounts[0]) {
      return (
        account_config_by_ref(parsed_accounts[0].account_ref)?.kind ??
        "credit_card"
      );
    }
    return account?.kind ?? "credit_card";
  }, [multi_account, parsed_accounts, account?.kind]);

  const show_preview_table = Boolean(
    (multi_account && rows.length > 0) || account,
  );

  const assign_file = useCallback(
    async (f: File) => {
      const kind = kind_from_filename(f.name);
      if (!kind) {
        set_error("Use .xlsx, .xls, .csv, or .pdf");
        return;
      }
      auto_parse_key_ref.current = null;
      set_account_select_override(false);
      set_detected_upload_accounts([]);
      set_file(f);
      set_source_kind(kind);
      set_pdf_text_cache(null);
      set_pdf_meta_cache(null);
      set_parse_warning(null);
      set_upload_detection_warning(null);
      set_error(null);
      if (kind === "excel" || kind === "csv") {
        set_multi_account(false);
        set_parsed_accounts([]);
        set_detected_upload_accounts([]);
        set_account_ref("");
      }
      if (kind === "pdf") {
        set_detecting(true);
        try {
          const buffer = await f.arrayBuffer();
          const { text, ocr_pages: ocr, meta } =
            await extract_pdf_text_local(buffer);
          set_pdf_text_cache(text);
          set_pdf_meta_cache(meta);
          set_ocr_pages(ocr);
          const detection_corpus = statement_detection_corpus(text, meta);
          let detected_account_count = 0;
          const mbb = parse_mbb_card_statement(text);
          if (mbb.accounts.length > 0) {
            set_multi_account(true);
            set_parsed_accounts(mbb.accounts);
            set_detected_upload_accounts(mbb.accounts);
            detected_account_count = mbb.accounts.length;
            if (mbb.accounts.length === 1) {
              set_account_ref(mbb.accounts[0].account_ref);
            } else {
              set_account_ref("");
            }
          } else if (mbb_savings_is_likely_statement(detection_corpus)) {
            const savings = parse_mbb_savings_statement(text);
            set_multi_account(false);
            set_parsed_accounts([]);
            if (savings.account) {
              set_detected_upload_accounts([savings.account]);
              detected_account_count = 1;
              set_account_ref(savings.account.account_ref);
            } else {
              set_detected_upload_accounts([]);
            }
          } else if (hlb_savings_is_likely_statement(detection_corpus)) {
            const hlb = parse_hlb_savings_statement(text);
            set_multi_account(false);
            set_parsed_accounts([]);
            if (hlb.account) {
              set_detected_upload_accounts([hlb.account]);
              detected_account_count = 1;
              set_account_ref(hlb.account.account_ref);
            } else {
              set_detected_upload_accounts([]);
            }
          } else if (pbe_savings_is_likely_statement(detection_corpus)) {
            const pbe_sav = parse_pbe_savings_statement(text);
            set_multi_account(false);
            set_parsed_accounts([]);
            if (pbe_sav.account) {
              set_detected_upload_accounts([pbe_sav.account]);
              detected_account_count = 1;
              set_account_ref(pbe_sav.account.account_ref);
            } else {
              set_detected_upload_accounts([]);
            }
          } else if (tng_wallet_is_likely_statement(text)) {
            const tng = parse_tng_wallet_statement(text);
            set_multi_account(tng.accounts.length > 1);
            set_parsed_accounts(tng.accounts);
            set_detected_upload_accounts(tng.accounts);
            detected_account_count = tng.accounts.length;
            set_account_ref(
              tng.accounts.length === 1 ? tng.accounts[0].account_ref : "",
            );
          } else {
            set_multi_account(false);
            set_parsed_accounts([]);
            const suggested = suggest_account_from_pdf_text(
              text,
              account_ref,
              meta,
            );
            if (suggested) {
              const entry = IMPORTABLE.find((a) => a.account_ref === suggested);
              if (entry?.account_id != null) {
                const chip = {
                  account_id: entry.account_id,
                  account_ref: entry.account_ref,
                  account_label: entry.account_label,
                };
                set_detected_upload_accounts([chip]);
                detected_account_count = 1;
                set_account_ref(suggested);
              } else {
                set_detected_upload_accounts([]);
              }
            } else {
              set_detected_upload_accounts([]);
            }
          }
          set_upload_detection_warning(
            pdf_upload_detection_warning(text, {
              detected_account_count,
              ocr_pages: ocr,
            }),
          );
        } catch {
          set_upload_detection_warning(
            pdf_upload_detection_warning("", {
              detected_account_count: 0,
              ocr_pages: 0,
              extraction_failed: true,
            }),
          );
        } finally {
          set_detecting(false);
        }
      }
    },
    [account_ref],
  );

  const run_dedupe = useCallback(
    async (parsed: NormalizedImportRow[]) => {
      const with_account_ids = parsed.some((r) => r.account_id != null);
      if (with_account_ids) {
        const groups = group_import_rows_by_account(parsed);
        const merged: NormalizedImportRow[] = [];
        for (const [id, group] of groups) {
          const ref = group[0]?.account_ref ?? "";
          const res = await fetch("/api/import/dedupe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              account_id: id,
              account_ref: ref,
              rows: group,
            }),
          });
          const body = (await res.json()) as {
            rows?: NormalizedImportRow[];
            error?: string;
          };
          if (!res.ok) throw new Error(body.error ?? "Dedupe failed");
          merged.push(...(body.rows ?? []));
        }
        set_rows(merged);
        set_step("preview");
        return;
      }
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
    if (!file || !source_kind) return;
    if (!multi_account && (!account || account_id == null)) return;
    set_busy(true);
    set_error(null);
    set_parse_warning(null);
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
            set_mapping_skipped(false);
            set_step("map");
            return;
          }
          set_mapping_skipped(true);
          save_column_mapping(account_ref, out.mapping);
          await run_dedupe(out.rows);
        } else {
          const text = new TextDecoder().decode(buffer);
          const out = parse_csv_text(text, saved ?? undefined);
          set_headers(out.headers);
          set_mapping(out.mapping);
          if (!saved && out.headers.length > 0) {
            set_rows(out.rows);
            set_mapping_skipped(false);
            set_step("map");
            return;
          }
          set_mapping_skipped(true);
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
          set_pdf_meta_cache(extracted.meta);
        }
        set_ocr_pages(ocr);
        const detection_corpus = statement_detection_corpus(
          text,
          pdf_meta_cache,
        );
        const bias_ref =
          account_ref ||
          (pdf_meta_cache && hlb_savings_is_likely_statement(detection_corpus)
            ? "HLB"
            : pdf_meta_cache && pbe_savings_is_likely_statement(detection_corpus)
              ? "PBE_SAVINGS"
              : pdf_meta_cache &&
                  mbb_savings_is_likely_statement(detection_corpus)
                ? "MBB_SAVINGS"
                : "MBB_VISA_1697");
        const {
          parser_id: pid,
          rows: parsed,
          parse_warning: warn,
          parsed_accounts: detected,
        } = parse_statement_text(text, bias_ref, pdf_meta_cache);
        set_parser_id(pid);
        set_parse_warning(warn);
        if (detected && detected.length > 0) {
          set_multi_account(true);
          set_parsed_accounts(detected);
          if (detected.length === 1) {
            set_account_ref(detected[0].account_ref);
          }
        } else {
          set_multi_account(false);
          set_parsed_accounts([]);
        }
        const kind: ImportSourceKind =
          account?.kind.startsWith("tng") && pid === "tng_text"
            ? "tng_text"
            : "pdf";
        set_source_kind(kind);
        set_mapping_skipped(true);
        await run_dedupe(parsed);
      }
    } catch (err) {
      auto_parse_key_ref.current = null;
      set_error(err instanceof Error ? err.message : "Parse failed");
    } finally {
      set_busy(false);
    }
  }, [
    file,
    account,
    multi_account,
    source_kind,
    account_ref,
    account_id,
    run_dedupe,
    pdf_text_cache,
    pdf_meta_cache,
    ocr_pages,
  ]);

  useEffect(() => {
    if (step !== "start") return;
    if (!file || !source_kind) return;
    if (!multi_account && (account_id == null || !account_ref)) return;
    if (upload_locked) return;
    const key = `${multi_account ? "multi" : account_ref}\0${file.name}\0${file.size}\0${file.lastModified}`;
    if (auto_parse_key_ref.current === key) return;
    auto_parse_key_ref.current = key;
    void parse_file();
  }, [
    step,
    file,
    account_id,
    account_ref,
    source_kind,
    upload_locked,
    multi_account,
    parse_file,
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
        set_mapping_skipped(false);
        await run_dedupe(out.rows);
      } else {
        const text = new TextDecoder().decode(buffer);
        const out = parse_csv_text(text, mapping);
        set_headers(out.headers);
        set_mapping(out.mapping);
        set_mapping_skipped(false);
        await run_dedupe(out.rows);
      }
    } catch (err) {
      set_error(err instanceof Error ? err.message : "Re-parse failed");
    } finally {
      set_busy(false);
    }
  }, [file, mapping, source_kind, account_ref, run_dedupe]);

  const confirm_import = useCallback(async () => {
    if (!file || !source_kind) return;
    if (!multi_account && !account?.account_id) return;
    set_busy(true);
    set_error(null);
    try {
      const to_payload = (subset: NormalizedImportRow[]) =>
        subset
          .filter((row) => row.status === "new")
          .map((row) => ({
            temp_id: row.temp_id,
            txn_at: row.txn_at,
            description: row.description,
            detail: row.detail,
            txn_type: row.txn_type,
            direction: row.direction,
            amount_major: row.amount_major,
            balance_after_major: row.balance_after_major,
          }));

      if (multi_account) {
        const groups = group_import_rows_by_account(rows);
        const outcomes: Array<{
          account_label: string;
          inserted: number;
          skipped_duplicates: number;
        }> = [];
        let inserted_total = 0;
        let skipped_total = 0;
        for (const [id, group] of groups) {
          const ref = group[0]?.account_ref ?? "";
          const label =
            account_config_by_ref(ref)?.account_label ?? ref ?? String(id);
          const payload = to_payload(group);
          if (!payload.length) {
            outcomes.push({
              account_label: label,
              inserted: 0,
              skipped_duplicates: group.filter((r) => r.status === "duplicate")
                .length,
            });
            continue;
          }
          const res = await fetch("/api/import/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              account_id: id,
              account_ref: ref,
              source_filename: file.name,
              source_kind,
              rows: payload,
            }),
          });
          const body = (await res.json()) as ImportConfirmResult & {
            error?: string;
          };
          if (!res.ok) throw new Error(body.error ?? `Import failed for ${label}`);
          inserted_total += body.inserted;
          skipped_total += body.skipped_duplicates;
          outcomes.push({
            account_label: label,
            inserted: body.inserted,
            skipped_duplicates: body.skipped_duplicates,
          });
        }
        set_done_by_account(outcomes);
        set_result({
          inserted: inserted_total,
          skipped_duplicates: skipped_total,
          batch_id: null,
        });
        set_step("done");
        return;
      }

      if (!account?.account_id) return;
      const payload = to_payload(rows);
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
      set_done_by_account([]);
      set_result(body);
      set_step("done");
    } catch (err) {
      set_error(err instanceof Error ? err.message : "Import failed");
    } finally {
      set_busy(false);
    }
  }, [account, file, source_kind, rows, account_ref, multi_account]);

  const reset_wizard = () => {
    set_step("start");
    set_file(null);
    set_pdf_text_cache(null);
    set_pdf_meta_cache(null);
    set_account_ref("");
    set_rows([]);
    set_result(null);
    set_source_kind(null);
    set_parser_id(null);
    set_parse_warning(null);
    set_upload_detection_warning(null);
    set_mapping_skipped(false);
    set_error(null);
    set_confirm_open(false);
    set_multi_account(false);
    set_parsed_accounts([]);
    set_done_by_account([]);
    set_detected_upload_accounts([]);
    set_account_select_override(false);
    auto_parse_key_ref.current = null;
  };

  const clear_file = useCallback(() => {
    auto_parse_key_ref.current = null;
    set_file(null);
    set_source_kind(null);
    set_pdf_text_cache(null);
    set_pdf_meta_cache(null);
    set_parse_warning(null);
    set_upload_detection_warning(null);
    set_detecting(false);
    set_error(null);
    set_multi_account(false);
    set_parsed_accounts([]);
    set_detected_upload_accounts([]);
    set_account_select_override(false);
  }, []);

  const on_drop = (e: React.DragEvent) => {
    e.preventDefault();
    if (upload_locked) return;
    const f = e.dataTransfer.files[0];
    if (!f) return;
    void assign_file(f);
  };

  const file_input_id = "import-statement-file";

  return (
    <div className="flex min-h-0 w-full min-w-0 max-w-full flex-col gap-3 lg:h-full lg:overflow-hidden">
      <ImportStepper
        current={step}
        include_mapping_step={include_mapping_step}
      />

      {step === "preview" ? (
        <div className="flex flex-col gap-3 max-lg:h-auto lg:min-h-0 lg:flex-1 lg:overflow-hidden">
          <section className={`${CARD_SHELL} shrink-0 py-4`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-zyfn-navy">
                  Review transactions
                </h2>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {multi_account && account_summaries.length > 0 ? (
                    account_summaries.map((summary) => (
                      <span
                        key={summary.account_ref}
                        className="inline-flex flex-wrap items-center gap-1 rounded-[3px] border border-[#dce1e7] bg-[#f8f9fb] px-2 py-0.5 text-[11px] text-slate-700"
                      >
                        <span className="font-medium text-zyfn-navy">
                          {summary.account_label}
                        </span>
                        <span className="text-slate-500">
                          New {summary.new_count}
                        </span>
                        <span className="text-slate-500">
                          Existing {summary.duplicate_count}
                        </span>
                        <span className="text-slate-500">
                          Need check {summary.review_count}
                        </span>
                      </span>
                    ))
                  ) : (
                    <>
                      <StatChip
                        label={IMPORT_STATUS_CHIP_LABELS.new}
                        value={counts.new_count}
                        status_key="new"
                      />
                      <StatChip
                        label={IMPORT_STATUS_CHIP_LABELS.duplicate}
                        value={counts.dup}
                        status_key="duplicate"
                      />
                      <StatChip
                        label={IMPORT_STATUS_CHIP_LABELS.needs_review}
                        value={counts.review}
                        status_key="needs_review"
                      />
                    </>
                  )}
                  {parser_id ? (
                    <StatChip
                      label="Format"
                      value={parser_display_name(parser_id)}
                    />
                  ) : null}
                  {ocr_pages > 0 ? (
                    <StatChip label="OCR pages" value={ocr_pages} />
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  className="rounded-[3px] border border-zyfn-line px-3 py-1.5 text-[13px] hover:bg-slate-50"
                  onClick={reset_wizard}
                >
                  Upload another file
                </button>
                <button
                  type="button"
                  className="rounded-[3px] border border-zyfn-navy bg-zyfn-navy px-3 py-1.5 text-[13px] font-medium text-white disabled:opacity-50"
                  disabled={busy || counts.new_count === 0}
                  onClick={() => set_confirm_open(true)}
                >
                  {busy
                    ? "Saving…"
                    : counts.new_count === 0
                      ? "Nothing to save"
                      : `Save ${counts.new_count} transactions`}
                </button>
              </div>
            </div>
            {parse_warning ? (
              <p className="mt-2 text-[13px] text-amber-800" role="alert">
                {parse_warning}
              </p>
            ) : null}
            {rows.length === 0 && !parse_warning ? (
              <p className="mt-2 text-[13px] text-zyfn-muted">
                No rows to import. Go back and try another file or account.
              </p>
            ) : null}
          </section>
          {show_preview_table ? (
            <AccountTableCard title="Parsed rows" fill_height>
              <TransactionDataTable
                label="Import preview"
                scope={
                  multi_account
                    ? "import-mbb-combined"
                    : `import-${account_ref}`
                }
                rows={preview_rows}
                kind={preview_kind}
                show_import_status
                show_account_column={multi_account}
                export_all_rows
                resolve_export_filename={() =>
                  build_import_preview_export_filename(
                    multi_account
                      ? "maybank_credit_cards"
                      : (account?.account_label ?? "import"),
                  )
                }
                fill_height
                export_account_label={
                  multi_account
                    ? "Maybank credit cards"
                    : account?.account_label
                }
                empty_period_message="No parsed rows to display."
              />
            </AccountTableCard>
          ) : null}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      {step === "start" ? (
        <section className={CARD_SHELL}>
          <h2 className="text-sm font-semibold text-zyfn-navy">
            Upload statement
          </h2>
          <p className="mt-1 text-[13px] text-zyfn-muted">
            Insert-only import; PDFs can auto-detect the bank or wallet account.
          </p>
          <div className="mt-4 flex flex-col gap-4">
              {show_detected_upload_accounts || show_upload_account_select ? (
                <div>
                  {show_detected_upload_accounts ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-medium text-slate-700">
                        Account
                      </span>
                      {detected_upload_accounts.map((detected) => (
                        <span
                          key={detected.account_ref}
                          className="inline-flex items-center rounded-[3px] border border-[#dce1e7] bg-[#f8f9fb] px-2 py-1 text-[12px] font-medium text-zyfn-navy"
                        >
                          {detected.account_label}
                        </span>
                      ))}
                      <button
                        type="button"
                        className="text-[12px] font-medium text-sky-700 hover:underline"
                        disabled={upload_locked}
                        onClick={() => set_account_select_override(true)}
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <>
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
                        disabled={upload_locked}
                        onChange={(e) => {
                          set_account_ref(e.target.value);
                          if (account_select_override) {
                            auto_parse_key_ref.current = null;
                          }
                        }}
                      >
                        <option value="">Select account…</option>
                        {IMPORTABLE.map((a) => (
                          <option key={a.account_ref} value={a.account_ref}>
                            {a.account_label}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
              ) : null}
              {upload_detection_warning ? (
                <p
                  className="text-[13px] text-amber-800"
                  role="alert"
                >
                  {upload_detection_warning}
                </p>
              ) : null}
              <div>
                <span
                  id="import-file-label"
                  className="text-[13px] font-medium text-slate-700"
                >
                  Statement file (PDF, Excel or CSV)
                </span>
                <input
                  id={file_input_id}
                  type="file"
                  className="sr-only"
                  accept=".xlsx,.xls,.csv,.pdf,application/pdf"
                  disabled={upload_locked}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void assign_file(f);
                    e.target.value = "";
                  }}
                />
                {file && upload_locked ? (
                  <div
                    className="mt-2 flex h-28 flex-col items-center justify-center gap-2 rounded-[3px] border border-dashed border-[#b8c2cf] bg-[#f8f9fb] px-4 text-center"
                    aria-labelledby="import-file-label"
                    aria-busy
                  >
                    <Loader2
                      className="size-7 animate-spin text-zyfn-navy"
                      aria-hidden
                    />
                    <p className="text-[13px] font-medium text-slate-700">
                      Reading {file.name}…
                    </p>
                    {detecting && !busy ? (
                      <p className="text-[11px] text-zyfn-muted">
                        Detecting account…
                      </p>
                    ) : null}
                  </div>
                ) : file && start_upload_error ? (
                  <div
                    className="mt-2 flex h-28 flex-col items-center justify-center gap-2 rounded-[3px] border border-dashed border-[#e0abab] bg-[#fffbfb] px-4 text-center"
                    aria-labelledby="import-file-label"
                  >
                    <p className="text-[13px] text-zyfn-red" role="alert">
                      {error}
                    </p>
                    <label
                      htmlFor={file_input_id}
                      className="cursor-pointer text-[13px] font-medium text-sky-700 hover:underline"
                    >
                      Choose another file
                    </label>
                    <button
                      type="button"
                      className="text-[12px] text-zyfn-muted underline-offset-2 hover:underline"
                      onClick={clear_file}
                    >
                      Remove file
                    </button>
                  </div>
                ) : file ? (
                  <div
                    className="mt-2 flex h-14 items-center gap-3 rounded-[3px] border border-zyfn-line bg-white px-3"
                    aria-labelledby="import-file-label"
                  >
                    <FileSpreadsheet
                      className="size-5 shrink-0 text-slate-500"
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium leading-tight text-slate-800">
                        {file.name}
                      </p>
                      <p className="truncate text-[11px] leading-tight text-zyfn-muted">
                        {format_file_size(file.size)}
                        {show_upload_account_select && !account_ref
                          ? " · Select an account to continue"
                          : ""}
                      </p>
                    </div>
                    {account ? (
                      <span className="hidden max-w-[9rem] shrink-0 truncate rounded-[3px] border border-[#dce1e7] bg-[#f8f9fb] px-2 py-0.5 text-[11px] font-medium text-zyfn-navy sm:inline">
                        {account.account_label}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      className="inline-flex size-7 shrink-0 items-center justify-center rounded-[3px] border border-zyfn-line bg-white text-slate-600 hover:bg-slate-50"
                      aria-label="Remove file"
                      onClick={clear_file}
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                  </div>
                ) : (
                  <div
                    className="mt-2 flex h-28 flex-col items-center justify-center rounded-[3px] border border-dashed border-[#b8c2cf] bg-[#f8f9fb] px-4 text-center"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={on_drop}
                    aria-labelledby="import-file-label"
                  >
                    <Upload className="mb-1.5 size-7 text-slate-400" aria-hidden />
                    <p className="text-[13px] text-slate-600">
                      Drop .xlsx, .xls, .csv, or .pdf
                    </p>
                    <label
                      htmlFor={file_input_id}
                      className="mt-1.5 cursor-pointer text-[13px] font-medium text-sky-700 hover:underline"
                    >
                      Browse files
                    </label>
                  </div>
                )}
                {!file && error ? (
                  <p className="mt-2 text-[13px] text-zyfn-red" role="alert">
                    {error}
                  </p>
                ) : null}
              </div>
            </div>
        </section>
      ) : null}

      {step === "map" && mapping && headers.length > 0 ? (
        <section className={CARD_SHELL}>
          <h2 className="text-sm font-semibold text-zyfn-navy">
            2. Column mapping
          </h2>
          <p className="mt-1 text-[13px] text-zyfn-muted">
            Match spreadsheet headers to ledger fields.
          </p>
          <div className="mt-4">
            <ColumnMappingForm
              headers={headers}
              mapping={mapping}
              on_change={set_mapping}
            />
          </div>
          <div className="mt-5 flex justify-end gap-2 border-t border-zyfn-line pt-4">
            <button
              type="button"
              className="rounded-[3px] border border-zyfn-line px-4 py-2 text-[13px] hover:bg-slate-50"
              onClick={() => {
                auto_parse_key_ref.current = null;
                set_step("start");
              }}
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

      {step === "done" && result && (multi_account || account) ? (
        <section className={CARD_SHELL}>
          {multi_account && done_by_account.length > 0 ? (
            <>
              <p className="text-[15px] font-medium text-zyfn-navy">
                Saved {result.inserted} transaction
                {result.inserted === 1 ? "" : "s"} across{" "}
                {done_by_account.length} accounts
              </p>
              <ul className="mt-2 space-y-1 text-[13px] text-slate-700">
                {done_by_account.map((item) => (
                  <li key={item.account_label}>
                    {item.account_label}: {item.inserted} saved
                    {item.skipped_duplicates > 0
                      ? ` · ${item.skipped_duplicates} existing`
                      : ""}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-[15px] font-medium text-zyfn-navy">
              Saved {result.inserted} transaction
              {result.inserted === 1 ? "" : "s"} to {account?.account_label}
            </p>
          )}
          {result.skipped_duplicates > 0 && !multi_account ? (
            <p className="mt-1 text-[13px] text-zyfn-muted">
              {result.skipped_duplicates} row
              {result.skipped_duplicates === 1 ? "" : "s"} were already saved
              and left unchanged.
            </p>
          ) : null}
          {result.error ? (
            <p className="mt-2 text-[13px] text-amber-800">{result.error}</p>
          ) : null}
          <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-zyfn-line pt-4">
            {multi_account
              ? parsed_accounts.map((parsed) => {
                  const entry = IMPORTABLE.find(
                    (a) => a.account_ref === parsed.account_ref,
                  );
                  if (!entry) return null;
                  return (
                    <Link
                      key={parsed.account_ref}
                      href={account_path(entry)}
                      className="rounded-[3px] border border-zyfn-navy bg-zyfn-navy px-4 py-2 text-[13px] font-medium text-white"
                    >
                      {parsed.account_label}
                    </Link>
                  );
                })
              : account ? (
                  <Link
                    href={account_path(account)}
                    className="rounded-[3px] border border-zyfn-navy bg-zyfn-navy px-4 py-2 text-[13px] font-medium text-white"
                  >
                    View account
                  </Link>
                ) : null}
            <button
              type="button"
              className="rounded-[3px] border border-zyfn-line px-4 py-2 text-[13px] hover:bg-slate-50"
              onClick={reset_wizard}
            >
              Upload another file
            </button>
          </div>
        </section>
      ) : null}
        </div>
      )}

      {confirm_open && (multi_account ? parsed_accounts.length > 0 : account) ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#132238]/44 p-4"
          role="presentation"
          onClick={() => !busy && set_confirm_open(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-confirm-title"
            className="w-full max-w-md rounded-[3px] border border-zyfn-line bg-white p-5 shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="import-confirm-title"
              className="text-sm font-semibold text-zyfn-navy"
            >
              Save transactions?
            </h2>
            {multi_account && account_summaries.length > 0 ? (
              <ul className="mt-2 space-y-1.5 text-[13px] text-slate-700">
                {account_summaries.map((summary) => (
                  <li key={summary.account_ref}>
                    Add {summary.new_count} transaction
                    {summary.new_count === 1 ? "" : "s"} to{" "}
                    {summary.account_label}
                  </li>
                ))}
                <li className="text-zyfn-muted">
                  Existing records will not be changed.
                </li>
              </ul>
            ) : (
              <p className="mt-2 text-[13px] text-slate-700">
                Add {counts.new_count} transaction
                {counts.new_count === 1 ? "" : "s"} to {account?.account_label}?
                Existing records will not be changed.
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-[3px] border border-zyfn-line px-4 py-2 text-[13px] hover:bg-slate-50"
                disabled={busy}
                onClick={() => set_confirm_open(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-[3px] border border-zyfn-navy bg-zyfn-navy px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
                disabled={busy}
                onClick={() => {
                  set_confirm_open(false);
                  void confirm_import();
                }}
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {error && step !== "start" ? (
        <p className="shrink-0 text-[13px] text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}