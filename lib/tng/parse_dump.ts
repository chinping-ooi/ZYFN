import { parse_date_cell } from "@/lib/workbook/date_parse";
import {
  display_dp_for_account,
  major_text_to_micro,
  micro_to_sen_display,
  type MicroAmount,
} from "@/lib/tng/money_micro";
import { classify_tng_direction } from "@/lib/tng/direction";
import { normalize_tng_type } from "@/lib/tng/normalize_type";
import type {
  ParsedTngDump,
  ReconcileWarning,
  SkippedTngRecord,
  TngAccount,
  TngLedgerRow,
} from "@/lib/tng/types";

const DISCLAIMER = [
  "system generated email",
  "do not reply",
  "further enquiry",
  "operating hours",
  "including public holidays",
  "thank you.",
];

const RECORD_START =
  /^\d{1,2}\/\d{1,2}\/\d{4}\s+(Success|Pending|Failed)/i;

const RM_PAIR_END = /RM\s?([\d,.]+)\s+RM\s?([\d,.]+)\s*$/i;

function parse_dmy_to_iso(dmy: string): string {
  return parse_date_cell(dmy);
}

function parse_rm_pair(
  line: string,
  account: TngAccount,
): { amount_micro: MicroAmount; balance_micro: MicroAmount } {
  const match = line.match(RM_PAIR_END);
  if (!match) throw new Error("Amount line must contain two RM values");
  const max_dp = display_dp_for_account(account);
  const amount_micro = major_text_to_micro(match[1].replace(/,/g, ""), max_dp);
  const balance_micro = major_text_to_micro(match[2].replace(/,/g, ""), max_dp);
  return { amount_micro, balance_micro };
}

function find_amount_line(
  lines: string[],
): { line: string; line_index: number } | null {
  for (let i = lines.length - 1; i >= 0; i--) {
    if (RM_PAIR_END.test(lines[i])) {
      return { line: lines[i], line_index: i };
    }
  }
  return null;
}

function parse_header_line(line: string): {
  date_dmy: string;
  status: string;
  raw_type: string;
  reference: string;
} {
  const go_plus_line = line.match(
    /^(\d{1,2}\/\d{1,2}\/\d{4})\s+(Success|Pending|Failed)\s+(GO\+.*?)(?:\s+(\S+))?\s*$/i,
  );
  if (go_plus_line) {
    return {
      date_dmy: go_plus_line[1],
      status: go_plus_line[2],
      raw_type: go_plus_line[3].trim(),
      reference: (go_plus_line[4] ?? "").trim(),
    };
  }

  const strict = line.match(
    /^(\d{1,2}\/\d{1,2}\/\d{4})\s+(Success|Pending|Failed)\s+(.*?)\s+(\S+)$/i,
  );
  if (strict) {
    return {
      date_dmy: strict[1],
      status: strict[2],
      raw_type: strict[3].trim(),
      reference: strict[4].trim(),
    };
  }
  const parts = line.split(/\s+/);
  if (parts.length < 3) throw new Error("Header line too short");
  return {
    date_dmy: parts[0],
    status: parts[1],
    raw_type: parts.slice(2, -1).join(" ") || "Unknown",
    reference: parts[parts.length - 1] ?? "",
  };
}

function build_description(inner_lines: string[]): string {
  const description_lines: string[] = [];
  for (const line of inner_lines) {
    if (RM_PAIR_END.test(line)) continue;
    const is_long_id = /\d{20,}/.test(line);
    const has_content = line.replace(/[^a-zA-Z]/g, "").length > 5;
    if (has_content && !is_long_id) {
      description_lines.push(line.replace(/\d{20,}/g, "").trim());
    }
  }
  return description_lines.join(" ").trim();
}

function split_records(raw: string): string[][] {
  const all_lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) =>
        line && !DISCLAIMER.some((kw) => line.toLowerCase().includes(kw)),
    );

  if (all_lines.length && all_lines[0].toLowerCase().includes("date status")) {
    all_lines.shift();
  }

  const groups: string[][] = [];
  let current: string[] = [];

  for (let i = 0; i < all_lines.length; i++) {
    const line = all_lines[i];
    if (RECORD_START.test(line)) {
      if (current.length) groups.push(current);
      current = [line];
      continue;
    }
    if (
      /^\d{1,2}\/\d{1,2}\/\d{4}\s+(Success|Pending|Failed)\s+DUITNOW_\w+$/i.test(
        line,
      ) &&
      i + 1 < all_lines.length &&
      /^[A-Z0-9_]+$/i.test(all_lines[i + 1])
    ) {
      if (current.length) groups.push(current);
      current = [`${line} ${all_lines[i + 1]}`];
      i += 1;
      continue;
    }
    if (current.length) current.push(line);
  }
  if (current.length) groups.push(current);

  return groups;
}

function account_for_type(raw_type: string): TngAccount {
  return raw_type.toLowerCase().includes("go+ daily") ? "go_plus" : "wallet";
}

function is_success_status(status: string): boolean {
  return /^success$/i.test(status.trim());
}

function assign_movement(
  normalized_type: string,
  raw_type: string,
  description: string,
  amount_micro: MicroAmount,
  account: TngAccount,
  direction: ReturnType<typeof classify_tng_direction>,
): Pick<TngLedgerRow, "debit_micro" | "credit_micro" | "direction"> {
  const type = raw_type.toLowerCase();
  const desc = description.toLowerCase();

  if (account === "go_plus") {
    return {
      direction: "in",
      debit_micro: 0,
      credit_micro: amount_micro,
    };
  }

  if (type.includes("ewallet cash out")) {
    return { direction: "transfer", debit_micro: amount_micro, credit_micro: 0 };
  }

  if (direction === "transfer") {
    if (type.includes("go+ cash in")) {
      return { direction, debit_micro: amount_micro, credit_micro: 0 };
    }
    if (desc.includes("quick reload payment") || type.includes("go+ cash out")) {
      return { direction, debit_micro: 0, credit_micro: amount_micro };
    }
    if (normalized_type === "FPX") {
      return { direction, debit_micro: amount_micro, credit_micro: 0 };
    }
    return { direction, debit_micro: amount_micro, credit_micro: 0 };
  }

  if (direction === "in") {
    return { direction, debit_micro: 0, credit_micro: amount_micro };
  }
  return { direction, debit_micro: amount_micro, credit_micro: 0 };
}

function row_sen_fields(micro: {
  debit_micro: number;
  credit_micro: number;
  balance_micro: number;
}) {
  return {
    debit_sen: micro_to_sen_display(micro.debit_micro),
    credit_sen: micro_to_sen_display(micro.credit_micro),
    balance_sen: micro_to_sen_display(micro.balance_micro),
  };
}

export function parse_tng_dump(raw: string): ParsedTngDump {
  const groups = split_records(raw);
  const rows: TngLedgerRow[] = [];
  const skipped_records: SkippedTngRecord[] = [];
  const reconcile_warnings: ReconcileWarning[] = [];

  let wallet_running: MicroAmount | null = null;
  let go_running: MicroAmount | null = null;

  groups.forEach((chunk, record_index) => {
    try {
      if (chunk.length < 1) {
        throw new Error("Empty record");
      }
      const header = parse_header_line(chunk[0]);
      const success = is_success_status(header.status);

      if (chunk.length === 1 && !success) {
        const description = normalize_tng_type(header.raw_type, "");
        rows.push({
          date: parse_dmy_to_iso(header.date_dmy),
          status: header.status,
          type: normalize_tng_type(header.raw_type, description),
          reference: header.reference,
          description,
          direction: classify_tng_direction(header.raw_type, description),
          account: account_for_type(header.raw_type),
          debit_micro: 0,
          credit_micro: 0,
          balance_micro: 0,
          affects_totals: false,
          reconcile_ok: true,
          ...row_sen_fields({
            debit_micro: 0,
            credit_micro: 0,
            balance_micro: 0,
          }),
        });
        return;
      }
      const account_guess = account_for_type(header.raw_type);
      const amount_hit = find_amount_line(chunk);

      if (!amount_hit) {
        if (!success) {
          const description =
            build_description(chunk.slice(1)) ||
            normalize_tng_type(header.raw_type, "");
          const normalized_type = normalize_tng_type(
            header.raw_type,
            description,
          );
          const direction = classify_tng_direction(
            header.raw_type,
            description,
          );
          rows.push({
            date: parse_dmy_to_iso(header.date_dmy),
            status: header.status,
            type: normalized_type,
            reference: header.reference,
            description,
            direction,
            account: account_guess,
            debit_micro: 0,
            credit_micro: 0,
            balance_micro: 0,
            affects_totals: false,
            reconcile_ok: true,
            ...row_sen_fields({
              debit_micro: 0,
              credit_micro: 0,
              balance_micro: 0,
            }),
          });
          return;
        }
        throw new Error("Missing RM amount line");
      }

      const inner = chunk.slice(1, amount_hit.line_index);
      const description =
        build_description(inner) || normalize_tng_type(header.raw_type, "");
      const normalized_type = normalize_tng_type(header.raw_type, description);
      const account = account_for_type(header.raw_type);
      const { amount_micro, balance_micro } = parse_rm_pair(
        amount_hit.line,
        account,
      );
      const date = parse_dmy_to_iso(header.date_dmy);
      const direction = classify_tng_direction(header.raw_type, description);
      const movement = assign_movement(
        normalized_type,
        header.raw_type,
        description,
        amount_micro,
        account,
        direction,
      );

      let reconcile_ok = true;
      const affects_totals = success;

      if (success) {
        if (account === "wallet") {
          if (wallet_running !== null) {
            const expected =
              wallet_running -
              movement.debit_micro +
              movement.credit_micro;
            if (expected !== balance_micro) {
              reconcile_ok = false;
              reconcile_warnings.push({
                record_index: record_index + 1,
                account: "wallet",
                reason: `Wallet balance ${balance_micro} ≠ expected ${expected}`,
              });
            }
          }
          wallet_running = balance_micro;
        } else {
          if (go_running !== null) {
            const expected = go_running + movement.credit_micro - movement.debit_micro;
            if (expected !== balance_micro) {
              reconcile_ok = false;
              reconcile_warnings.push({
                record_index: record_index + 1,
                account: "go_plus",
                reason: `GO+ balance ${balance_micro} ≠ expected ${expected}`,
              });
            }
          }
          go_running = balance_micro;
        }
      }

      rows.push({
        date,
        status: header.status,
        type: normalized_type,
        reference: header.reference,
        description,
        account,
        balance_micro,
        affects_totals,
        reconcile_ok,
        ...movement,
        ...row_sen_fields({
          ...movement,
          balance_micro,
        }),
      });
    } catch (error) {
      skipped_records.push({
        record_index: record_index + 1,
        reason: error instanceof Error ? error.message : "Invalid record",
      });
    }
  });

  rows.sort((a, b) => a.date.localeCompare(b.date));

  const wallet_rows = rows.filter(
    (r) => r.account === "wallet" && r.affects_totals,
  );
  const go_rows = rows.filter(
    (r) => r.account === "go_plus" && r.affects_totals,
  );

  const wallet_closing_micro =
    wallet_rows.at(-1)?.balance_micro ??
    rows.find((r) => r.account === "wallet")?.balance_micro ??
    0;
  const go_plus_closing_micro =
    go_rows.at(-1)?.balance_micro ??
    rows.find((r) => r.account === "go_plus")?.balance_micro ??
    0;

  return {
    source: "data.txt",
    loaded_at: new Date().toISOString(),
    wallet_closing_micro,
    go_plus_closing_micro,
    wallet_closing_sen: micro_to_sen_display(wallet_closing_micro),
    go_plus_closing_sen: micro_to_sen_display(go_plus_closing_micro),
    rows,
    skipped_records,
    reconcile_warning_count: reconcile_warnings.length,
    reconcile_warnings,
  };
}